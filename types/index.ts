/**
 * RayCert domain types — docs/design/README.md §5.
 * Frontend-only for now: no Supabase/database types here yet.
 */

export type QuestionType = "QUIZ" | "POLL";

export interface AnswerOption {
  id: string;
  label: string; // 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  text: string;
  isCorrect?: boolean; // QUIZ only, undefined for POLL
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  imageUrl?: string; // max 1 image, uploaded manually
  imageFileName?: string; // local file name — a11y alt text, no backend storage
  imageMimeType?: string; // client-validated MIME type of the uploaded file
  options: AnswerOption[]; // QUIZ: 2-4, POLL: 2-6
  timerSeconds: number;
  points?: number; // QUIZ only
  order: number;
  isComplete: boolean;
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  status: "draft" | "published";
  updatedAt: string;
}

export type SessionPhase =
  | "lobby"
  | "question"
  | "result"
  | "leaderboard"
  | "final";

export interface GameSession {
  id: string;
  quizId: string;
  pin: string;
  phase: SessionPhase;
  currentQuestionIndex: number;
  currentQuestion?: Question;
}

export interface Participant {
  id: string;
  nickname: string;
  connectionStatus: "connected" | "reconnecting" | "disconnected";
  totalScore: number;
}

export interface ParticipantAnswer {
  participantId: string;
  questionId: string;
  optionId: string | null; // null = timed out with no answer
  submittedAt: string;
  isCorrect?: boolean; // QUIZ only
  pointsAwarded?: number; // QUIZ only
}

export interface QuestionResult {
  // QUIZ
  questionId: string;
  correctOptionId: string;
  distribution: { optionId: string; count: number; percent: number }[];
  correctRate: number;
  responseCount: number;
}

export interface PollResult {
  // POLL — no correct/incorrect/score
  questionId: string;
  distribution: { optionId: string; count: number; percent: number }[];
  responseCount: number;
}

export interface LeaderboardEntry {
  rank: number;
  participantId: string;
  nickname: string;
  score: number;
}

export type ImportRowStatus = "valid" | "error";

export interface ImportPreviewRow {
  row: number;
  type: QuestionType;
  question: string;
  status: ImportRowStatus;
  errorColumn?: string;
  errorMessage?: string;
}

export type ImportState =
  | "empty"
  | "selected"
  | "validating"
  | "preview"
  | "importing"
  | "success";

/**
 * Activity mode — Live Quiz vs. the self-paced Post-test mode (Phase 9A,
 * ROADMAP_ASSESSMENT.md §1). Both modes share the same `Question`/
 * `AnswerOption`/`Quiz`/`QuestionType` library above; this type exists only
 * to name the distinction, not to gate behavior on those shared types.
 */
export type ActivityMode = "LIVE_QUIZ" | "POST_TEST";

export type AssessmentStatus = "active" | "inactive";

export interface AssessmentSettings {
  // Primary pass/fail field — an absolute point total, NOT a count of correct
  // answers and NOT a %. See lib/validation/assessment.ts / lib/assessment/scoring.ts.
  minimumPassingPoints: number;
  maxAttempts: number;
  timeLimitMinutes: number | null; // null = no overall time limit
  randomizeQuestions: boolean;
  randomizeAnswers: boolean;
  showCorrectAnswersAfterSubmit: boolean;
}

/**
 * A Post-test / Assessment (Phase 9A) — self-paced. Each QUIZ question
 * carries its own `points` (reusing `Question.points`, but trainer-set
 * per-question rather than a Live Quiz base-points preset); scoring is
 * `earnedPoints >= settings.minimumPassingPoints`
 * (lib/assessment/scoring.ts), never a correct-answer *count* threshold.
 * POLL questions may be present but are never scored (CLAUDE.md §2, §13).
 * Deliberately its own model, not a `GameSession` variant — reuses
 * `Question`/`AnswerOption` directly (ROADMAP_ASSESSMENT.md §2, §4).
 */
export interface Assessment {
  id: string;
  title: string;
  // Optional client/company metadata (Company Name addendum) — trimmed
  // before display; never rendered as a placeholder row when absent, and
  // never part of Student Information (that form stays learner-identity
  // only: Họ tên/Bộ phận).
  companyName?: string;
  description: string;
  questions: Question[];
  settings: AssessmentSettings;
  status: AssessmentStatus;
  createdAt: string;
  updatedAt: string;
  // Banner (Start Screen UI fix-up) — image/branding only, rendered on the
  // Start Screen above a separate `title`/`description` heading, never
  // overlaid with text. No `bannerAlt`/`bannerTitle`/`bannerSubtitle` — a
  // banner never carries its own text, so there's nothing for those fields
  // to override; alt text is derived from `bannerFileName` at render time.
  bannerImageUrl?: string;
  bannerFileName?: string;
  bannerMimeType?: string;
}

// --- Post-test participant attempt domain (Phase 9C) ---

export type AttemptStatus = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "TIMEOUT";

export type SubmissionReason = "MANUAL" | "TIMEOUT";

export interface AssessmentAnswer {
  questionId: string;
  selectedOptionId: string | null; // null = unanswered
  answeredAt?: string; // ISO — last time this answer was set/changed
  // Derived only once the attempt locks (submit or timeout) — Phase 9D
  // §18. Always undefined while `AssessmentAttempt.status === "IN_PROGRESS"`;
  // never read/rendered by the active take-flow UI (§18 security boundary,
  // mirrors the `isCorrect`-stripped `AssessmentParticipantQuestion`).
  isCorrect?: boolean;
  pointsEarned?: number;
}

/**
 * One learner's attempt at a Post-test (Phase 9C; scoring fields added
 * Phase 9D) — self-paced, a single overall timer (`expiresAt`), never a
 * `GameSession` variant (CLAUDE.md §22 for this phase, ROADMAP_ASSESSMENT.md
 * §4). `answers`/`questionOrder` go beyond Phase 9D §18's minimum field
 * list — kept here so a single object captures this attempt's (possibly
 * shuffled) question order and per-question answers consistently.
 * `correctCount`/`incorrectCount`/`unansweredCount`/`earnedPoints`/
 * `totalPoints`/`scorePercent`/`passed` are all `0`/`false` while
 * `status === "IN_PROGRESS"` and only meaningful once locked — computed
 * once via `lib/assessment/scoring.ts`'s `summarizeAttempt` and never
 * recomputed afterward, so a later edit to the live Assessment's question
 * points can never retroactively change a past attempt's result (§16).
 * Frontend-only: persisted to `sessionStorage` by
 * `lib/assessment/attempt-store.ts` once locked (not before), tab-scoped —
 * does not survive a closed tab or a different device/browser, since there
 * is no real backend yet.
 */
export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  fullName: string;
  department: string;
  startedAt: string; // ISO
  expiresAt: string | null; // ISO — null when the assessment has no time limit
  submittedAt: string | null;
  attemptNumber: number;
  status: AttemptStatus;
  submissionReason: SubmissionReason | null;
  answers: AssessmentAnswer[];
  questionOrder: string[]; // this attempt's question id order (shuffled or natural)
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  earnedPoints: number;
  totalPoints: number;
  scorePercent: number; // rounded to 1 decimal place — see lib/format.ts's formatScorePercent for display
  passed: boolean;
}

export type ImageUploadStatus =
  | "empty"
  | "drag-over"
  | "uploading"
  | "preview"
  | "error";

export interface ImageUploadState {
  status: ImageUploadStatus;
  url?: string;
  fileName?: string;
  errorMessage?: string;
}
