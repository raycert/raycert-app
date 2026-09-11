import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnswerOption, Assessment, Question } from "@/types";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { dbAssessmentStatusToDomain, domainAssessmentStatusToDb } from "@/lib/supabase/mappers/status";
import { getQuestionPoints } from "@/lib/validation/assessment";
import { mapDataError } from "./errors";

/**
 * Assessment (Post-test) data access layer (Phase 10C §14/§8-§12) — mirrors
 * `lib/data/quizzes.ts`'s shape and reasoning exactly, against
 * `assessments`/`assessment_questions`/`assessment_answer_options` instead
 * (the Phase 10A snapshot-model tables — no `question_id` FK back to the
 * Quiz Library; see that migration's comment for why). `getAssessmentById`
 * is called from BOTH trainer routes (owner-scoped RLS) AND the public
 * participant Start/Take/Result + Presenter routes (the
 * `..._select_public_active` RLS policies added alongside this phase, for
 * `status = 'ACTIVE'` rows only) — this file doesn't need to know which
 * caller it is; RLS decides what comes back.
 */

const LABELS = ["A", "B", "C", "D", "E", "F"];

type SupaClient = SupabaseClient<Database>;

function toDomainOptions(
  rows: Database["public"]["Tables"]["assessment_answer_options"]["Row"][]
): AnswerOption[] {
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
  row: Database["public"]["Tables"]["assessment_questions"]["Row"],
  optionRows: Database["public"]["Tables"]["assessment_answer_options"]["Row"][]
): Question {
  return {
    id: row.id,
    type: row.question_type,
    text: row.question_text,
    imageUrl: row.image_url ?? undefined,
    options: toDomainOptions(optionRows),
    // Assessment questions have no question-level timer column at all
    // (Phase 10A migration comment) — 0 here is never read by any
    // Assessment UI (Editor forces showTimer=false), only kept so the
    // shared `Question` shape stays satisfied.
    timerSeconds: 0,
    points: row.question_type === "QUIZ" ? row.points : undefined,
    order: row.display_order,
    isComplete: true,
  };
}

async function fetchAssessmentWithChildren(
  supabase: SupaClient,
  row: Database["public"]["Tables"]["assessments"]["Row"]
): Promise<Assessment> {
  const { data: questionRows } = await supabase
    .from("assessment_questions")
    .select("*")
    .eq("assessment_id", row.id)
    .order("display_order");
  const questions = questionRows ?? [];
  const questionIds = questions.map((q) => q.id);

  const { data: optionRows } =
    questionIds.length > 0
      ? await supabase.from("assessment_answer_options").select("*").in("assessment_question_id", questionIds)
      : { data: [] as Database["public"]["Tables"]["assessment_answer_options"]["Row"][] };

  return {
    id: row.id,
    title: row.title,
    companyName: row.company_name ?? undefined,
    description: row.description ?? "",
    bannerImageUrl: row.banner_image_url ?? undefined,
    questions: questions.map((q) =>
      toDomainQuestion(
        q,
        (optionRows ?? []).filter((o) => o.assessment_question_id === q.id)
      )
    ),
    settings: {
      minimumPassingPoints: row.minimum_passing_points,
      maxAttempts: row.max_attempts,
      timeLimitMinutes: row.time_limit_minutes,
      randomizeQuestions: row.randomize_questions,
      randomizeAnswers: row.randomize_answers,
      showCorrectAnswersAfterSubmit: row.show_correct_answers_after_submit,
    },
    status: dbAssessmentStatusToDomain(row.status),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAssessmentsForCurrentUser(): Promise<Assessment[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("assessments")
    .select("*")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });
  if (!rows) return [];

  return Promise.all(rows.map((row) => fetchAssessmentWithChildren(supabase, row)));
}

/** `null` covers "doesn't exist", "exists but isn't yours (and isn't
 * ACTIVE)", and "exists but you have no session" — all indistinguishable
 * at the RLS level by design (§15). */
export async function getAssessmentById(assessmentId: string): Promise<Assessment | null> {
  const supabase = await createClient();
  const { data: row } = await supabase.from("assessments").select("*").eq("id", assessmentId).maybeSingle();
  if (!row) return null;
  return fetchAssessmentWithChildren(supabase, row);
}

export async function createBlankAssessment(): Promise<{ id: string } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Bạn cần đăng nhập để tạo Post-test." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assessments")
    .insert({
      owner_id: user.id,
      title: "",
      minimum_passing_points: 1,
      max_attempts: 1,
      status: "INACTIVE",
    })
    .select("id")
    .single();
  if (error || !data) return { error: mapDataError(error) };

  return { id: data.id };
}

function persistableImageUrl(url: string | undefined): string | null {
  if (!url || url.startsWith("blob:")) return null;
  return url;
}

/** Same "sync to match the given object" strategy as `saveQuiz` — see that
 * function's doc comment. `minimumPassingPoints`/`totalPoints` are never
 * silently auto-corrected here even if `minimumPassingPoints > totalPoints`
 * (§10 — "Không tự sửa threshold nếu invalid"); the DB only enforces
 * `minimum_passing_points > 0` (its own CHECK constraint), the
 * `<= totalPoints` relationship is a cross-table rule already validated
 * client-side (`lib/validation/assessment.ts`) and left as the app-layer's
 * responsibility, the same documented pattern as the answer-options rules. */
export async function saveAssessment(assessment: Assessment): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Bạn cần đăng nhập để lưu Post-test." };

  const supabase = await createClient();

  const { error: assessmentError } = await supabase.from("assessments").upsert({
    id: assessment.id,
    owner_id: user.id,
    title: assessment.title,
    company_name: assessment.companyName?.trim() ? assessment.companyName.trim() : null,
    description: assessment.description || null,
    banner_image_url: persistableImageUrl(assessment.bannerImageUrl),
    minimum_passing_points: Math.max(1, assessment.settings.minimumPassingPoints || 1),
    max_attempts: Math.max(1, assessment.settings.maxAttempts || 1),
    time_limit_minutes: assessment.settings.timeLimitMinutes,
    randomize_questions: assessment.settings.randomizeQuestions,
    randomize_answers: assessment.settings.randomizeAnswers,
    show_correct_answers_after_submit: assessment.settings.showCorrectAnswersAfterSubmit,
    status: domainAssessmentStatusToDb(assessment.status),
    updated_at: new Date().toISOString(),
  });
  if (assessmentError) return { error: mapDataError(assessmentError) };

  const { data: existingQuestionRows } = await supabase
    .from("assessment_questions")
    .select("id")
    .eq("assessment_id", assessment.id);
  const existingQuestionIds = new Set((existingQuestionRows ?? []).map((r) => r.id));
  const currentQuestionIds = new Set(assessment.questions.map((q) => q.id));

  const questionIdsToDelete = [...existingQuestionIds].filter((id) => !currentQuestionIds.has(id));
  if (questionIdsToDelete.length > 0) {
    const { error } = await supabase.from("assessment_questions").delete().in("id", questionIdsToDelete);
    if (error) return { error: mapDataError(error) };
  }

  if (assessment.questions.length === 0) return {};

  const questionRows = assessment.questions.map((q) => ({
    id: q.id,
    assessment_id: assessment.id,
    question_type: q.type,
    question_text: q.text,
    image_url: persistableImageUrl(q.imageUrl),
    points: getQuestionPoints(q),
    display_order: q.order,
  }));
  const { error: qError } = await supabase.from("assessment_questions").upsert(questionRows);
  if (qError) return { error: mapDataError(qError) };

  const questionIds = assessment.questions.map((q) => q.id);
  const { data: existingOptionRows } = await supabase
    .from("assessment_answer_options")
    .select("id")
    .in("assessment_question_id", questionIds);
  const existingOptionIds = new Set((existingOptionRows ?? []).map((r) => r.id));
  const currentOptionIds = new Set(assessment.questions.flatMap((q) => q.options.map((o) => o.id)));

  const optionIdsToDelete = [...existingOptionIds].filter((id) => !currentOptionIds.has(id));
  if (optionIdsToDelete.length > 0) {
    const { error } = await supabase.from("assessment_answer_options").delete().in("id", optionIdsToDelete);
    if (error) return { error: mapDataError(error) };
  }

  const optionRows = assessment.questions.flatMap((q) =>
    q.options.map((o, i) => ({
      id: o.id,
      assessment_question_id: q.id,
      option_text: o.text,
      display_order: i + 1,
      is_correct: q.type === "QUIZ" ? !!o.isCorrect : false,
    }))
  );
  if (optionRows.length > 0) {
    const { error: oError } = await supabase.from("assessment_answer_options").upsert(optionRows);
    if (oError) return { error: mapDataError(oError) };
  }

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

/**
 * Duplicate (Phase 10C §12) — real DB rows, new UUIDs throughout (id,
 * question ids, option ids), status forced to `INACTIVE` (no Draft
 * reachable from this app's own UI — see the assessment_status mapper's
 * documented caveat), never copies attempts/results (there is nothing to
 * copy — `assessment_attempts`/`assessment_answers` aren't written by this
 * phase at all). Editing the copy afterward can never reach the
 * original's rows: every id is fresh.
 */
export async function duplicateAssessment(assessmentId: string): Promise<{ id: string } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Bạn cần đăng nhập." };

  const source = await getAssessmentById(assessmentId);
  if (!source) return { error: "Không tìm thấy Assessment." };

  const supabase = await createClient();
  const { data: ownedRows } = await supabase.from("assessments").select("title").eq("owner_id", user.id);
  const existingTitles = new Set((ownedRows ?? []).map((r) => r.title));
  const baseTitle = source.title.replace(COPY_TITLE_SUFFIX, "").trim() || source.title || "Untitled Post-test";
  const newTitle = nextCopyTitle(baseTitle, existingTitles);

  const newAssessmentId = crypto.randomUUID();
  const { error: insertError } = await supabase.from("assessments").insert({
    id: newAssessmentId,
    owner_id: user.id,
    title: newTitle,
    company_name: source.companyName ?? null,
    description: source.description || null,
    banner_image_url: persistableImageUrl(source.bannerImageUrl),
    minimum_passing_points: source.settings.minimumPassingPoints,
    max_attempts: source.settings.maxAttempts,
    time_limit_minutes: source.settings.timeLimitMinutes,
    randomize_questions: source.settings.randomizeQuestions,
    randomize_answers: source.settings.randomizeAnswers,
    show_correct_answers_after_submit: source.settings.showCorrectAnswersAfterSubmit,
    status: "INACTIVE",
  });
  if (insertError) return { error: mapDataError(insertError) };

  const newQuestions: { id: string; original: Question }[] = source.questions.map((q) => ({
    id: crypto.randomUUID(),
    original: q,
  }));

  if (newQuestions.length > 0) {
    const questionRows = newQuestions.map(({ id, original }) => ({
      id,
      assessment_id: newAssessmentId,
      question_type: original.type,
      question_text: original.text,
      image_url: persistableImageUrl(original.imageUrl),
      points: getQuestionPoints(original),
      display_order: original.order,
    }));
    const { error: qError } = await supabase.from("assessment_questions").insert(questionRows);
    if (qError) return { error: mapDataError(qError) };

    const optionRows = newQuestions.flatMap(({ id, original }) =>
      original.options.map((o, i) => ({
        id: crypto.randomUUID(),
        assessment_question_id: id,
        option_text: o.text,
        display_order: i + 1,
        is_correct: original.type === "QUIZ" ? !!o.isCorrect : false,
      }))
    );
    if (optionRows.length > 0) {
      const { error: oError } = await supabase.from("assessment_answer_options").insert(optionRows);
      if (oError) return { error: mapDataError(oError) };
    }
  }

  return { id: newAssessmentId };
}
