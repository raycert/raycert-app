import type { QuestionType } from "@/types";
import { cn } from "@/lib/utils";

/**
 * QUIZ = brand-700 filled pill. POLL = teal-500 outlined pill.
 * (docs/design/README.md §4, Design System V1 §6)
 */
export function QuestionTypeBadge({
  type,
  size = "default",
  className,
}: {
  type: QuestionType;
  size?: "default" | "sm";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center rounded-full font-bold tracking-wide",
        size === "default" ? "px-2.5 py-1 text-xs" : "px-1.75 py-0.5 text-[9.5px]",
        type === "QUIZ"
          ? "bg-brand-700 text-white"
          : "border-[1.5px] border-teal-500 bg-white text-teal-500",
        className
      )}
    >
      {type}
    </span>
  );
}
