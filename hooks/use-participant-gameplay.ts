"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ParticipantQuestion } from "@/lib/game/participant-question";
import type { LeaderboardRow, MyAnswerResult, SubmitAnswerResult } from "@/lib/data/live-answers";
import { computeDeadlineMs, computeRemainingSeconds } from "@/lib/game/timing";
import { useLivePoll } from "./use-live-poll";
import {
  getFinalLeaderboardAction,
  getMyResultAction,
  getPlayStateAction,
  submitAnswerAction,
  type PlayState,
} from "@/app/play/[sessionId]/actions";

export type GamePhase = "WAITING" | "QUESTION_ACTIVE" | "ANSWER_SUBMITTED" | "QUESTION_RESULTS" | "FINISHED";

const POLL_INTERVAL_MS = 2500;

function initialPhase(state: PlayState): GamePhase {
  if (state.status === "WAITING") return "WAITING";
  if (state.status === "FINISHED") return "FINISHED";
  if (state.status === "QUESTION_RESULTS") return "QUESTION_RESULTS";
  return state.hasAnsweredCurrent ? "ANSWER_SUBMITTED" : "QUESTION_ACTIVE";
}

/**
 * Live state machine for participant gameplay — real `game_sessions`/
 * `participant_answers` back every transition. No Realtime (Phase 10E):
 * phase changes the HOST makes (start/close/next/end) only reach this
 * participant via the ~2.5s poll (§11 — "polling tối thiểu").
 *
 * Deliberately dropped from the old mock hook: a synced "LEADERBOARD"
 * sub-phase between questions. The host's own leaderboard interstitial is
 * UI-only/local (§10 — no DB status for it), so a participant has no way to
 * know when the host is showing it without Realtime; showing one anyway
 * would either desync from the host or require inventing a fake timer.
 * Documented decision, not an oversight — QUIZ correct/incorrect + points
 * (CLAUDE.md's actual requirement) still show at QUESTION_RESULTS; a full
 * ranked board only appears once at FINISHED.
 */
export function useParticipantGameplay(sessionId: string, initialState: PlayState) {
  const [phase, setPhase] = useState<GamePhase>(initialPhase(initialState));
  const [question, setQuestion] = useState<ParticipantQuestion | null>(initialState.question);
  const [questionStartedAt, setQuestionStartedAt] = useState(initialState.currentQuestionStartedAt);
  const [totalQuestions, setTotalQuestions] = useState(initialState.totalQuestions);
  const [participantCount, setParticipantCount] = useState(initialState.participantCount);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [myScore, setMyScore] = useState(initialState.myScore);
  const [myResult, setMyResult] = useState<MyAnswerResult | null>(null);
  const [finalLeaderboard, setFinalLeaderboard] = useState<{
    entries: LeaderboardRow[];
    myParticipantId: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const lastHandledKeyRef = useRef(`${initialState.status}:${initialState.currentQuestionIndex}`);
  // TEMPORARY diagnostic tracing (participant/host poll transition
  // investigation) — tracks what was last applied, purely for the
  // [LIVE POLL APPLY] log below. Remove once confirmed fixed.
  const lastAppliedRef = useRef({
    status: initialState.status as string,
    questionId: initialState.question?.id ?? null,
  });
  // Tracks which transition key's result has actually been revealed=true —
  // distinct from lastHandledKeyRef, which just tracks "have I processed a
  // poll for this key at all". Needed because a result fetch during the
  // fix's grace window can legitimately come back `revealed:false` (the
  // question is closed but still within its grace period) — the hook must
  // keep RETRYING on subsequent poll ticks for the same key until a
  // `revealed:true` finally lands, not fetch once and give up.
  const revealedKeyRef = useRef<string | null>(null);

  const pollEnabled = phase !== "FINISHED";
  const { data: polled } = useLivePoll(() => getPlayStateAction(sessionId), POLL_INTERVAL_MS, pollEnabled);

  useEffect(() => {
    if (!polled || "error" in polled) return;

    // Syncing local state from the poll (an external system) — the
    // sanctioned setState-in-effect case, not a derivation of existing
    // props/state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMyScore(polled.myScore);
    setTotalQuestions(polled.totalQuestions);
    setParticipantCount(polled.participantCount);

    const key = `${polled.status}:${polled.currentQuestionIndex}`;
    const isNewTransition = key !== lastHandledKeyRef.current;
    lastHandledKeyRef.current = key;
    if (isNewTransition) revealedKeyRef.current = null;

    console.log("[LIVE POLL APPLY]", {
      previousStatus: lastAppliedRef.current.status,
      newStatus: polled.status,
      previousQuestionId: lastAppliedRef.current.questionId,
      newQuestionId: polled.question?.id ?? null,
      questionIndex: polled.currentQuestionIndex,
      hasAnsweredCurrent: polled.hasAnsweredCurrent,
      isNewTransition,
    });
    lastAppliedRef.current = { status: polled.status, questionId: polled.question?.id ?? null };

    if (polled.status === "WAITING") {
      setPhase("WAITING");
      return;
    }

    if (polled.status === "FINISHED") {
      setPhase("FINISHED");
      return;
    }

    if (polled.status === "QUESTION_ACTIVE") {
      if (isNewTransition) {
        setQuestion(polled.question);
        setQuestionStartedAt(polled.currentQuestionStartedAt);
        setSelectedOptionId(null);
        setMyResult(null);
      }
      setPhase(polled.hasAnsweredCurrent ? "ANSWER_SUBMITTED" : "QUESTION_ACTIVE");
      return;
    }

    // QUESTION_RESULTS
    setQuestion(polled.question);
    setPhase("QUESTION_RESULTS");
    if (polled.question && revealedKeyRef.current !== key) {
      const questionId = polled.question.id;
      void getMyResultAction(sessionId, questionId).then((r) => {
        // Guard against a late-resolving fetch for a question the host has
        // since moved past — without this, a slow response for Q1's result
        // could land AFTER the participant has already advanced to Q2 (its
        // own poll tick reset myResult to null and moved question/phase
        // on), silently overwriting fresh Q2 state with stale Q1 data.
        if (lastHandledKeyRef.current !== key) return;
        if ("error" in r) return;
        setMyResult(r);
        // Still within the fix's grace window (`revealed: false`) — the
        // NEXT poll tick (≤ ~2.5s later) will retry this same fetch rather
        // than leaving the participant stuck on "Đang chờ kết quả…"
        // forever, since `revealedKeyRef` only gets set once truly revealed.
        if (r.revealed) revealedKeyRef.current = key;
      });
    }
  }, [polled, sessionId]);

  useEffect(() => {
    if (phase !== "FINISHED" || finalLeaderboard) return;
    void getFinalLeaderboardAction(sessionId).then((r) => {
      if (!("error" in r)) setFinalLeaderboard(r);
    });
  }, [phase, finalLeaderboard, sessionId]);

  // Timer — pure client-side derivation from the server's own absolute
  // deadline (current_question_started_at + question.timerSeconds), shared
  // with the Host's identical derivation via lib/game/timing.ts. Never a
  // running local decrement — recomputed from the same two timestamps every
  // tick, so it can't drift, and reflects the exact same cutoff the server
  // enforces (plus grace) for answer submission.
  useEffect(() => {
    if ((phase !== "QUESTION_ACTIVE" && phase !== "ANSWER_SUBMITTED") || !questionStartedAt || !question) {
      return;
    }
    const deadlineMs = computeDeadlineMs(questionStartedAt, question.timerSeconds);
    const tick = () => setSecondsLeft(computeRemainingSeconds(deadlineMs));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase, questionStartedAt, question]);

  const selectOption = useCallback((optionId: string) => {
    setSelectedOptionId(optionId);
  }, []);

  const submitAnswer = useCallback(async (): Promise<SubmitAnswerResult> => {
    if (!question || selectedOptionId === null || submitting) {
      return { success: false, reason: "UNKNOWN_ERROR" };
    }
    setSubmitting(true);
    const result = await submitAnswerAction(sessionId, question.id, selectedOptionId);
    setSubmitting(false);
    if (result.success) setPhase("ANSWER_SUBMITTED");
    return result;
  }, [question, selectedOptionId, sessionId, submitting]);

  const myRank = finalLeaderboard?.entries.find((e) => e.participantId === finalLeaderboard.myParticipantId)?.rank ?? null;

  return {
    phase,
    totalQuestions,
    participantCount,
    participantQuestion: question,
    secondsLeft,
    selectedOptionId,
    myResult,
    myScore,
    finalLeaderboard: finalLeaderboard?.entries ?? [],
    myFinalRank: myRank,
    myParticipantId: finalLeaderboard?.myParticipantId ?? null,
    submitting,
    selectOption,
    submitAnswer,
  };
}
