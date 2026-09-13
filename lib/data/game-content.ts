import "server-only";
import type { AnswerOption, Question } from "@/types";
import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Admin-mediated read of a Quiz's questions/options for Live Game gameplay
 * (Phase 10D). A participant has no Supabase Auth session, so `quizzes`'
 * owner-only RLS (Phase 10A/10C) cannot be satisfied — this is exactly the
 * "RLS genuinely cannot express the operation" case `lib/supabase/admin.ts`
 * documents as the correct reason to reach for the admin client.
 *
 * Mirrors `lib/data/quizzes.ts`'s `toDomainQuestion`/`toDomainOptions`/
 * `fetchQuizWithChildren` exactly (independently duplicated here rather than
 * shared, same as Phase 10C's `nextCopyTitle` — these are private helpers,
 * not worth a cross-file dependency for ~15 lines). The returned
 * `Question[]` DELIBERATELY includes `isCorrect` — the server needs it to
 * score answers — so every caller must sanitize through
 * `lib/game/participant-question.ts`'s `toParticipantQuestion()` before this
 * ever reaches a participant-facing component or Server Action response.
 */

const LABELS = ["A", "B", "C", "D", "E", "F"];

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
    isComplete: true,
  };
}

export async function fetchQuizForGame(
  quizId: string
): Promise<{ title: string; questions: Question[] } | null> {
  const admin = createAdminClient();

  const { data: quizRow } = await admin.from("quizzes").select("title").eq("id", quizId).maybeSingle();
  if (!quizRow) return null;

  const { data: questionRows } = await admin
    .from("questions")
    .select("*")
    .eq("quiz_id", quizId)
    .order("display_order");
  const questions = questionRows ?? [];
  const questionIds = questions.map((q) => q.id);

  const { data: optionRows } =
    questionIds.length > 0
      ? await admin.from("answer_options").select("*").in("question_id", questionIds)
      : { data: [] as Database["public"]["Tables"]["answer_options"]["Row"][] };

  return {
    title: quizRow.title,
    questions: questions.map((q) =>
      toDomainQuestion(
        q,
        (optionRows ?? []).filter((o) => o.question_id === q.id)
      )
    ),
  };
}
