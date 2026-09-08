import type {
  GameSession,
  LeaderboardEntry,
  Participant,
  PollResult,
  Question,
  QuestionResult,
} from "@/types";
import { mockQuizzes } from "./quizzes";

export const mockParticipants: Participant[] = [
  { id: "p1", nickname: "Nguyễn An", connectionStatus: "connected", totalScore: 4200 },
  { id: "p2", nickname: "Trần Bình", connectionStatus: "connected", totalScore: 3950 },
  { id: "p3", nickname: "Lê Chi", connectionStatus: "connected", totalScore: 3200 },
  { id: "p4", nickname: "Phạm Dũng", connectionStatus: "connected", totalScore: 3200 },
  { id: "p5", nickname: "Hoàng Em", connectionStatus: "connected", totalScore: 2800 },
  { id: "p6", nickname: "Vũ Giang", connectionStatus: "reconnecting", totalScore: 2600 },
  { id: "p7", nickname: "Đặng Hà", connectionStatus: "connected", totalScore: 2400 },
  { id: "p8", nickname: "Bùi Khôi", connectionStatus: "connected", totalScore: 2100 },
  { id: "p9", nickname: "Đỗ Linh", connectionStatus: "connected", totalScore: 1800 },
  { id: "p10", nickname: "Ngô Minh", connectionStatus: "connected", totalScore: 1500 },
  { id: "p11", nickname: "Phan Ngọc", connectionStatus: "connected", totalScore: 1200 },
  { id: "p12", nickname: "Trịnh Oanh", connectionStatus: "connected", totalScore: 900 },
];

export const mockActiveQuizQuestion: Question = {
  id: "active-quiz-1",
  type: "QUIZ",
  text: "Thủ đô của Việt Nam là gì?",
  imageUrl: "/mock/sample-question.svg",
  options: [
    { id: "active-quiz-1-opt-A", label: "A", text: "Hà Nội", isCorrect: true },
    { id: "active-quiz-1-opt-B", label: "B", text: "Đà Nẵng", isCorrect: false },
    { id: "active-quiz-1-opt-C", label: "C", text: "TP. Hồ Chí Minh", isCorrect: false },
    { id: "active-quiz-1-opt-D", label: "D", text: "Huế", isCorrect: false },
  ],
  timerSeconds: 20,
  points: 1000,
  order: 1,
  isComplete: true,
};

export const mockActivePollQuestion: Question = {
  id: "active-poll-1",
  type: "POLL",
  text: "Bạn đánh giá buổi đào tạo hôm nay thế nào?",
  options: [
    { id: "active-poll-1-opt-A", label: "A", text: "Rất hài lòng", isCorrect: false },
    { id: "active-poll-1-opt-B", label: "B", text: "Bình thường", isCorrect: false },
    { id: "active-poll-1-opt-C", label: "C", text: "Cần cải thiện", isCorrect: false },
  ],
  timerSeconds: 15,
  order: 2,
  isComplete: true,
};

export const mockQuestionResult: QuestionResult = {
  questionId: mockActiveQuizQuestion.id,
  correctOptionId: "active-quiz-1-opt-A",
  distribution: [
    { optionId: "active-quiz-1-opt-A", count: 31, percent: 62 },
    { optionId: "active-quiz-1-opt-B", count: 9, percent: 18 },
    { optionId: "active-quiz-1-opt-C", count: 7, percent: 14 },
    { optionId: "active-quiz-1-opt-D", count: 3, percent: 6 },
  ],
  correctRate: 62,
  responseCount: 50,
};

export const mockPollResult: PollResult = {
  questionId: mockActivePollQuestion.id,
  distribution: [
    { optionId: "active-poll-1-opt-A", count: 27, percent: 54 },
    { optionId: "active-poll-1-opt-B", count: 15, percent: 30 },
    { optionId: "active-poll-1-opt-C", count: 8, percent: 16 },
  ],
  responseCount: 50,
};

export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, participantId: "p1", nickname: "Nguyễn An", score: 4200 },
  { rank: 2, participantId: "p2", nickname: "Trần Bình", score: 3950 },
  { rank: 3, participantId: "p3", nickname: "Lê Chi", score: 3200 },
  { rank: 4, participantId: "p4", nickname: "Phạm Dũng", score: 3200 },
  { rank: 5, participantId: "p5", nickname: "Hoàng Em", score: 2800 },
];

export const mockGameSession: GameSession = {
  id: "session-mock-1",
  quizId: mockQuizzes[0].id,
  pin: "482913",
  phase: "question",
  currentQuestionIndex: 0,
  currentQuestion: mockActiveQuizQuestion,
};

export const mockGameSessions: GameSession[] = [mockGameSession];

/**
 * Frontend-only mock resolution for the Join flow (§ QR Code / Join Link
 * update). A real backend will look sessions up by PIN/code server-side —
 * this just lets /join and /join/[sessionCode] work against mock data.
 */
export function resolveSessionByCode(sessionCode: string): GameSession | undefined {
  return mockGameSessions.find((session) => session.id === sessionCode);
}

export function resolveSessionByPin(pin: string): GameSession | undefined {
  return mockGameSessions.find((session) => session.pin === pin);
}

/**
 * Display-ready summary for Trainer Dashboard's "Recent Sessions" list.
 * Not a core domain type (§5 of the handoff) — GameSession alone doesn't
 * carry a quiz title or a hosted-at timestamp, so this is a mock-only shape.
 * `hostedAt` is computed relative to `Date.now()` (not a fixed ISO string)
 * so the "2 giờ trước" style copy stays accurate whenever this is viewed.
 */
export interface RecentSessionSummary {
  sessionId: string;
  quizId: string;
  quizTitle: string;
  hostedAt: string; // ISO
  participantCount: number;
}

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

export const mockRecentSessions: RecentSessionSummary[] = [
  {
    sessionId: "session-mock-1",
    quizId: "quiz-onboarding",
    quizTitle: "Onboarding Quiz",
    hostedAt: new Date(Date.now() - 2 * HOUR_MS).toISOString(),
    participantCount: 24,
  },
  {
    sessionId: "session-mock-2",
    quizId: "quiz-compliance",
    quizTitle: "Compliance Refresher",
    hostedAt: new Date(Date.now() - 1 * DAY_MS).toISOString(),
    participantCount: 18,
  },
  {
    sessionId: "session-mock-3",
    quizId: "quiz-onboarding",
    quizTitle: "Onboarding Quiz",
    hostedAt: new Date(Date.now() - 4 * DAY_MS).toISOString(),
    participantCount: 30,
  },
];
