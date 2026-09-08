import type { ParticipantAnswer } from "@/types";
import { mockQuizzes } from "./quizzes";
import { mockParticipants } from "./session";

/**
 * Local report-row shapes. Not part of the core domain types (§5 of the
 * handoff) — these back `QuizAnalysisRow` / `PollAnalysisRow` components
 * (Milestone 8, not built in this phase), kept here as mock-only shapes.
 */
export interface QuizAnalysisRow {
  questionId: string;
  questionText: string;
  correctRate: number; // %
  incorrectRate: number; // %
  averageScore: number;
  averageResponseMs: number;
  isKnowledgeGap: boolean;
}

export interface PollAnalysisRow {
  questionId: string;
  questionText: string;
  distribution: { optionId: string; optionText: string; count: number; percent: number }[];
  participationRate: number; // %
}

export interface GameReportOverview {
  sessionId: string;
  quizTitle: string;
  totalParticipants: number;
  totalQuestions: number;
  averageScore: number; // QUIZ questions only — never blended with POLL
  averageCorrectRate: number; // QUIZ questions only
  completionRate: number; // % participants who answered every question
}

const reportQuiz = mockQuizzes[0]; // Onboarding Quiz backs the mock Game Report

function buildParticipantAnswers(): ParticipantAnswer[] {
  const answers: ParticipantAnswer[] = [];
  reportQuiz.questions.forEach((question, qIndex) => {
    mockParticipants.forEach((participant, pIndex) => {
      const submittedAt = new Date(
        Date.UTC(2026, 7, 20, 9, qIndex, pIndex * 2)
      ).toISOString();

      if (question.type === "QUIZ") {
        const correctOption = question.options.find((o) => o.isCorrect)!;
        // Deterministic mix so the mock doesn't rely on Math.random() (avoids
        // any SSR/client hydration mismatch if this is ever rendered directly).
        const isCorrect = (pIndex + qIndex) % 3 !== 0;
        const chosenOption = isCorrect
          ? correctOption
          : question.options.find((o) => o.id !== correctOption.id)!;
        answers.push({
          participantId: participant.id,
          questionId: question.id,
          optionId: chosenOption.id,
          submittedAt,
          isCorrect,
          pointsAwarded: isCorrect ? 1000 + ((pIndex * 37) % 300) : 0,
        });
      } else {
        const choiceIndex = (pIndex + qIndex) % question.options.length;
        answers.push({
          participantId: participant.id,
          questionId: question.id,
          optionId: question.options[choiceIndex].id,
          submittedAt,
        });
      }
    });
  });
  return answers;
}

export const mockParticipantAnswers: ParticipantAnswer[] = buildParticipantAnswers();

const quizQuestion = reportQuiz.questions.find((q) => q.type === "QUIZ")!;
const pollQuestion = reportQuiz.questions.find((q) => q.type === "POLL")!;

export const mockQuizAnalysisRow: QuizAnalysisRow = {
  questionId: quizQuestion.id,
  questionText: quizQuestion.text,
  correctRate: 62,
  incorrectRate: 38,
  averageScore: 1120,
  averageResponseMs: 8400,
  isKnowledgeGap: false,
};

export const mockPollAnalysisRow: PollAnalysisRow = {
  questionId: pollQuestion.id,
  questionText: pollQuestion.text,
  distribution: pollQuestion.options.map((option, i) => ({
    optionId: option.id,
    optionText: option.text,
    count: [7, 3, 2][i] ?? 0,
    percent: [58, 25, 17][i] ?? 0,
  })),
  participationRate: 100,
};

export const mockGameReportOverview: GameReportOverview = {
  sessionId: "session-mock-1",
  quizTitle: reportQuiz.title,
  totalParticipants: mockParticipants.length,
  totalQuestions: reportQuiz.questions.length,
  averageScore: 1120,
  averageCorrectRate: 62,
  completionRate: 92,
};
