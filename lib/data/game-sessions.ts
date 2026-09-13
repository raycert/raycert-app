import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getQuizById } from "@/lib/data/quizzes";
import { computeDeadlineMs } from "@/lib/game/timing";
import { mapDataError } from "./errors";

// TEMPORARY diagnostic logging (timer/auto-close trace) — always on, not
// NODE_ENV-gated, specifically so it also prints under `pnpm build && pnpm
// start`, where the bug reproduces. Remove once the root cause is confirmed
// fixed.
const TRACE = true;

/**
 * Live Game session data access layer (Phase 10D §19) — the host half.
 * Everything here runs through the normal RLS-scoped client
 * (`lib/supabase/server.ts`), never the admin client: `game_sessions` has
 * real owner-scoped RLS (`host_id = auth.uid()`, see the Phase 10D
 * migration), so a trainer's own session gets full CRUD the same way
 * `lib/data/quizzes.ts` works, and RLS is the real backstop against a
 * different trainer's Server Action reaching another host's session (§21,
 * §29) — this layer just has to not lie about who the current user is.
 *
 * The participant half (`participants`/`participant_answers` writes, and
 * every participant-facing read) lives in `lib/data/participants.ts` /
 * `lib/data/live-answers.ts` and uses the admin client instead — see those
 * files' doc comments and `docs/backend/SUPABASE_SETUP.md` §12 for why.
 */

export type GameSessionStatus =
  | "WAITING"
  | "ACTIVE"
  | "QUESTION_ACTIVE"
  | "QUESTION_RESULTS"
  | "FINISHED";

export interface HostGameSession {
  id: string;
  quizId: string;
  quizTitle: string;
  pin: string;
  status: GameSessionStatus;
  currentQuestionIndex: number;
  /** Stable reference to the actual current question row (see the
   * `current_question_id` migration's doc comment) — always prefer this
   * over indexing into a freshly-fetched question list, which can point at
   * a different question than the one participants actually saw if the
   * quiz was edited after the game started. */
  currentQuestionId: string | null;
  currentQuestionStartedAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  totalQuestions: number;
  participants: { id: string; nickname: string; score: number; joinedAt: string }[];
}

type SupaClient = SupabaseClient<Database>;

function generateGamePin(): string {
  let pin = "";
  for (let i = 0; i < 6; i++) pin += Math.floor(Math.random() * 10);
  return pin;
}

/** The unique index name from
 * `supabase/migrations/20260914000000_game_sessions_one_waiting_per_host.sql`
 * — matched against a 23505 error's message to tell "this quiz+host already
 * has an open WAITING session" apart from an ordinary PIN collision. */
const ONE_WAITING_PER_QUIZ_HOST_INDEX = "game_sessions_one_waiting_per_quiz_host_idx";

async function findWaitingSession(
  supabase: SupaClient,
  quizId: string,
  hostId: string
): Promise<{ id: string } | null> {
  const { data } = await supabase
    .from("game_sessions")
    .select("id")
    .eq("quiz_id", quizId)
    .eq("host_id", hostId)
    .eq("status", "WAITING")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

/** Inserts a new session with a fresh, unique 6-digit PIN — retries on a
 * PIN collision (23505 unique_violation on game_pin) rather than
 * pre-checking then inserting, which would leave a TOCTOU race. If a
 * concurrent request already created the quiz+host's WAITING session first
 * (the `ONE_WAITING_PER_QUIZ_HOST_INDEX` partial unique index rejects this
 * one), re-query and return that session instead of erroring — the whole
 * point of §3's idempotency requirement. */
async function insertSessionWithUniquePin(
  supabase: SupaClient,
  quizId: string,
  hostId: string
): Promise<{ id: string } | { error: string }> {
  const MAX_ATTEMPTS = 15;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const { data, error } = await supabase
      .from("game_sessions")
      .insert({ quiz_id: quizId, host_id: hostId, game_pin: generateGamePin(), status: "WAITING" })
      .select("id")
      .single();
    if (!error && data) return { id: data.id };

    if (error?.code === "23505") {
      if (error.message?.includes(ONE_WAITING_PER_QUIZ_HOST_INDEX)) {
        const existing = await findWaitingSession(supabase, quizId, hostId);
        if (existing) return { id: existing.id };
        // Shouldn't happen (the index violation implies a row exists), but
        // avoid looping forever if it somehow does.
        return { error: "Không thể tạo phiên host. Vui lòng thử lại." };
      }
      // else: an ordinary PIN collision — loop and try a new one.
      continue;
    }

    // Dev-only diagnostic (never token/password/secret) — the most common
    // cause of a 42501 here is a Phase 10D RLS migration
    // (supabase/migrations/20260912000000_live_game_host_rls.sql or its
    // fix-up 20260913000000_fix_game_sessions_rls.sql) not having been
    // applied to the project yet, which denies every INSERT regardless of
    // how correct host_id/ownership is.
    if (process.env.NODE_ENV === "development") {
      console.log("[createGameSession] Supabase error code:", error?.code, "message:", error?.message);
    }
    return { error: mapDataError(error) };
  }
  return { error: "Không thể tạo mã PIN, vui lòng thử lại." };
}

export async function createGameSession(quizId: string): Promise<{ id: string } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Bạn cần đăng nhập để host." };

  const quiz = await getQuizById(quizId);
  if (!quiz) return { error: "Không tìm thấy quiz." };
  if (quiz.questions.length === 0) {
    return { error: "Quiz chưa có câu hỏi nào, không thể host." };
  }

  const supabase = await createClient();

  if (process.env.NODE_ENV === "development") {
    const { data: ownerRow } = await supabase.from("quizzes").select("owner_id").eq("id", quizId).maybeSingle();
    console.log("[createGameSession] user.id:", user.id);
    console.log("[createGameSession] quiz.id:", quizId);
    console.log("[createGameSession] quiz.owner_id:", ownerRow?.owner_id);
    console.log("[createGameSession] owner_id === user.id:", ownerRow?.owner_id === user.id);
  }

  // Idempotency (§1-§3): reuse an existing WAITING session for this
  // quiz+host instead of creating a new one — visiting the Host route more
  // than once (double click, back-then-Host-again, a route re-render) must
  // land on the SAME session/PIN, never spawn a duplicate. The partial
  // unique index is the race-proof backstop for two near-simultaneous
  // calls; this check just avoids the extra round trip in the common case.
  const existing = await findWaitingSession(supabase, quizId, user.id);
  if (existing) {
    if (process.env.NODE_ENV === "development") {
      console.log("[createGameSession] reusing existing WAITING session:", existing.id);
    }
    return { id: existing.id };
  }

  return insertSessionWithUniquePin(supabase, quizId, user.id);
}

/** `null` covers both "doesn't exist" and "exists but isn't yours" — same
 * safe-by-construction pattern as `lib/data/quizzes.ts`'s `getQuizById`. */
export async function getGameSessionForHost(sessionId: string): Promise<HostGameSession | null> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (!row) return null;

  const quiz = await getQuizById(row.quiz_id);
  if (!quiz) return null;

  const { data: participantRows } = await supabase
    .from("participants")
    .select("id, nickname, score, joined_at")
    .eq("game_session_id", sessionId)
    .order("joined_at", { ascending: true });

  return {
    id: row.id,
    quizId: row.quiz_id,
    quizTitle: quiz.title,
    pin: row.game_pin,
    status: row.status,
    currentQuestionIndex: row.current_question_index,
    currentQuestionId: row.current_question_id,
    currentQuestionStartedAt: row.current_question_started_at,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    totalQuestions: quiz.questions.length,
    participants: (participantRows ?? []).map((p) => ({
      id: p.id,
      nickname: p.nickname,
      score: p.score,
      joinedAt: p.joined_at,
    })),
  };
}

async function updateSessionOwned(
  sessionId: string,
  patch: Database["public"]["Tables"]["game_sessions"]["Update"]
): Promise<{ row: Database["public"]["Tables"]["game_sessions"]["Row"] } | { error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("game_sessions")
    .update(patch)
    .eq("id", sessionId)
    .select("*")
    .maybeSingle();
  if (error) return { error: mapDataError(error) };
  // 0 rows affected: either the session doesn't exist or RLS filtered it out
  // (not yours) — same "doesn't exist vs. not yours is indistinguishable,
  // and that's the safe/correct behavior" reasoning as Phase 10C.
  if (!data) return { error: "Không tìm thấy phiên, hoặc bạn không phải host của phiên này." };
  return { row: data };
}

export async function startGame(sessionId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: session } = await supabase
    .from("game_sessions")
    .select("status, quiz_id")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return { error: "Không tìm thấy phiên, hoặc bạn không phải host của phiên này." };
  if (session.status !== "WAITING") return { error: "Trò chơi đã bắt đầu hoặc đã kết thúc." };

  const quiz = await getQuizById(session.quiz_id);
  if (!quiz || quiz.questions.length === 0) return { error: "Không tìm thấy câu hỏi của quiz." };

  const now = new Date().toISOString();
  const firstQuestion = quiz.questions[0];

  if (TRACE) {
    console.log("[QUESTION START]", {
      questionId: firstQuestion.id,
      configuredDuration: firstQuestion.timerSeconds,
      serverStartedAt: now,
      calculatedDeadline: new Date(computeDeadlineMs(now, firstQuestion.timerSeconds)).toISOString(),
      currentServerTime: new Date().toISOString(),
    });
  }

  const result = await updateSessionOwned(sessionId, {
    status: "QUESTION_ACTIVE",
    started_at: now,
    current_question_index: 0,
    current_question_id: firstQuestion.id,
    current_question_started_at: now,
  });
  return "error" in result ? { error: result.error } : {};
}

export type CloseQuestionSource = "MANUAL_HOST" | "TIMER";

/**
 * `source` distinguishes an explicit Host click ("Kết thúc câu hỏi") from
 * the client timer's own auto-close-at-0 effect. This matters because of
 * the mandatory server-side guard below (fix §E): a manual host click is
 * always allowed to end a question early (the host is the authority and
 * may choose to), but an AUTO/TIMER-sourced close must never be honored
 * before the question's real, server-computed deadline — even if a buggy
 * or duplicated client-side timer fired early. This is the actual
 * enforcement point; the client timer is just what decides *when to ask*,
 * never what decides whether the close is valid.
 */
export async function closeCurrentQuestion(
  sessionId: string,
  source: CloseQuestionSource
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: session } = await supabase
    .from("game_sessions")
    .select("status, quiz_id, current_question_id, current_question_started_at")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return { error: "Không tìm thấy phiên, hoặc bạn không phải host của phiên này." };
  if (session.status !== "QUESTION_ACTIVE") return { error: "Câu hỏi hiện không ở trạng thái đang mở." };

  let deadlineMs: number | null = null;
  if (session.current_question_id && session.current_question_started_at) {
    const quiz = await getQuizById(session.quiz_id);
    const currentQuestion = quiz?.questions.find((q) => q.id === session.current_question_id);
    if (currentQuestion) {
      deadlineMs = computeDeadlineMs(session.current_question_started_at, currentQuestion.timerSeconds);
    }
  }

  const now = Date.now();

  if (TRACE) {
    console.log("[CLOSE QUESTION ACTION]", {
      questionId: session.current_question_id,
      source,
      now: new Date(now).toISOString(),
      deadline: deadlineMs !== null ? new Date(deadlineMs).toISOString() : null,
    });
  }

  // Mandatory guard: a TIMER-sourced close must never be honored before the
  // real deadline, no matter what the client believed. A manual host click
  // is exempt — ending a question early is a legitimate host decision.
  if (source === "TIMER" && deadlineMs !== null && now < deadlineMs) {
    console.error("[CLOSE QUESTION ACTION] EARLY CLOSE REJECTED", {
      sessionId,
      questionId: session.current_question_id,
      now,
      deadline: deadlineMs,
      nowMinusDeadlineMs: now - deadlineMs,
    });
    return { error: "Chưa đến thời gian đóng câu hỏi." };
  }

  const result = await updateSessionOwned(sessionId, { status: "QUESTION_RESULTS" });
  return "error" in result ? { error: result.error } : {};
}

export async function advanceToNextQuestion(
  sessionId: string
): Promise<{ finished: boolean } | { error: string }> {
  const supabase = await createClient();
  const { data: session } = await supabase
    .from("game_sessions")
    .select("status, current_question_index, quiz_id")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return { error: "Không tìm thấy phiên, hoặc bạn không phải host của phiên này." };
  if (session.status !== "QUESTION_RESULTS") return { error: "Chưa thể chuyển câu tiếp theo." };

  const quiz = await getQuizById(session.quiz_id);
  if (!quiz) return { error: "Không tìm thấy quiz." };

  const nextIndex = session.current_question_index + 1;
  if (nextIndex >= quiz.questions.length) {
    const result = await updateSessionOwned(sessionId, {
      status: "FINISHED",
      ended_at: new Date().toISOString(),
    });
    return "error" in result ? { error: result.error } : { finished: true };
  }

  const nextQuestionRow = quiz.questions[nextIndex];
  const nextStartedAt = new Date().toISOString();

  if (TRACE) {
    console.log("[QUESTION START]", {
      questionId: nextQuestionRow.id,
      configuredDuration: nextQuestionRow.timerSeconds,
      serverStartedAt: nextStartedAt,
      calculatedDeadline: new Date(computeDeadlineMs(nextStartedAt, nextQuestionRow.timerSeconds)).toISOString(),
      currentServerTime: new Date().toISOString(),
    });
  }

  const result = await updateSessionOwned(sessionId, {
    status: "QUESTION_ACTIVE",
    current_question_index: nextIndex,
    current_question_id: nextQuestionRow.id,
    current_question_started_at: nextStartedAt,
  });
  return "error" in result ? { error: result.error } : { finished: false };
}

export async function endGame(sessionId: string): Promise<{ error?: string }> {
  const result = await updateSessionOwned(sessionId, {
    status: "FINISHED",
    ended_at: new Date().toISOString(),
  });
  return "error" in result ? { error: result.error } : {};
}
