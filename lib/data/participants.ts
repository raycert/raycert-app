import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { GameSessionStatus } from "./game-sessions";

/**
 * Live Game participant data access layer (Phase 10D §5-§8, §20) — the
 * no-account half. Every function here uses the admin client
 * (`lib/supabase/admin.ts`), never the RLS-scoped one: a participant has no
 * Supabase Auth session at all, so `auth.uid()`-based RLS cannot express
 * "this is the browser that joined" — the documented exception in
 * `admin.ts`'s own comment. In exchange, every function here does its own
 * full validation (PIN/session status, nickname shape/uniqueness, token
 * match) before writing anything, and never trusts a client-supplied
 * `owner`/`hostId`/id beyond what the session/token lookups themselves
 * prove — see `docs/backend/SUPABASE_SETUP.md` §12 for the write-up of this
 * strategy.
 */

export interface PublicSessionInfo {
  id: string;
  quizId: string;
  quizTitle: string;
  pin: string;
  status: GameSessionStatus;
}

export async function resolveSessionByPin(pin: string): Promise<PublicSessionInfo | null> {
  const admin = createAdminClient();
  const { data: session } = await admin
    .from("game_sessions")
    .select("id, quiz_id, game_pin, status")
    .eq("game_pin", pin)
    .maybeSingle();
  if (!session) return null;

  const { data: quiz } = await admin.from("quizzes").select("title").eq("id", session.quiz_id).maybeSingle();

  return {
    id: session.id,
    quizId: session.quiz_id,
    quizTitle: quiz?.title ?? "Quiz",
    pin: session.game_pin,
    status: session.status,
  };
}

export async function getPublicSessionInfo(sessionId: string): Promise<PublicSessionInfo | null> {
  const admin = createAdminClient();
  const { data: session } = await admin
    .from("game_sessions")
    .select("id, quiz_id, game_pin, status")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return null;

  const { data: quiz } = await admin.from("quizzes").select("title").eq("id", session.quiz_id).maybeSingle();

  return {
    id: session.id,
    quizId: session.quiz_id,
    quizTitle: quiz?.title ?? "Quiz",
    pin: session.game_pin,
    status: session.status,
  };
}

export interface SessionRuntimeState {
  status: GameSessionStatus;
  currentQuestionIndex: number;
  /** Stable reference to the actual current question row — always use this
   * to look up question content, never re-derive it by indexing into a
   * freshly-fetched question list (display_order can shift if the quiz is
   * edited after the game started). */
  currentQuestionId: string | null;
  currentQuestionStartedAt: string | null;
  quizId: string;
  participantCount: number;
}

/** Polling target for the Play page (§11) — session status + current
 * question pointer + a live participant count, admin-mediated for the same
 * no-account reason as everything else in this file. */
export async function getSessionRuntimeState(sessionId: string): Promise<SessionRuntimeState | null> {
  const admin = createAdminClient();
  const { data: session } = await admin
    .from("game_sessions")
    .select("status, current_question_index, current_question_id, current_question_started_at, quiz_id")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return null;

  const { count } = await admin
    .from("participants")
    .select("id", { count: "exact", head: true })
    .eq("game_session_id", sessionId);

  return {
    status: session.status,
    currentQuestionIndex: session.current_question_index,
    currentQuestionId: session.current_question_id,
    currentQuestionStartedAt: session.current_question_started_at,
    quizId: session.quiz_id,
    participantCount: count ?? 0,
  };
}

const MIN_NICKNAME_LENGTH = 2;
const MAX_NICKNAME_LENGTH = 20;

export interface JoinedParticipant {
  id: string;
  nickname: string;
  token: string;
}

export async function joinGameSession(
  sessionId: string,
  rawNickname: string
): Promise<JoinedParticipant | { error: string }> {
  const admin = createAdminClient();

  const { data: session } = await admin
    .from("game_sessions")
    .select("status")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return { error: "Phiên không tồn tại hoặc đã kết thúc." };
  if (session.status !== "WAITING") return { error: "Trò chơi đã bắt đầu, không thể tham gia." };

  const nickname = rawNickname.trim();
  if (nickname.length < MIN_NICKNAME_LENGTH || nickname.length > MAX_NICKNAME_LENGTH) {
    return { error: `Nickname cần ${MIN_NICKNAME_LENGTH}–${MAX_NICKNAME_LENGTH} ký tự.` };
  }

  const { data: existing } = await admin
    .from("participants")
    .select("nickname")
    .eq("game_session_id", sessionId);
  const normalized = nickname.toLowerCase();
  if ((existing ?? []).some((p) => p.nickname.toLowerCase() === normalized)) {
    return { error: "Nickname đã có người dùng trong phiên này, vui lòng chọn tên khác." };
  }

  const { data: inserted, error } = await admin
    .from("participants")
    .insert({ game_session_id: sessionId, nickname, score: 0, last_seen_at: new Date().toISOString() })
    .select("id, nickname, participant_token")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Nickname đã có người dùng trong phiên này, vui lòng chọn tên khác." };
    }
    return { error: "Không thể tham gia phiên. Vui lòng thử lại." };
  }

  return { id: inserted.id, nickname: inserted.nickname, token: inserted.participant_token };
}

export interface ResolvedParticipant {
  id: string;
  nickname: string;
  score: number;
}

/** Rejoin/identify flow (§7) — resolves a participant from the (sessionId,
 * token) pair carried in the participant's cookie. `null` means the token
 * is missing/invalid/for a different session — the caller must send the
 * participant back to Join, never fabricate a participant. */
export async function resolveParticipantByToken(
  sessionId: string,
  token: string | undefined
): Promise<ResolvedParticipant | null> {
  if (!token) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("participants")
    .select("id, nickname, score")
    .eq("game_session_id", sessionId)
    .eq("participant_token", token)
    .maybeSingle();
  if (!data) return null;

  await admin.from("participants").update({ last_seen_at: new Date().toISOString() }).eq("id", data.id);

  return { id: data.id, nickname: data.nickname, score: data.score };
}
