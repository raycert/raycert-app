import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PollResult, Question, QuestionResult } from "@/types";
import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { ANSWER_GRACE_PERIOD_MS, computeDeadlineMs } from "@/lib/game/timing";
import { fetchQuizForGame } from "./game-content";

/**
 * Live Game answer submission + results (Phase 10D §12-§17, §14). Submit
 * uses the admin client for the same no-account reason as
 * `lib/data/participants.ts`; `computeQuestionResult`/`getLeaderboard` are
 * generic over whichever `SupabaseClient` is handed in, so the HOST side
 * (`lib/data/game-sessions.ts`, RLS-scoped client — host owns the session,
 * RLS already allows reading its own `participant_answers`/`participants`)
 * and the PARTICIPANT side (this file, admin client) can share the exact
 * same aggregation logic without either one needing the other's client.
 */

type SupaClient = SupabaseClient<Database>;

/** CLAUDE.md §10, computed server-side from real DB timestamps — never a
 * client-reported elapsed time or score. */
function computeQuizPoints(basePoints: number, responseMs: number, timerSeconds: number): number {
  const totalMs = timerSeconds * 1000;
  if (totalMs <= 0) return basePoints;
  const remainingMs = Math.max(0, totalMs - responseMs);
  const speedRatio = Math.max(0, Math.min(1, remainingMs / totalMs));
  const speedBonus = Math.round(speedRatio * 300);
  return basePoints + speedBonus;
}

export async function computeQuestionResult(
  supabase: SupaClient,
  sessionId: string,
  question: Question
): Promise<QuestionResult | PollResult> {
  const { data: rows } = await supabase
    .from("participant_answers")
    .select("answer_option_id, game_session_id, question_id")
    .eq("game_session_id", sessionId)
    .eq("question_id", question.id);
  const answers = rows ?? [];
  const responseCount = answers.length;

  if (process.env.NODE_ENV === "development") {
    console.log("[computeQuestionResult] session_id:", sessionId, "question_id:", question.id);
    console.log("[computeQuestionResult] participant_answers rows found:", answers);
  }

  const distribution = question.options.map((o) => {
    const count = answers.filter((a) => a.answer_option_id === o.id).length;
    const percent = responseCount > 0 ? Math.round((count / responseCount) * 100) : 0;
    return { optionId: o.id, count, percent };
  });

  if (question.type === "QUIZ") {
    const correctOption = question.options.find((o) => o.isCorrect);
    const correctEntry = distribution.find((d) => d.optionId === correctOption?.id);
    return {
      questionId: question.id,
      correctOptionId: correctOption?.id ?? "",
      distribution,
      correctRate: correctEntry?.percent ?? 0,
      responseCount,
    };
  }

  return { questionId: question.id, distribution, responseCount };
}

export interface LeaderboardRow {
  participantId: string;
  nickname: string;
  score: number;
  rank: number;
}

export async function getLeaderboard(supabase: SupaClient, sessionId: string): Promise<LeaderboardRow[]> {
  const { data: rows } = await supabase
    .from("participants")
    .select("id, nickname, score")
    .eq("game_session_id", sessionId)
    .order("score", { ascending: false });

  return (rows ?? []).map((p, i) => ({
    participantId: p.id,
    nickname: p.nickname,
    score: p.score,
    rank: i + 1,
  }));
}

export async function hasParticipantAnswered(participantId: string, questionId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("participant_answers")
    .select("id")
    .eq("participant_id", participantId)
    .eq("question_id", questionId)
    .maybeSingle();
  return !!data;
}

const DEV = process.env.NODE_ENV === "development";

/** Thrown specifically for an unexpected DB failure on the write itself
 * (never for an expected business-rule rejection like "already answered" —
 * those still return `{success:false, reason}`) — a genuine INSERT failure
 * can never be silently treated as success anywhere in the call chain,
 * unlike a returned rejection object a caller could forget to check.
 * `submitAnswerAction` (the Server Action wrapper) catches this and turns
 * it into `{success:false, reason:"UNKNOWN_ERROR"}`. */
class AnswerPersistenceError extends Error {}

export interface SavedAnswer {
  id: string;
  questionId: string;
  answerOptionId: string;
  isCorrect: boolean | null;
  pointsAwarded: number;
  responseMs: number;
}

export type SubmitAnswerReason =
  | "SESSION_NOT_FOUND"
  | "QUESTION_CHANGED"
  | "QUESTION_EXPIRED"
  | "ALREADY_ANSWERED"
  | "INVALID_OPTION"
  | "UNKNOWN_ERROR";

export type SubmitAnswerResult =
  | { success: true; answer: SavedAnswer }
  | { success: false; reason: SubmitAnswerReason };

/**
 * Fix (root cause: `closeQuestionAction` could flip `game_sessions.status`
 * away from QUESTION_ACTIVE while a participant's submit was already in
 * flight, so the OLD status-only check rejected a genuinely on-time
 * answer). Validity is now decided by the question's own absolute deadline
 * (`current_question_started_at + time_limit_seconds`) plus a short grace
 * window for requests already in flight — `session.status` is no longer
 * consulted for this decision at all. The one thing status-independent
 * logic can't relax: once the host has advanced to a DIFFERENT question (or
 * the game hasn't started/has finished), `current_question_id` no longer
 * matches, and no grace period ever applies to a stale question — that
 * check happens first, unconditionally.
 */
export async function submitAnswer(params: {
  sessionId: string;
  participantId: string;
  questionId: string;
  answerOptionId: string;
}): Promise<SubmitAnswerResult> {
  const admin = createAdminClient();

  const [{ data: session }, { data: participantRow }] = await Promise.all([
    admin
      .from("game_sessions")
      .select("id, status, current_question_id, quiz_id, current_question_started_at")
      .eq("id", params.sessionId)
      .maybeSingle(),
    admin.from("participants").select("id, game_session_id, score").eq("id", params.participantId).maybeSingle(),
  ]);

  if (DEV) {
    console.log("[submitAnswer] gameSessionId:", params.sessionId);
    console.log("[submitAnswer] session.current_question_id:", session?.current_question_id);
    console.log("[submitAnswer] questionId being submitted:", params.questionId);
    console.log("[submitAnswer] participantId:", params.participantId);
    console.log("[submitAnswer] selectedAnswerId:", params.answerOptionId);
  }

  if (!session) return { success: false, reason: "SESSION_NOT_FOUND" };

  // Participant must belong to THIS session — defense in depth (the caller,
  // `submitAnswerAction`, already only ever resolves a participantId scoped
  // to sessionId via the cookie/token lookup, but this function itself must
  // not trust that without checking).
  if (!participantRow || participantRow.game_session_id !== params.sessionId) {
    if (DEV) console.error("[submitAnswer] REJECTED (SESSION_NOT_FOUND) — participant not in this session");
    return { success: false, reason: "SESSION_NOT_FOUND" };
  }

  // The question must still be the session's current one, and the game
  // must still be in a question-bearing state. No grace period ever
  // rescues an answer for a question the host has already moved past, or a
  // session that never started / already finished — "Không được nhận
  // answer của câu trước sau khi session đã chuyển sang câu tiếp theo."
  if (
    session.current_question_id !== params.questionId ||
    session.status === "WAITING" ||
    session.status === "FINISHED"
  ) {
    if (DEV) {
      console.error(
        "[submitAnswer] REJECTED (QUESTION_CHANGED) — session.current_question_id:",
        session.current_question_id,
        "status:",
        session.status,
        "submitted questionId:",
        params.questionId
      );
    }
    return { success: false, reason: "QUESTION_CHANGED" };
  }

  // Looked up by the stable current_question_id, never by array index —
  // the quiz's question list can be edited (added/removed/reordered) after
  // the game started, which would silently shift what "index N" resolves
  // to and cause a real, submitted answer to end up filed against the
  // wrong question_id.
  const quiz = await fetchQuizForGame(session.quiz_id);
  const currentQuestion = quiz?.questions.find((q) => q.id === session.current_question_id);
  if (!currentQuestion) {
    return { success: false, reason: "QUESTION_CHANGED" };
  }

  // Server-authoritative deadline — the ONLY thing (besides the identity
  // check above) that decides whether an answer is still acceptable.
  const now = Date.now();
  const deadlineMs = session.current_question_started_at
    ? computeDeadlineMs(session.current_question_started_at, currentQuestion.timerSeconds)
    : now;
  if (now > deadlineMs + ANSWER_GRACE_PERIOD_MS) {
    if (DEV) {
      console.error(
        "[submitAnswer] REJECTED (QUESTION_EXPIRED) — now:",
        now,
        "deadline+grace:",
        deadlineMs + ANSWER_GRACE_PERIOD_MS,
        "late by ms:",
        now - (deadlineMs + ANSWER_GRACE_PERIOD_MS)
      );
    }
    return { success: false, reason: "QUESTION_EXPIRED" };
  }

  const selectedOption = currentQuestion.options.find((o) => o.id === params.answerOptionId);
  if (!selectedOption) {
    if (DEV) {
      console.error(
        "[submitAnswer] REJECTED (INVALID_OPTION) — answerOptionId",
        params.answerOptionId,
        "is not one of the current question's options:",
        currentQuestion.options.map((o) => o.id)
      );
    }
    return { success: false, reason: "INVALID_OPTION" };
  }

  if (await hasParticipantAnswered(params.participantId, params.questionId)) {
    if (DEV) console.error("[submitAnswer] REJECTED (ALREADY_ANSWERED)");
    return { success: false, reason: "ALREADY_ANSWERED" };
  }

  const startedAtMs = session.current_question_started_at
    ? new Date(session.current_question_started_at).getTime()
    : now;
  const responseMs = Math.max(0, now - startedAtMs);

  const isQuiz = currentQuestion.type === "QUIZ";
  const isCorrect = isQuiz ? !!selectedOption.isCorrect : null;
  const pointsAwarded =
    isQuiz && isCorrect
      ? computeQuizPoints(currentQuestion.points ?? 1000, responseMs, currentQuestion.timerSeconds)
      : 0;

  // .select().single() — not a bare .insert() — so we get back the row
  // Postgres actually committed and can verify it, rather than trusting a
  // 2xx status alone.
  const { data: savedRow, error: insertError } = await admin
    .from("participant_answers")
    .insert({
      game_session_id: params.sessionId,
      participant_id: params.participantId,
      question_id: params.questionId,
      answer_option_id: params.answerOptionId,
      response_ms: responseMs,
      is_correct: isCorrect,
      points_awarded: pointsAwarded,
    })
    .select()
    .single();

  if (insertError || !savedRow) {
    console.error(
      "[submitAnswer] INSERT FAILED — code:",
      insertError?.code,
      "message:",
      insertError?.message,
      "details:",
      insertError?.details
    );
    if (insertError?.code === "23505") return { success: false, reason: "ALREADY_ANSWERED" };
    // Thrown, not returned — see AnswerPersistenceError's doc comment. A
    // failed write must never be able to reach the caller looking like a
    // success by falling through some other code path.
    throw new AnswerPersistenceError(insertError?.message ?? "participant_answers insert returned no row");
  }

  if (DEV) {
    console.log("[submitAnswer] ANSWER SAVED:", savedRow);
    if (savedRow.question_id !== session.current_question_id) {
      console.error(
        "[submitAnswer] INTEGRITY MISMATCH: saved answer.question_id !== session.current_question_id",
        savedRow.question_id,
        session.current_question_id
      );
    }
    if (savedRow.game_session_id !== params.sessionId) {
      console.error(
        "[submitAnswer] INTEGRITY MISMATCH: saved answer.game_session_id !== sessionId",
        savedRow.game_session_id,
        params.sessionId
      );
    }
  }

  if (pointsAwarded > 0) {
    // Read-modify-write, not an atomic increment — a small race window
    // under concurrent submits is accepted for Phase 10D's scope (§14: "vẫn
    // phải design service boundary đúng" was the bar, not production-grade
    // concurrency hardening, which is explicitly out of scope this phase).
    await admin
      .from("participants")
      .update({ score: participantRow.score + pointsAwarded })
      .eq("id", params.participantId);
  }

  return {
    success: true,
    answer: {
      id: savedRow.id,
      questionId: savedRow.question_id,
      answerOptionId: savedRow.answer_option_id,
      isCorrect: savedRow.is_correct,
      pointsAwarded: savedRow.points_awarded,
      responseMs: savedRow.response_ms ?? responseMs,
    },
  };
}

export type MyAnswerResult =
  | { revealed: false }
  | {
      revealed: true;
      type: "QUIZ";
      selectedOptionId: string | null;
      isCorrect: boolean | null;
      pointsAwarded: number;
      responseMs: number | null;
      result: QuestionResult;
    }
  | {
      revealed: true;
      type: "POLL";
      selectedOptionId: string | null;
      result: PollResult;
    };

/** §13 security boundary: only ever reveals correctness once the specific
 * question is no longer the live one. "No longer live" is now the same
 * deadline+grace test `submitAnswer` itself uses (fix) — not
 * `session.status`, which can flip to QUESTION_RESULTS while a legitimate
 * in-flight answer for THIS question is still within its grace window.
 * Revealing early would let a fast poll show a participant their own
 * correctness/points before a still-pending answer (theirs or someone
 * else's) has had a chance to land, which is exactly the "snapshot result
 * before the last requests are processed" the fix is required to avoid. */
export async function getMyAnswerResult(params: {
  sessionId: string;
  participantId: string;
  questionId: string;
}): Promise<MyAnswerResult | { error: string }> {
  const admin = createAdminClient();

  const { data: session } = await admin
    .from("game_sessions")
    .select("status, current_question_id, quiz_id, current_question_started_at")
    .eq("id", params.sessionId)
    .maybeSingle();
  if (!session) return { error: "Không tìm thấy phiên." };

  const quiz = await fetchQuizForGame(session.quiz_id);
  if (!quiz) return { error: "Không tìm thấy quiz." };

  const question = quiz.questions.find((q) => q.id === params.questionId);
  if (!question) return { error: "Không tìm thấy câu hỏi." };

  const isCurrentQuestion = session.current_question_id === params.questionId;
  const deadlineMs =
    isCurrentQuestion && session.current_question_started_at
      ? computeDeadlineMs(session.current_question_started_at, question.timerSeconds)
      : 0;
  const stillOpen = isCurrentQuestion && Date.now() <= deadlineMs + ANSWER_GRACE_PERIOD_MS;
  if (stillOpen) return { revealed: false };

  const { data: myAnswer } = await admin
    .from("participant_answers")
    .select("answer_option_id, is_correct, points_awarded, response_ms")
    .eq("participant_id", params.participantId)
    .eq("question_id", params.questionId)
    .maybeSingle();

  const result = await computeQuestionResult(admin, params.sessionId, question);

  if (question.type === "QUIZ") {
    return {
      revealed: true,
      type: "QUIZ",
      selectedOptionId: myAnswer?.answer_option_id ?? null,
      isCorrect: myAnswer?.is_correct ?? null,
      pointsAwarded: myAnswer?.points_awarded ?? 0,
      responseMs: myAnswer?.response_ms ?? null,
      result: result as QuestionResult,
    };
  }

  return {
    revealed: true,
    type: "POLL",
    selectedOptionId: myAnswer?.answer_option_id ?? null,
    result: result as PollResult,
  };
}
