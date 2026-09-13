"use server";

import { revalidatePath } from "next/cache";
import type { PollResult, QuestionResult } from "@/types";
import {
  advanceToNextQuestion,
  closeCurrentQuestion,
  endGame,
  getGameSessionForHost,
  startGame,
  type CloseQuestionSource,
  type GameSessionStatus,
} from "@/lib/data/game-sessions";
import { getQuizById } from "@/lib/data/quizzes";
import { computeQuestionResult, getLeaderboard, type LeaderboardRow } from "@/lib/data/live-answers";
import { createClient } from "@/lib/supabase/server";

const DEV = process.env.NODE_ENV === "development";

export async function startGameAction(sessionId: string): Promise<{ error?: string }> {
  const result = await startGame(sessionId);
  revalidatePath(`/host/${sessionId}/lobby`);
  return result;
}

export async function closeQuestionAction(
  sessionId: string,
  source: CloseQuestionSource
): Promise<{ error?: string }> {
  return closeCurrentQuestion(sessionId, source);
}

export async function nextQuestionAction(
  sessionId: string
): Promise<{ finished: boolean } | { error: string }> {
  return advanceToNextQuestion(sessionId);
}

export async function endGameAction(sessionId: string): Promise<{ error?: string }> {
  return endGame(sessionId);
}

export interface HostLiveState {
  status: GameSessionStatus;
  currentQuestionIndex: number;
  currentQuestionStartedAt: string | null;
  totalParticipants: number;
  responseCount: number;
  leaderboard: LeaderboardRow[];
}

/** Host-side poll target for Lobby (participant list growing) and Live
 * (response count ticking up, leaderboard once results land) — uses the
 * normal RLS-scoped client, same as everything else in
 * `lib/data/game-sessions.ts`: the host owns this session, RLS proves it. */
export async function getHostLiveStateAction(sessionId: string): Promise<HostLiveState | { error: string }> {
  const session = await getGameSessionForHost(sessionId);
  if (!session) return { error: "Không tìm thấy phiên, hoặc bạn không phải host của phiên này." };

  const supabase = await createClient();
  const leaderboard = await getLeaderboard(supabase, sessionId);

  let responseCount = 0;
  if (
    (session.status === "QUESTION_ACTIVE" || session.status === "QUESTION_RESULTS") &&
    session.currentQuestionId
  ) {
    // Filtered by the stable current_question_id, never a fresh index
    // lookup — see the doc comment on HostGameSession.currentQuestionId.
    const { data: rows, count } = await supabase
      .from("participant_answers")
      .select("id, game_session_id, question_id", { count: "exact" })
      .eq("game_session_id", sessionId)
      .eq("question_id", session.currentQuestionId);
    responseCount = count ?? 0;

    if (DEV) {
      console.log("[getHostLiveStateAction] host sessionId:", sessionId);
      console.log("[getHostLiveStateAction] current_question_id:", session.currentQuestionId);
      console.log("[getHostLiveStateAction] participant_answers rows found:", rows);
    }
  }

  return {
    status: session.status,
    currentQuestionIndex: session.currentQuestionIndex,
    currentQuestionStartedAt: session.currentQuestionStartedAt,
    totalParticipants: session.participants.length,
    responseCount,
    leaderboard,
  };
}

/** Result view for the just-closed question (Host Live's QUESTION_RESULTS
 * screen) — looks the current question up by its stable
 * `currentQuestionId`, never by re-indexing into a freshly-fetched question
 * list (see `HostGameSession.currentQuestionId`'s doc comment for why). */
export async function getCurrentQuestionResultAction(
  sessionId: string
): Promise<QuestionResult | PollResult | { error: string }> {
  const session = await getGameSessionForHost(sessionId);
  if (!session) return { error: "Không tìm thấy phiên, hoặc bạn không phải host của phiên này." };
  if (!session.currentQuestionId) return { error: "Không tìm thấy câu hỏi." };

  const quiz = await getQuizById(session.quizId);
  const question = quiz?.questions.find((q) => q.id === session.currentQuestionId);
  if (!question) return { error: "Không tìm thấy câu hỏi." };

  if (DEV) {
    console.log("[getCurrentQuestionResultAction] host sessionId:", sessionId);
    console.log("[getCurrentQuestionResultAction] current_question_id:", session.currentQuestionId);
  }

  const supabase = await createClient();
  return computeQuestionResult(supabase, sessionId, question);
}
