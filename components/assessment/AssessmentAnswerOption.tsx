"use client";

import { cn } from "@/lib/utils";

/**
 * Post-test answer option button — type-level guard mirrors
 * `ParticipantAnswerOption`'s POLL variant: `state` can only ever be
 * `"default" | "selected"`, never `"correct"/"incorrect"` — a compile error,
 * not just a UI choice, since correctness is never revealed before Phase
 * 9D's Result screen (§5/§6/§7). Freely re-selectable — no Select+Confirm
 * lock like Live Quiz (§6).
 */
export function AssessmentAnswerOption({
  label,
  text,
  state,
  onSelect,
}: {
  label: string;
  text: string;
  state: "default" | "selected";
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={state === "selected"}
      onClick={onSelect}
      className={cn(
        "flex min-h-14 w-full items-center gap-3 rounded-[10px] border-[1.5px] px-4 py-3.5 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        state === "selected"
          ? "border-2 border-primary bg-secondary text-primary"
          : "border-border bg-surface text-heading"
      )}
    >
      <span className="shrink-0 font-semibold">{label}.</span>
      <span className="flex-1">{text}</span>
    </button>
  );
}
