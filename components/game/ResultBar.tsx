import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Generic per-option distribution bar — shared by Host QUIZ/POLL results.
 * QUIZ: the correct option is success-600, every other option is brand-500.
 * POLL: every option is teal-500 (matches `PollResultBar`'s participant-side
 * palette; kept as a separate component here since Host also needs the
 * `quiz-correct`/`quiz-other` variants that participants never see).
 */
export function ResultBar({
  label,
  text,
  percent,
  count,
  variant,
}: {
  label: string;
  text: string;
  percent: number;
  count: number;
  variant: "quiz-correct" | "quiz-other" | "poll";
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-5 shrink-0 text-sm font-bold text-white/60">{label}</span>
      <span className="w-40 shrink-0 truncate text-sm text-white/90 lg:w-56">{text}</span>
      <div className="h-6 flex-1 overflow-hidden rounded-md bg-white/10">
        <div
          className={cn(
            "h-full transition-[width]",
            variant === "quiz-correct"
              ? "bg-success-600"
              : variant === "quiz-other"
                ? "bg-brand-500"
                : "bg-teal-500"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="w-14 shrink-0 text-right text-sm font-bold text-white">{percent}%</span>
      <span className="w-16 shrink-0 text-right text-xs text-white/60">({count})</span>
      {variant === "quiz-correct" ? (
        <CheckIcon className="size-4 shrink-0 text-success-600" aria-label="Đáp án đúng" />
      ) : null}
    </div>
  );
}
