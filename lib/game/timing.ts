/**
 * Shared, server-authoritative timing math for Live Quiz questions (fix:
 * grace period for in-flight answer submissions). Both the SERVER (answer
 * validation in `lib/data/live-answers.ts`) and the CLIENT (Host/Participant
 * countdown display) derive "how much time is left" from the exact same two
 * absolute inputs — `game_sessions.current_question_started_at` and the
 * current question's own `time_limit_seconds` — never from a client-side
 * decrementing counter (`secondsLeft--`), which drifts and has no
 * connection to what the server considers authoritative. Pure functions, no
 * server-only/client-only import, safe to call from both sides.
 */

/**
 * How long after a question's nominal deadline a late-arriving answer
 * submission is still accepted. Exists because "the deadline passed" and
 * "the question actually stopped accepting answers" are not the same
 * instant — a participant may have selected an option and clicked Submit
 * a moment before the deadline, but the request's network round-trip (plus
 * whatever the Host's own close action/auto-close-on-timer-expiry races
 * against it) can land a moment after. Without this, a legitimately
 * on-time answer gets rejected purely because of network/processing
 * latency, which is not acceptable game behavior.
 */
export const ANSWER_GRACE_PERIOD_MS = 2000;

/** Absolute deadline (epoch ms) for the question that started at
 * `questionStartedAt` with the given `timerSeconds`. */
export function computeDeadlineMs(questionStartedAt: string, timerSeconds: number): number {
  return new Date(questionStartedAt).getTime() + timerSeconds * 1000;
}

/** Whole seconds remaining until `deadlineMs`, clamped to >= 0 — the only
 * thing either client's countdown display should ever compute; never a
 * running local decrement. */
export function computeRemainingSeconds(deadlineMs: number, now: number = Date.now()): number {
  return Math.max(0, Math.ceil((deadlineMs - now) / 1000));
}
