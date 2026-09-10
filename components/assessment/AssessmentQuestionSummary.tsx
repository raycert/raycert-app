import { AlertTriangleIcon } from "lucide-react";
import type { Question } from "@/types";
import { getPollQuestions, getScoredQuestions, getTotalPoints } from "@/lib/validation/assessment";

/**
 * Scored-vs-total breakdown for the Questions section (Phase 9A §6, addendum
 * §3). POLL questions may exist in an Assessment's question set (e.g. reused
 * from a mixed Quiz) but are never scored — flagged here, not silently
 * dropped. `totalPoints` is derived here too (not passed in) so it always
 * reflects the current `questions` on every render.
 */
export function AssessmentQuestionSummary({ questions }: { questions: Question[] }) {
  const scoredCount = getScoredQuestions(questions).length;
  const pollCount = getPollQuestions(questions).length;
  const totalPoints = getTotalPoints(questions);

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-surface px-4 py-3">
      <p className="text-[13px] text-heading">
        <span className="font-semibold">{scoredCount}</span> câu QUIZ được tính điểm
        {questions.length > 0 ? (
          <span className="text-muted-foreground"> / {questions.length} câu tổng cộng</span>
        ) : null}
        <span className="text-muted-foreground"> · Tổng điểm: </span>
        <span className="font-semibold">{totalPoints}</span>
      </p>
      {pollCount > 0 ? (
        <p className="flex items-start gap-1.5 text-[12.5px] text-amber-600">
          <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {pollCount} câu POLL sẽ không được tính điểm trong Post-test này (POLL không có đáp án
          đúng — CLAUDE.md §2).
        </p>
      ) : null}
    </div>
  );
}
