"use client";

import { cn } from "@/lib/utils";

/**
 * Question Navigator (Phase 9C §7) — current / answered / unanswered only.
 * Deliberately never uses success/error (green/red) for "answered" — those
 * are this app's established correct/incorrect colors everywhere else, and
 * §7 explicitly forbids any correct/incorrect coloring before Submit — so
 * "answered" uses a neutral brand-tinted fill instead. State is also
 * conveyed via shape (outlined vs. filled vs. plain) and an `aria-label`,
 * never color alone.
 */
export function AssessmentNavigator({
  total,
  currentIndex,
  answeredIndices,
  onJump,
}: {
  total: number;
  currentIndex: number;
  answeredIndices: Set<number>;
  onJump: (index: number) => void;
}) {
  return (
    <div role="group" aria-label="Điều hướng câu hỏi" className="flex flex-wrap gap-1.5">
      {Array.from({ length: total }, (_, i) => i).map((i) => {
        const isCurrent = i === currentIndex;
        const isAnswered = answeredIndices.has(i);
        return (
          <button
            key={i}
            type="button"
            onClick={() => onJump(i)}
            aria-current={isCurrent ? "step" : undefined}
            aria-label={`Câu ${i + 1}${isAnswered ? " — đã trả lời" : " — chưa trả lời"}`}
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-md border-[1.5px] text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              isCurrent
                ? "border-2 border-primary bg-secondary text-primary"
                : isAnswered
                  ? "border-brand-100 bg-brand-100 text-brand-700"
                  : "border-border bg-surface text-muted-foreground"
            )}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}
