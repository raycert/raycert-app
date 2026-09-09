import type { PollResult, Question, QuestionResult } from "@/types";
import { mockActiveQuizQuestion, mockQuestionResult } from "./session";

/**
 * Fixed 4-question demo sequence for Phase 6 participant gameplay, covering
 * every combination the manual test cases (§9/§15) need: QUIZ with image,
 * QUIZ without image, POLL with 4 options, POLL with 6 options (mobile
 * scroll). Order matters — this is the literal play order.
 */
export const mockGameplayQuestions: Question[] = [
  // 1) QUIZ + image — reuses the existing active-quiz mock so the image +
  // its matching result distribution stay in one place.
  mockActiveQuizQuestion,

  // 2) QUIZ, no image
  {
    id: "gp-q2",
    type: "QUIZ",
    text: "Loại câu hỏi nào trong RayCert có tính điểm và leaderboard?",
    options: [
      { id: "gp-q2-opt-A", label: "A", text: "QUIZ", isCorrect: true },
      { id: "gp-q2-opt-B", label: "B", text: "POLL", isCorrect: false },
      { id: "gp-q2-opt-C", label: "C", text: "Cả hai", isCorrect: false },
      { id: "gp-q2-opt-D", label: "D", text: "Không loại nào", isCorrect: false },
    ],
    timerSeconds: 15,
    points: 1000,
    order: 2,
    isComplete: true,
  },

  // 3) POLL, 4 options
  {
    id: "gp-q3",
    type: "POLL",
    text: "Bạn muốn buổi training tiếp theo diễn ra khi nào?",
    options: [
      { id: "gp-q3-opt-A", label: "A", text: "Buổi sáng" },
      { id: "gp-q3-opt-B", label: "B", text: "Buổi chiều" },
      { id: "gp-q3-opt-C", label: "C", text: "Buổi tối" },
      { id: "gp-q3-opt-D", label: "D", text: "Cuối tuần" },
    ],
    timerSeconds: 15,
    order: 3,
    isComplete: true,
  },

  // 4) POLL, 6 options — exercises the mobile scroll requirement (§11 mobile
  // spec: 5–6 option POLL becomes an internal scroll container).
  {
    id: "gp-q4",
    type: "POLL",
    text: "Chủ đề nào bạn muốn học tiếp theo?",
    options: [
      { id: "gp-q4-opt-A", label: "A", text: "Quản lý thời gian" },
      { id: "gp-q4-opt-B", label: "B", text: "Giao tiếp hiệu quả" },
      { id: "gp-q4-opt-C", label: "C", text: "Kỹ năng lãnh đạo" },
      { id: "gp-q4-opt-D", label: "D", text: "Chuyển đổi số" },
      { id: "gp-q4-opt-E", label: "E", text: "Làm việc nhóm" },
      { id: "gp-q4-opt-F", label: "F", text: "Khác" },
    ],
    timerSeconds: 15,
    order: 4,
    isComplete: true,
  },
];

export const mockGameplayResults: Record<string, QuestionResult | PollResult> = {
  [mockActiveQuizQuestion.id]: mockQuestionResult,
  "gp-q2": {
    questionId: "gp-q2",
    correctOptionId: "gp-q2-opt-A",
    distribution: [
      { optionId: "gp-q2-opt-A", count: 29, percent: 69 },
      { optionId: "gp-q2-opt-B", count: 6, percent: 14 },
      { optionId: "gp-q2-opt-C", count: 5, percent: 12 },
      { optionId: "gp-q2-opt-D", count: 2, percent: 5 },
    ],
    correctRate: 69,
    responseCount: 42,
  },
  "gp-q3": {
    questionId: "gp-q3",
    distribution: [
      { optionId: "gp-q3-opt-A", count: 6, percent: 14 },
      { optionId: "gp-q3-opt-B", count: 18, percent: 43 },
      { optionId: "gp-q3-opt-C", count: 11, percent: 26 },
      { optionId: "gp-q3-opt-D", count: 7, percent: 17 },
    ],
    responseCount: 42,
  },
  "gp-q4": {
    questionId: "gp-q4",
    distribution: [
      { optionId: "gp-q4-opt-A", count: 9, percent: 21 },
      { optionId: "gp-q4-opt-B", count: 7, percent: 17 },
      { optionId: "gp-q4-opt-C", count: 10, percent: 24 },
      { optionId: "gp-q4-opt-D", count: 6, percent: 14 },
      { optionId: "gp-q4-opt-E", count: 8, percent: 19 },
      { optionId: "gp-q4-opt-F", count: 2, percent: 5 },
    ],
    responseCount: 42,
  },
};

export function getGameplayResult(questionId: string): QuestionResult | PollResult | undefined {
  return mockGameplayResults[questionId];
}
