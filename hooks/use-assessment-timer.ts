"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/format";

export interface AssessmentTimerState {
  remainingSeconds: number | null; // null = no time limit
  formattedTime: string | null;
  isLastFiveMinutes: boolean; // warning band: 61s–300s remaining
  isLastMinute: boolean; // critical band: 1s–60s remaining
  isExpired: boolean;
}

/**
 * Overall Post-test timer (Phase 9C §8/§9) — one timer for the whole
 * attempt, never per-question. Derives remaining time fresh from
 * `expiresAt - Date.now()` on every ~1s tick (never accumulates a counter),
 * so it stays correct across tab throttling/background time and needs no
 * API/database calls. Data-only, no UI/a11y logic — kept generic so a future
 * Presenter screen can reuse this same hook (§9).
 */
export function useAssessmentTimer(expiresAt: string | null): AssessmentTimerState {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(() => {
    if (!expiresAt) return null;
    return Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000));
  });

  useEffect(() => {
    if (!expiresAt) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing to a prop change (expiresAt going null), not derived render state
      setRemainingSeconds(null);
      return;
    }
    const tick = () => {
      setRemainingSeconds(Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000)));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const isExpired = remainingSeconds !== null && remainingSeconds <= 0;
  const isLastMinute = remainingSeconds !== null && remainingSeconds > 0 && remainingSeconds <= 60;
  const isLastFiveMinutes = remainingSeconds !== null && remainingSeconds > 60 && remainingSeconds <= 300;
  const formattedTime = remainingSeconds !== null ? formatCountdown(remainingSeconds) : null;

  return { remainingSeconds, formattedTime, isLastFiveMinutes, isLastMinute, isExpired };
}
