/**
 * DB enum values ↔ frontend/domain string literals (Phase 10A §22 — "Database
 * types ≠ Domain/frontend types"). Nothing calls these yet: Phase 10A ships
 * no persistence-reading code (§27, "không migrate frontend persistence").
 * They exist now because the mismatches below are already known facts about
 * the two schemas, not speculation — Phase 10B+ needing this mapping
 * shouldn't have to rediscover it.
 *
 * The DB layer intentionally uses its own UPPER_SNAKE_CASE enum vocabulary
 * (matching CLAUDE.md §6/§7's existing `game_sessions.status` convention
 * and this phase's own spec text) even where the current frontend mock
 * uses a different casing or a narrower set of values — the frontend types
 * in `types/index.ts` are NOT changed by this phase.
 */

import type { AssessmentStatus, AttemptStatus, SubmissionReason } from "@/types";

// --- quizzes.status (DB: 'DRAFT' | 'PUBLISHED') <-> Quiz.status ---
// 1:1, casing only. No 'ARCHIVED' on either side — frontend has never used
// one, so the DB enum doesn't invent one either (Phase 10A §6).

export type DbQuizStatus = "DRAFT" | "PUBLISHED";

export function dbQuizStatusToDomain(status: DbQuizStatus): "draft" | "published" {
  return status === "DRAFT" ? "draft" : "published";
}

export function domainQuizStatusToDb(status: "draft" | "published"): DbQuizStatus {
  return status === "draft" ? "DRAFT" : "PUBLISHED";
}

// --- assessments.status (DB: 'DRAFT' | 'ACTIVE' | 'INACTIVE') <-> Assessment.status ---
// NOT 1:1 — the DB enum includes 'DRAFT' per Phase 10A §10's explicit
// minimum set; the current frontend mock's AssessmentStatus only ever
// reaches "active"/"inactive" (no Draft concept yet in the Editor UI). A
// freshly-inserted-but-unpublished DB row would be 'DRAFT' with no domain
// equivalent to map to yet — `dbAssessmentStatusToDomain` throws rather
// than silently mis-mapping it to "inactive", so this gets noticed (and
// `AssessmentStatus` extended with "draft") the moment Phase 10B+ actually
// starts reading assessments from the database.

export type DbAssessmentStatus = "DRAFT" | "ACTIVE" | "INACTIVE";

export function dbAssessmentStatusToDomain(status: DbAssessmentStatus): AssessmentStatus {
  if (status === "ACTIVE") return "active";
  if (status === "INACTIVE") return "inactive";
  throw new Error(
    "dbAssessmentStatusToDomain: 'DRAFT' has no AssessmentStatus equivalent yet — extend types/index.ts's AssessmentStatus before reading Draft assessments from the database."
  );
}

export function domainAssessmentStatusToDb(status: AssessmentStatus): DbAssessmentStatus {
  return status === "active" ? "ACTIVE" : "INACTIVE";
}

// --- assessment_attempts.status + submission_reason <-> AttemptStatus ---
// The frontend's AttemptStatus folds "submitted because the timer ran out"
// into the *status* itself ("TIMEOUT", alongside "SUBMITTED") — the DB
// schema keeps status normalized to NOT_STARTED/IN_PROGRESS/SUBMITTED only
// (Phase 10A §13) and puts "why" on the separate, nullable
// `submission_reason` column instead, since "submitted via timeout" is
// still fundamentally the SUBMITTED state. Combine both DB columns to get
// the frontend's AttemptStatus back.

export type DbAttemptStatus = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED";
export type DbSubmissionReason = "MANUAL" | "TIMEOUT";

export function dbAttemptStatusToDomain(
  status: DbAttemptStatus,
  submissionReason: DbSubmissionReason | null
): AttemptStatus {
  if (status !== "SUBMITTED") return status;
  return submissionReason === "TIMEOUT" ? "TIMEOUT" : "SUBMITTED";
}

export function domainAttemptStatusToDb(status: AttemptStatus): {
  status: DbAttemptStatus;
  submissionReason: DbSubmissionReason | null;
} {
  if (status === "NOT_STARTED" || status === "IN_PROGRESS") {
    return { status, submissionReason: null };
  }
  return { status: "SUBMITTED", submissionReason: status === "TIMEOUT" ? "TIMEOUT" : "MANUAL" };
}

export function domainSubmissionReasonToDb(reason: SubmissionReason): DbSubmissionReason {
  return reason;
}
