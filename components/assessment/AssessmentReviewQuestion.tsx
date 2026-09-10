import { CheckIcon, MinusIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssessmentQuestionReview } from "@/lib/assessment/scoring";

/**
 * One Review Answers row (Phase 9D §6/§7) — only ever rendered when the
 * Assessment's `showCorrectAnswersAfterSubmit` is true (gated by the parent
 * `AssessmentReview`). Mirrors Live Quiz's `QuizResult` correct/incorrect
 * color+icon vocabulary (`success-600`/`error-600`, Check/X/Minus) for
 * visual consistency, without reusing the component itself — that one is
 * a transient "waiting for next question" screen, this is a static
 * post-submission list.
 */
export function AssessmentReviewQuestion({
  questionNumber,
  review,
}: {
  questionNumber: number;
  review: AssessmentQuestionReview;
}) {
  const selected = review.options.find((o) => o.id === review.selectedOptionId) ?? null;
  const correct = review.options.find((o) => o.id === review.correctOptionId) ?? null;
  const state: "correct" | "incorrect" | "unanswered" =
    review.selectedOptionId === null ? "unanswered" : review.isCorrect ? "correct" : "incorrect";

  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-heading">Câu {questionNumber}</p>
        <span className="shrink-0 text-[11px] text-muted-foreground">{review.points} điểm</span>
      </div>

      <p className="text-sm text-heading">{review.questionText}</p>

      {review.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- local/mock URL
        <img
          src={review.imageUrl}
          alt={review.imageFileName ?? ""}
          className="max-h-40 w-fit rounded-lg object-contain"
        />
      ) : null}

      <p className="text-[12.5px] text-muted-foreground">
        Bạn chọn:{" "}
        <strong className="text-heading">
          {selected ? `${selected.label}. ${selected.text}` : "Chưa trả lời"}
        </strong>
      </p>

      {state !== "correct" && correct ? (
        <p className="text-[12.5px] text-muted-foreground">
          Đáp án đúng:{" "}
          <strong className="text-success-600">
            {correct.label}. {correct.text}
          </strong>
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-2 border-t border-border pt-2.5">
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[12.5px] font-semibold",
            state === "correct"
              ? "text-success-600"
              : state === "incorrect"
                ? "text-error-600"
                : "text-muted-foreground"
          )}
        >
          {state === "correct" ? (
            <CheckIcon className="size-3.5" aria-hidden="true" />
          ) : state === "incorrect" ? (
            <XIcon className="size-3.5" aria-hidden="true" />
          ) : (
            <MinusIcon className="size-3.5" aria-hidden="true" />
          )}
          {state === "correct" ? "Đúng" : state === "incorrect" ? "Sai" : "Chưa trả lời"}
        </span>
        <span className="text-[12.5px] font-semibold text-heading">
          Điểm nhận: {review.pointsEarned} / {review.points}
        </span>
      </div>
    </div>
  );
}
