import type { Assessment, Question } from "@/types";

/** Post-test V1 only scores QUIZ questions (Phase 9A §6, CLAUDE.md §2). */
export function getScoredQuestions(questions: Question[]): Question[] {
  return questions.filter((q) => q.type === "QUIZ");
}

export function getPollQuestions(questions: Question[]): Question[] {
  return questions.filter((q) => q.type === "POLL");
}

/** A QUIZ question's effective points — `1` when left blank (Phase 9D
 * "bối cảnh đã chốt" §3), never `0`. The editor already sets `points: 1` by
 * default for every new/imported QUIZ question (`use-assessment-editor.ts`,
 * Excel import), so this mainly guards edge cases where `points` ends up
 * `undefined` some other way — scoring must never silently score a question
 * as worth 0. */
export function getQuestionPoints(question: Question): number {
  return question.points ?? 1;
}

/** Sum of `points` across scored (QUIZ) questions — derived, never stored
 * (Phase 9A addendum §3). Recomputed on every render from `questions`, so it
 * updates automatically on add/remove/edit-points/import. */
export function getTotalPoints(questions: Question[]): number {
  return getScoredQuestions(questions).reduce((sum, q) => sum + getQuestionPoints(q), 0);
}

/** Display-only — PASS/FAIL is always computed from `minimumPassingPoints` vs.
 * `earnedPoints` (lib/assessment/scoring.ts), never this %. */
export function getEquivalentPassRate(
  minimumPassingPoints: number,
  totalPoints: number
): number | null {
  if (totalPoints <= 0) return null;
  return Math.round((minimumPassingPoints / totalPoints) * 100);
}

/** Human-readable validation messages, most important first. Empty = publishable. */
export function getAssessmentValidationMessages(assessment: Assessment): string[] {
  const messages: string[] = [];
  const totalPoints = getTotalPoints(assessment.questions);
  const { minimumPassingPoints, maxAttempts, timeLimitMinutes } = assessment.settings;

  if (assessment.title.trim().length === 0) {
    messages.push("Post-test title không được để trống");
  }

  if (totalPoints <= 0) {
    messages.push("Cần ít nhất 1 câu QUIZ có điểm hợp lệ trước khi Active");
  } else if (!Number.isFinite(minimumPassingPoints) || minimumPassingPoints <= 0) {
    messages.push("Điểm tối thiểu để đạt phải là số dương");
  } else if (minimumPassingPoints > totalPoints) {
    messages.push("Điểm tối thiểu để đạt không được lớn hơn tổng điểm của bài.");
  }

  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    messages.push("Attempts allowed phải là số nguyên >= 1");
  }

  if (timeLimitMinutes !== null && (!Number.isInteger(timeLimitMinutes) || timeLimitMinutes <= 0)) {
    messages.push("Time limit phải là số nguyên > 0 phút (hoặc bật “Không giới hạn”)");
  }

  return messages;
}

export function isAssessmentPublishable(assessment: Assessment): boolean {
  return getAssessmentValidationMessages(assessment).length === 0;
}
