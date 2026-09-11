import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnswerOption, Question, Quiz } from "@/types";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { dbQuizStatusToDomain, domainQuizStatusToDb } from "@/lib/supabase/mappers/status";
import { mapDataError } from "./errors";

/**
 * Quiz Library data access layer (Phase 10C §14) — the one place that talks
 * to `quizzes`/`questions`/`answer_options`. UI components/hooks never call
 * `createClient()`/`.from(...)` directly; they call these functions (reads)
 * or the Server Actions in `app/(trainer)/quizzes/actions.ts` (writes),
 * which delegate here. `owner_id` is always `getCurrentUser()`'s id — never
 * taken from a parameter/client input (§1) — and every read/write still
 * goes through the RLS-scoped client from `lib/supabase/server.ts` (never
 * `admin.ts`), so Trainer A can never reach Trainer B's rows even if this
 * layer had a bug: RLS is the real backstop, this layer is just where the
 * queries live.
 *
 * `AnswerOption.label` (A/B/C/D…) is not a stored column — `answer_options`
 * only has `display_order`; labels are derived from array position on read,
 * exactly like the editors already do for in-memory edits (`relabel()` in
 * `hooks/use-quiz-editor.ts`/`use-assessment-editor.ts`).
 */

const LABELS = ["A", "B", "C", "D", "E", "F"];

type SupaClient = SupabaseClient<Database>;

function toDomainOptions(rows: Database["public"]["Tables"]["answer_options"]["Row"][]): AnswerOption[] {
  return [...rows]
    .sort((a, b) => a.display_order - b.display_order)
    .map((row, i) => ({
      id: row.id,
      label: LABELS[i] ?? String(i + 1),
      text: row.option_text,
      isCorrect: row.is_correct || undefined,
    }));
}

function toDomainQuestion(
  row: Database["public"]["Tables"]["questions"]["Row"],
  optionRows: Database["public"]["Tables"]["answer_options"]["Row"][]
): Question {
  return {
    id: row.id,
    type: row.question_type,
    text: row.question_text,
    imageUrl: row.image_url ?? undefined,
    options: toDomainOptions(optionRows),
    timerSeconds: row.time_limit_seconds ?? (row.question_type === "QUIZ" ? 20 : 15),
    points: row.question_type === "QUIZ" ? row.base_points : undefined,
    order: row.display_order,
    isComplete: true, // recomputed by the editor on load via patchQuestion-style helpers if needed; a saved question was already valid when it landed here in practice (see save-side clamping below)
  };
}

async function fetchQuizWithChildren(
  supabase: SupaClient,
  row: Database["public"]["Tables"]["quizzes"]["Row"]
): Promise<Quiz> {
  const { data: questionRows } = await supabase
    .from("questions")
    .select("*")
    .eq("quiz_id", row.id)
    .order("display_order");
  const questions = questionRows ?? [];
  const questionIds = questions.map((q) => q.id);

  const { data: optionRows } =
    questionIds.length > 0
      ? await supabase.from("answer_options").select("*").in("question_id", questionIds)
      : { data: [] as Database["public"]["Tables"]["answer_options"]["Row"][] };

  return {
    id: row.id,
    title: row.title,
    status: dbQuizStatusToDomain(row.status),
    updatedAt: row.updated_at,
    questions: questions.map((q) =>
      toDomainQuestion(
        q,
        (optionRows ?? []).filter((o) => o.question_id === q.id)
      )
    ),
  };
}

export async function listQuizzesForCurrentUser(): Promise<Quiz[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("quizzes")
    .select("*")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });
  if (!rows) return [];

  return Promise.all(rows.map((row) => fetchQuizWithChildren(supabase, row)));
}

/** `null` covers both "doesn't exist" and "exists but isn't yours" — RLS
 * makes those indistinguishable at the query level, which is the correct,
 * safe behavior (§15 — "403/404/not found hợp lý", never leaking that a
 * row exists for someone else). */
export async function getQuizById(quizId: string): Promise<Quiz | null> {
  const supabase = await createClient();
  const { data: row } = await supabase.from("quizzes").select("*").eq("id", quizId).maybeSingle();
  if (!row) return null;
  return fetchQuizWithChildren(supabase, row);
}

export async function createBlankQuiz(): Promise<{ id: string } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Bạn cần đăng nhập để tạo quiz." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quizzes")
    .insert({ owner_id: user.id, title: "", status: "DRAFT" })
    .select("id")
    .single();
  if (error || !data) return { error: mapDataError(error) };

  return { id: data.id };
}

/** A blank object URL from an in-progress local upload is never persisted
 * (Phase 10C §13 — "không lưu blob/object URL giả"); real Storage upload
 * integration is out of scope this phase. */
function persistableImageUrl(url: string | undefined): string | null {
  if (!url || url.startsWith("blob:")) return null;
  return url;
}

/** Upserts the whole quiz (title/status) + syncs its questions/options to
 * exactly match the given `Quiz` object: existing rows not present anymore
 * are deleted, everything else is upserted by its own (client-generated)
 * id — ids stay stable across saves rather than being regenerated, which
 * matters once anything else ever references them (Live Game persistence,
 * a later phase). This is the one function both the debounced autosave and
 * an explicit "save" action call — see `app/(trainer)/quizzes/actions.ts`. */
export async function saveQuiz(quiz: Quiz): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Bạn cần đăng nhập để lưu quiz." };

  const supabase = await createClient();

  const { error: quizError } = await supabase.from("quizzes").upsert({
    id: quiz.id,
    owner_id: user.id,
    title: quiz.title,
    status: domainQuizStatusToDb(quiz.status),
    updated_at: new Date().toISOString(),
  });
  if (quizError) return { error: mapDataError(quizError) };

  const { data: existingQuestionRows } = await supabase
    .from("questions")
    .select("id")
    .eq("quiz_id", quiz.id);
  const existingQuestionIds = new Set((existingQuestionRows ?? []).map((r) => r.id));
  const currentQuestionIds = new Set(quiz.questions.map((q) => q.id));

  const questionIdsToDelete = [...existingQuestionIds].filter((id) => !currentQuestionIds.has(id));
  if (questionIdsToDelete.length > 0) {
    const { error } = await supabase.from("questions").delete().in("id", questionIdsToDelete);
    if (error) return { error: mapDataError(error) };
  }

  if (quiz.questions.length === 0) return {};

  const questionRows = quiz.questions.map((q) => ({
    id: q.id,
    quiz_id: quiz.id,
    question_type: q.type,
    question_text: q.text,
    image_url: persistableImageUrl(q.imageUrl),
    time_limit_seconds: q.timerSeconds,
    // Clamped, never 0 — the DB's questions_base_points_by_type CHECK
    // constraint requires QUIZ > 0; the editor already defaults every new
    // QUIZ question's points to a positive value, this is a safety net for
    // save-time only, not a UI-facing validation gate (§6).
    base_points: q.type === "QUIZ" ? Math.max(1, q.points ?? 1) : 0,
    display_order: q.order,
  }));
  const { error: qError } = await supabase.from("questions").upsert(questionRows);
  if (qError) return { error: mapDataError(qError) };

  const questionIds = quiz.questions.map((q) => q.id);
  const { data: existingOptionRows } = await supabase
    .from("answer_options")
    .select("id")
    .in("question_id", questionIds);
  const existingOptionIds = new Set((existingOptionRows ?? []).map((r) => r.id));
  const currentOptionIds = new Set(quiz.questions.flatMap((q) => q.options.map((o) => o.id)));

  const optionIdsToDelete = [...existingOptionIds].filter((id) => !currentOptionIds.has(id));
  if (optionIdsToDelete.length > 0) {
    const { error } = await supabase.from("answer_options").delete().in("id", optionIdsToDelete);
    if (error) return { error: mapDataError(error) };
  }

  const optionRows = quiz.questions.flatMap((q) =>
    q.options.map((o, i) => ({
      id: o.id,
      question_id: q.id,
      option_text: o.text,
      display_order: i + 1,
      is_correct: q.type === "QUIZ" ? !!o.isCorrect : false,
    }))
  );
  if (optionRows.length > 0) {
    const { error: oError } = await supabase.from("answer_options").upsert(optionRows);
    if (oError) return { error: mapDataError(oError) };
  }

  return {};
}

export async function deleteQuiz(quizId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("quizzes").delete().eq("id", quizId);
  if (error) return { error: mapDataError(error) };
  return {};
}

const COPY_TITLE_SUFFIX = /\s-\sCopy(?:\s\d+)?$/;

function nextCopyTitle(baseTitle: string, existingTitles: Set<string>): string {
  let n = 1;
  while (true) {
    const candidate = n === 1 ? `${baseTitle} - Copy` : `${baseTitle} - Copy ${n}`;
    if (!existingTitles.has(candidate)) return candidate;
    n++;
  }
}

export async function duplicateQuiz(quizId: string): Promise<{ id: string } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Bạn cần đăng nhập." };

  const source = await getQuizById(quizId);
  if (!source) return { error: "Không tìm thấy quiz." };

  const supabase = await createClient();
  const { data: ownedRows } = await supabase.from("quizzes").select("title").eq("owner_id", user.id);
  const existingTitles = new Set((ownedRows ?? []).map((r) => r.title));
  const baseTitle = source.title.replace(COPY_TITLE_SUFFIX, "").trim() || source.title || "Untitled Quiz";
  const newTitle = nextCopyTitle(baseTitle, existingTitles);

  const newQuizId = crypto.randomUUID();
  const { error: insertQuizError } = await supabase.from("quizzes").insert({
    id: newQuizId,
    owner_id: user.id,
    title: newTitle,
    status: "DRAFT",
  });
  if (insertQuizError) return { error: mapDataError(insertQuizError) };

  const newQuestions: { id: string; original: Question }[] = source.questions.map((q) => ({
    id: crypto.randomUUID(),
    original: q,
  }));

  if (newQuestions.length > 0) {
    const questionRows = newQuestions.map(({ id, original }) => ({
      id,
      quiz_id: newQuizId,
      question_type: original.type,
      question_text: original.text,
      image_url: persistableImageUrl(original.imageUrl),
      time_limit_seconds: original.timerSeconds,
      base_points: original.type === "QUIZ" ? Math.max(1, original.points ?? 1) : 0,
      display_order: original.order,
    }));
    const { error: qError } = await supabase.from("questions").insert(questionRows);
    if (qError) return { error: mapDataError(qError) };

    const optionRows = newQuestions.flatMap(({ id, original }) =>
      original.options.map((o, i) => ({
        id: crypto.randomUUID(),
        question_id: id,
        option_text: o.text,
        display_order: i + 1,
        is_correct: original.type === "QUIZ" ? !!o.isCorrect : false,
      }))
    );
    if (optionRows.length > 0) {
      const { error: oError } = await supabase.from("answer_options").insert(optionRows);
      if (oError) return { error: mapDataError(oError) };
    }
  }

  return { id: newQuizId };
}
