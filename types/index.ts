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
