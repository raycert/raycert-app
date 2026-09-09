import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuestionOptionStat } from "@/mocks/reports";

/**
 * CSS bar chart for option distribution — reused by QUIZ and POLL question
 * analytics. QUIZ highlights the correct option in success green; POLL stays
 * neutral teal throughout (CLAUDE.md §13 — POLL has no correct/incorrect).
 * Percent + count are always rendered as text, never color-only (README §14).
 */
export function ResponseDistribution({
  options,
  variant,
}: {
  options: QuestionOptionStat[];
  variant: "quiz" | "poll";
}) {
  return (
    <ul className="flex flex-col gap-2">
      {options.map((option) => {
        const isCorrect = variant === "quiz" && option.isCorrect;
        return (
          <li key={option.optionId} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2 text-[13px]">
              <span className={cn("flex items-center gap-1.5", isCorrect && "font-semibold text-success-600")}>
                <span className="font-semibold text-muted-foreground">{option.label})</span>
                {option.text}
                {isCorrect ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-success-600">
                    <CheckIcon className="size-3" aria-hidden="true" />
                    Đáp án đúng
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-muted-foreground">
                {option.count} · {option.percent}%
              </span>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-border"
              role="img"
              aria-label={`${option.text}: ${option.count} phản hồi (${option.percent}%)`}
            >
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isCorrect ? "bg-success-600" : variant === "quiz" ? "bg-error-600" : "bg-teal-500"
                )}
                style={{ width: `${option.percent}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
