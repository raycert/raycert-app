"use server";

import type { GameSessionStatus } from "@/lib/data/game-sessions";
import { getSessionRuntimeState, resolveParticipantByToken } from "@/lib/data/participants";
import { fetchQuizForGame } from "@/lib/data/game-content";
import {
  getLeaderboard,
  getMyAnswerResult,
  hasParticipantAnswered,
  submitAnswer,
  type LeaderboardRow,
  type MyAnswerResult,
  type SubmitAnswerResult,
} from "@/lib/data/live-answers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getParticipantToken } from "@/lib/game/participant-cookie";
import { toParticipantQuestion, type ParticipantQuestion } from "@/lib/game/participant-question";

export interface PlayState {
  status: GameSessionStatus;
  currentQuestionIndex: number;
  currentQuestionStartedAt: string | null;
  totalQuestions: number;
  quizTitle: string;
  participantCount: number;
  myScore: number;
  myNickname: string;
  hasAnsweredCurrent: boolean;
  question: ParticipantQuestion | null;
}

async function resolveMe(sessionId: string) {
  const token = await getParticipantToken(sessionId);
  return resolveParticipantByToken(sessionId, token);
}

export async function getPlayStateAction(sessionId: string): Promise<PlayState | { error: "not-joined" }> {
  const me = await resolveMe(sessionId);
  if (!me) return { error: "not-joined" };

  const runtime = await getSessionRuntimeState(sessionId);
  if (!runtime) return { error: "not-joined" };

  const quiz = await fetchQuizForGame(runtime.quizId);
  // Look up by the stable current_question_id, never by index — the quiz's
  // question list can be edited (added/removed/reordered) after the game
  // started, which would silently shift what "index N" resolves to.
  const currentQuestionRow = quiz?.questions.find((q) => q.id === runtime.currentQuestionId) ?? null;
  const question = currentQuestionRow ? toParticipantQuestion(currentQuestionRow) : null;
  const hasAnsweredCurrent = currentQuestionRow
    ? await hasParticipantAnswered(me.id, currentQuestionRow.id)
    : false;

  return {
    status: runtime.status,
    currentQuestionIndex: runtime.currentQuestionIndex,
    currentQuestionStartedAt: runtime.currentQuestionStartedAt,
    totalQuestions: quiz?.questions.length ?? 0,
    quizTitle: quiz?.title ?? "Quiz",
    participantCount: runtime.participantCount,
    myScore: me.score,
    myNickname: me.nickname,
    hasAnsweredCurrent,
    question:
      runtime.status === "QUESTION_ACTIVE" || runtime.status === "QUESTION_RESULTS" ? question : null,
  };
}

export async function submitAnswerAction(
  sessionId: string,
  questionId: string,
  answerOptionId: string
): Promise<SubmitAnswerResult> {
  const me = await resolveMe(sessionId);
  if (!me) return { success: false, reason: "SESSION_NOT_FOUND" };

  try {
    return await submitAnswer({ sessionId, participantId: me.id, questionId, answerOptionId });
  } catch (err) {
    // submitAnswer throws (rather than returning a rejection) specifically
    // when the participant_answers INSERT itself failed unexpectedly —
    // caught here and turned into a typed rejection the UI can render, but
    // never silently treated as success.
    console.error("[submitAnswerAction] unexpected failure:", err);
    return { success: false, reason: "UNKNOWN_ERROR" };
  }
}

export async function getMyResultAction(
  sessionId: string,
  questionId: string
): Promise<MyAnswerResult | { error: string }> {
  const me = await resolveMe(sessionId);
  if (!me) return { error: "Phiên tham gia không hợp lệ, vui lòng tham gia lại." };

  return getMyAnswerResult({ sessionId, participantId: me.id, questionId });
}

export async function getFinalLeaderboardAction(
  sessionId: string
): Promise<{ entries: LeaderboardRow[]; myParticipantId: string } | { error: string }> {
  const me = await resolveMe(sessionId);
  if (!me) return { error: "Phiên tham gia không hợp lệ, vui lòng tham gia lại." };

  const entries = await getLeaderboard(createAdminClient(), sessionId);
  return { entries, myParticipantId: me.id };
}
