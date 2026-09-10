import type { AssessmentAnswer, Question } from "@/types";
import { getQuestionPoints } from "@/lib/validation/assessment";

/**
 * POST_TEST scoring rule (Phase 9A addendum, finalized Phase 9D) —
 * points-based, never a correct-answer *count* threshold, no speed bonus,
 * no Live Quiz scoring reuse (LIVE_QUIZ's `1000 + speed bonus` lives in
 * lib/game/scoring.ts and is untouched by this file — CLAUDE.md §10 vs.
 * this addendum §11).
 *
 * `summarizeAttempt` is invoked once an attempt locks (submit or timeout).
 * Its result is merged onto the `AssessmentAttempt` and persisted via
 * `lib/assessment/attempt-store.ts` — computed exactly once, never
 * recomputed on a later render (Phase 9D §16: a past attempt's result must
 * stay immutable even if the live Assessment's question points change).
 */

/** `correctAnswerPoints` = the `points` of each QUIZ question the
 * participant answered correctly (POLL never contributes — no points field). */
export function calculateEarnedPoints(correctAnswerPoints: number[]): number {
  return correctAnswerPoints.reduce((sum, points) => sum + points, 0);
}

/** Rounded to 1 decimal place (Phase 9D §17 — e.g. `17/24 -> 70.8`, never a
 * plain integer round). `lib/format.ts`'s `formatScorePercent` trims a
 * trailing `.0` for display; `earnedPoints` itself is never rounded. */
export function calculateScorePercent(earnedPoints: number, totalPoints: number): number {
  if (totalPoints <= 0) return 0;
  return Math.round((earnedPoints / totalPoints) * 1000) / 10;
}

export function isPassed(earnedPoints: number, minimumPassingPoints: number): boolean {
  return earnedPoints >= minimumPassingPoints;
}

export interface AssessmentAttemptSummary {
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  earnedPoints: number;
  totalPoints: number;
  scorePercent: number;
  passed: boolean;
  /** Same `AssessmentAnswer[]` passed in, with `isCorrect`/`pointsEarned`
   * merged in — ready to overwrite `AssessmentAttempt.answers`. */
  answers: AssessmentAnswer[];
}

/**
 * `questions` must be the attempt's own scored QUIZ questions (real
 * `AnswerOption.isCorrect` data, not the participant-stripped view) — this
 * is the one place in the take-flow allowed to read correctness, and only
 * at submit time. Maps strictly by id (`question.id`/`option.id`), never by
 * array position, so a `randomizeQuestions`/`randomizeAnswers` shuffle can
 * never desync the correctness mapping (§16).
 */
export function summarizeAttempt(
  questions: Question[],
  answers: AssessmentAnswer[],
  minimumPassingPoints: number
): AssessmentAttemptSummary {
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  const correctAnswerPoints: number[] = [];

  const scoredAnswers: AssessmentAnswer[] = questions.map((question) => {
    const answer = answers.find((a) => a.questionId === question.id);
    const points = getQuestionPoints(question);

    if (!answer || answer.selectedOptionId === null) {
      unansweredCount++;
      return { questionId: question.id, selectedOptionId: null, isCorrect: false, pointsEarned: 0 };
    }

    const selectedOption = question.options.find((o) => o.id === answer.selectedOptionId);
    const isCorrect = selectedOption?.isCorrect === true;
    if (isCorrect) {
      correctCount++;
      correctAnswerPoints.push(points);
    } else {
      incorrectCount++;
    }

    return {
      ...answer,
      isCorrect,
      pointsEarned: isCorrect ? points : 0,
    };
  });

  const totalPoints = questions.reduce((sum, q) => sum + getQuestionPoints(q), 0);
  const earnedPoints = calculateEarnedPoints(correctAnswerPoints);

  return {
    correctCount,
    incorrectCount,
    unansweredCount,
    earnedPoints,
    totalPoints,
    scorePercent: calculateScorePercent(earnedPoints, totalPoints),
    passed: isPassed(earnedPoints, minimumPassingPoints),
    answers: scoredAnswers,
  };
}

export interface AssessmentQuestionReview {
  questionId: string;
  questionText: string;
  imageUrl?: string;
  imageFileName?: string;
  points: number;
  options: { id: string; label: string; text: string; isCorrect: boolean }[];
  selectedOptionId: string | null;
  correctOptionId: string | null;
  isCorrect: boolean;
  pointsEarned: number;
}

/**
 * Builds the Review Answers rows (Phase 9D §6) for one locked attempt, in
 * the order the participant actually saw the questions
 * (`attempt.questionOrder`) — not the Assessment's own natural order.
 * Re-derives `text`/`points`/`options` from the live `assessment.questions`
 * by id (never index), which is safe in this mock app: trainer edits never
 * persist back to `mockAssessments` (Assessment Editor's "Save & Close"
 * doesn't write anything), so there is no live-mutation path that could
 * make this diverge from what the participant actually saw. `isCorrect`/
 * `pointsEarned` themselves are NOT re-derived here — they come straight
 * from `attempt.answers`, frozen at submit time (§16).
 */
export function buildQuestionReviews(
  questions: Question[],
  attempt: { questionOrder: string[]; answers: AssessmentAnswer[] }
): AssessmentQuestionReview[] {
  const reviews: AssessmentQuestionReview[] = [];

  for (const questionId of attempt.questionOrder) {
    const question = questions.find((q) => q.id === questionId);
    const answer = attempt.answers.find((a) => a.questionId === questionId);
    if (!question || !answer) continue;

    const correctOption = question.options.find((o) => o.isCorrect);

    reviews.push({
      questionId,
      questionText: question.text,
      imageUrl: question.imageUrl,
      imageFileName: question.imageFileName,
      points: getQuestionPoints(question),
      options: question.options.map((o) => ({
        id: o.id,
        label: o.label,
        text: o.text,
        isCorrect: o.isCorrect === true,
      })),
      selectedOptionId: answer.selectedOptionId,
      correctOptionId: correctOption?.id ?? null,
      isCorrect: answer.isCorrect === true,
      pointsEarned: answer.pointsEarned ?? 0,
    });
  }

  return reviews;
}
