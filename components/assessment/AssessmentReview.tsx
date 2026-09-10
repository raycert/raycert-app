import type { AssessmentQuestionReview } from "@/lib/assessment/scoring";
import { AssessmentReviewQuestion } from "./AssessmentReviewQuestion";

/** Review Answers section (Phase 9D §6) — only rendered by the caller when
 * `assessment.settings.showCorrectAnswersAfterSubmit` is true; renders
 * nothing itself if there's nothing to review (e.g. a 0-question edge case). */
export function AssessmentReview({ reviews }: { reviews: AssessmentQuestionReview[] }) {
  if (reviews.length === 0) return null;

  return (
    <div className="flex w-full flex-col gap-3">
      <h2 className="font-heading text-base font-bold text-heading">Xem lại đáp án</h2>
      {reviews.map((review, i) => (
        <AssessmentReviewQuestion key={review.questionId} questionNumber={i + 1} review={review} />
      ))}
    </div>
  );
}
