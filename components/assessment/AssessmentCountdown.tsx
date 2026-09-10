"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangleIcon, ClockIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssessmentTimerState } from "@/hooks/use-assessment-timer";

export type AssessmentCountdownMode = "participant" | "presenter";

/**
 * Shared overall-timer display (Presenter Screen addendum §11) —
 * `useAssessmentTimer` is the single source of timing truth for BOTH modes;
 * this component only decides how to render that state, never recomputes it
 * (§6/§10 — client only renders from a timestamp, never its own authority).
 *
 * `mode="participant"` is the exact pre-Phase-9C-addendum `AssessmentTimer`
 * UI (compact pill, always visible whenever a time limit exists) — kept
 * byte-identical so the existing take-flow regression suite stays valid.
 *
 * `mode="presenter"` is new: a large projector-scale countdown that renders
 * **nothing** until the WARNING band is reached (§8) — before that, the
 * Presenter screen shows QR/title/metadata instead (owned by the page, not
 * this component). Colors mirror `HostTimer`'s existing navy-background
 * convention (amber-600/error-600 directly against `brand-900`, already
 * proven for contrast there) rather than inventing new tokens.
 *
 * No flashing/animation in either mode — state changes are static style
 * swaps. Announces only on transition into a new band (§16 — not spam).
 */
export function AssessmentCountdown({
  timer,
  mode,
}: {
  timer: AssessmentTimerState;
  mode: AssessmentCountdownMode;
}) {
  const variant: "normal" | "warning" | "critical" = timer.isExpired
    ? "critical"
    : timer.isLastMinute
      ? "critical"
      : timer.isLastFiveMinutes
        ? "warning"
        : "normal";

  const [announcement, setAnnouncement] = useState<string | null>(null);
  const lastVariantRef = useRef(variant);

  useEffect(() => {
    if (variant === lastVariantRef.current) return;
    lastVariantRef.current = variant;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- throttled a11y announcement on band transition only, not every tick
    if (timer.isExpired) setAnnouncement("Hết giờ — bài làm đã được nộp");
    else if (variant === "critical") setAnnouncement("Sắp hết giờ");
    else if (variant === "warning") setAnnouncement("Còn 5 phút làm bài");
  }, [variant, timer.isExpired]);

  if (mode === "presenter") {
    // No time limit, or still in the normal band — Presenter shows QR/title/
    // metadata instead (§8/§13), not a countdown at all.
    if (timer.remainingSeconds === null || variant === "normal") return null;

    return (
      <div className="flex flex-col items-center gap-2">
        <div
          aria-hidden="true"
          className={cn(
            "rounded-2xl border-[3px] px-10 py-5 font-heading text-[56px] font-extrabold leading-none tabular-nums",
            variant === "warning" && "border-amber-600 text-amber-600",
            variant === "critical" && "border-error-600 text-error-600"
          )}
        >
          {timer.formattedTime}
        </div>
        <p
          className={cn(
            "text-lg font-semibold",
            variant === "warning" ? "text-amber-600" : "text-error-600"
          )}
        >
          {timer.isExpired ? "Đã hết thời gian" : variant === "warning" ? "Còn 5 phút" : "Sắp hết giờ"}
        </p>
        <span className="sr-only" aria-live="polite">
          {announcement}
        </span>
      </div>
    );
  }

  // mode === "participant" — unchanged from the original AssessmentTimer.
  if (timer.remainingSeconds === null) {
    return (
      <div className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
        <ClockIcon className="size-4" aria-hidden="true" />
        Không giới hạn thời gian
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1.5 font-heading text-sm font-bold tabular-nums",
          variant === "normal" && "border-primary text-primary",
          variant === "warning" && "border-amber-600 bg-amber-100 text-amber-600",
          variant === "critical" && "border-error-600 bg-error-100 text-error-600"
        )}
      >
        {variant !== "normal" ? <AlertTriangleIcon className="size-3.5" aria-hidden="true" /> : null}
        <span aria-hidden="true">{timer.formattedTime}</span>
      </div>
      {variant === "warning" ? (
        <span className="text-[11.5px] font-semibold text-amber-600">Còn 5 phút</span>
      ) : null}
      {variant === "critical" ? (
        <span className="text-[11.5px] font-semibold text-error-600">Sắp hết giờ</span>
      ) : null}
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}
