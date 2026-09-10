import type { AssessmentAttempt } from "@/types";

/**
 * Client-only attempt history (Phase 9D §9/§12) — `sessionStorage`, keyed
 * per Assessment, tab-scoped. This is the mechanism that lets `/take` and
 * `/result` (separate routes, no shared React state) hand off a completed
 * attempt, and lets Retake compute the next `attemptNumber` and gate on
 * `maxAttempts`. Explicitly not real persistence: cleared when the tab
 * closes, never shared across tabs/devices — there is no backend yet
 * (addendum "Không làm: production persistence").
 *
 * Only ever called from client components/hooks. Every function guards
 * `typeof window === "undefined"` so an accidental import from a Server
 * Component degrades to "no history" instead of throwing.
 *
 * There is no real auth/participant identity in this mock (CLAUDE.md §3 —
 * participants never have an account). `attemptNumber`/`maxAttempts` and
 * the attempt-history list must still be scoped to *one learner*, though —
 * `getAttemptHistoryForIdentity`/`getNextAttemptNumber` filter by
 * `(fullName, department)` (exact string match — both are already trimmed
 * by `AssessmentStart` before they ever reach an attempt) so that two
 * different people testing the same Assessment in the same browser tab
 * never share one attempt counter or see each other's data (bug fix: a
 * second person starting a fresh attempt after the first person had
 * already used up `maxAttempts` was being silently bounced to the first
 * person's locked Result instead of getting their own attempt).
 */

const STORAGE_KEY_PREFIX = "raycert:assessment-attempts:";

function storageKey(assessmentId: string): string {
  return `${STORAGE_KEY_PREFIX}${assessmentId}`;
}

/** All locked attempts for one Assessment, oldest first. Never includes an
 * in-progress attempt — `saveAttempt` is only called once an attempt locks. */
export function getAttemptHistory(assessmentId: string): AssessmentAttempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(storageKey(assessmentId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AssessmentAttempt[]) : [];
  } catch {
    return [];
  }
}

/** Appends (or replaces, by `attempt.id`) one locked attempt. */
export function saveAttempt(assessmentId: string, attempt: AssessmentAttempt): void {
  if (typeof window === "undefined") return;
  try {
    const history = getAttemptHistory(assessmentId).filter((a) => a.id !== attempt.id);
    history.push(attempt);
    window.sessionStorage.setItem(storageKey(assessmentId), JSON.stringify(history));
  } catch {
    // sessionStorage can throw (quota, private-mode Safari) — attempt
    // history/retake is a nice-to-have on top of the core submit flow, not
    // something that should ever crash the Result screen.
  }
}

export function getAttemptById(assessmentId: string, attemptId: string): AssessmentAttempt | null {
  return getAttemptHistory(assessmentId).find((a) => a.id === attemptId) ?? null;
}

function matchesIdentity(attempt: AssessmentAttempt, fullName: string, department: string): boolean {
  return attempt.fullName === fullName && attempt.department === department;
}

/** This one learner's own locked attempts for this Assessment, oldest
 * first — everyone else's attempts (a different `fullName`/`department`
 * tested in the same tab) are excluded. */
export function getAttemptHistoryForIdentity(
  assessmentId: string,
  fullName: string,
  department: string
): AssessmentAttempt[] {
  return getAttemptHistory(assessmentId).filter((a) => matchesIdentity(a, fullName, department));
}

/** The 1-based attempt number a *new* attempt should get, based on how many
 * locked attempts this same learner (`fullName`+`department`) already has
 * for this Assessment in this tab — never counts another learner's attempts. */
export function getNextAttemptNumber(assessmentId: string, fullName: string, department: string): number {
  return getAttemptHistoryForIdentity(assessmentId, fullName, department).length + 1;
}
