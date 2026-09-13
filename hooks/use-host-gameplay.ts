"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { LeaderboardEntry, PollResult, Question, QuestionResult } from "@/types";
import { toParticipantQuestion, type ParticipantQuestion } from "@/lib/game/participant-question";
import { ANSWER_GRACE_PERIOD_MS, computeDeadlineMs, computeRemainingSeconds } from "@/lib/game/timing";
import { useLivePoll } from "./use-live-poll";
import {
  closeQuestionAction,
  endGameAction,
  getCurrentQuestionResultAction,
  getHostLiveStateAction,
  nextQuestionAction,
} from "@/app/host/[sessionId]/actions";

export type HostGamePhase = "QUESTION_ACTIVE" | "QUESTION_RESULTS" | "LEADERBOARD" | "FINISHED";

export interface HostLeaderboardEntry extends LeaderboardEntry {
  previousRank: number | null;
  delta: number;
}

const POLL_INTERVAL_MS = 2500;

function toEntries(
  rows: { participantId: string; nickname: string; score: number; rank: number }[]
): HostLeaderboardEntry[] {
  return rows.map((e) => ({ ...e, previousRank: null, delta: 0 }));
}

/**
 * Live state machine for Host Live Gameplay (Phase 10D) — real
 * `game_sessions` row backs every transition now, via the Server Actions in
 * `app/host/[sessionId]/actions.ts`; the countdown reaching 0 still
 * auto-closes the question the same way it always did, just by calling the
 * real `closeQuestionAction` instead of flipping local state. "LEADERBOARD"
 * stays a UI-only sub-phase of `QUESTION_RESULTS` (§10 explicitly allows
 * this — no separate DB status), reached only via the host's own click.
 *
 * No Realtime (Phase 10E): other participants' answers/scores only show up
 * here via the ~2.5s poll that runs while a question is live (§11 —
 * "polling tối thiểu nếu thật sự cần").
 */
export function useHostGameplay(params: {
  sessionId: string;
  quiz: { title: string; questions: Question[] };
  initialStatus: "QUESTION_ACTIVE" | "QUESTION_RESULTS" | "FINISHED";
  initialQuestionIndex: number;
  initialQuestionStartedAt: string | null;
  initialLeaderboard: { participantId: string; nickname: string; score: number; rank: number }[];
}) {
  const { sessionId, quiz } = params;

  const [phase, setPhase] = useState<HostGamePhase>(params.initialStatus);
  const [questionIndex, setQuestionIndex] = useState(params.initialQuestionIndex);
  const [questionStartedAt, setQuestionStartedAt] = useState(params.initialQuestionStartedAt);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [leaderboard, setLeaderboard] = useState<HostLeaderboardEntry[]>(
    toEntries(params.initialLeaderboard)
  );
  const [responseCount, setResponseCount] = useState(0);
  const [result, setResult] = useState<QuestionResult | PollResult | undefined>(undefined);
  // Every closed question's result, keyed by question id — the only way to
  // compute a real "average QUIZ correct rate" at FINISHED without
  // re-querying every past question (§ FinalLeaderboard's avgCorrectRate).
  const [questionResults, setQuestionResults] = useState<Record<string, QuestionResult | PollResult>>({});
  // Guards Close/Next/EndGame against a double-click or the auto-close
  // timer firing while a click is already in flight — without this, two
  // concurrent calls could race (the second reads a status the first
  // hasn't committed yet and errors confusingly, even though the first
  // succeeded) (§9).
  const [transitioning, setTransitioning] = useState(false);
  const transitioningRef = useRef(false);
  // True only during the grace-period wait between "question closed" and
  // "final results fetched/rendered" — surfaced so the UI can show a brief
  // "đang chờ câu trả lời cuối" message instead of an empty results panel.
  const [awaitingFinalAnswers, setAwaitingFinalAnswers] = useState(false);

  const leaderboardRef = useRef(leaderboard);

  useEffect(() => {
    leaderboardRef.current = leaderboard;
  }, [leaderboard]);

  const question: Question | undefined = quiz.questions[questionIndex];

  const { data: polled } = useLivePoll(
    () => getHostLiveStateAction(sessionId),
    POLL_INTERVAL_MS,
    phase === "QUESTION_ACTIVE"
  );

  useEffect(() => {
    if (!polled || "error" in polled) return;
    // Syncing local state from the poll (an external system) — the
    // sanctioned setState-in-effect case, not a derivation of existing
    // props/state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResponseCount(polled.responseCount);
    // Only fold poll-derived scores in while a question is live —
    // QUESTION_RESULTS/LEADERBOARD hold a frozen snapshot (with
    // previousRank/delta computed at close time) a background poll tick
    // must not clobber.
    if (phase === "QUESTION_ACTIVE") {
      setLeaderboard(toEntries(polled.leaderboard));
    }
  }, [polled, phase]);

  // Timer — pure client-side derivation from the server's own absolute
  // deadline (current_question_started_at + question.timerSeconds), shared
  // with the Participant's identical derivation via lib/game/timing.ts.
  // Never a running local decrement — recomputed from the same two
  // timestamps every tick, so it can't drift (CLAUDE.md §5: server decides
  // the timer; only the *ticking display* is computed client-side).
  useEffect(() => {
    if (phase !== "QUESTION_ACTIVE" || !questionStartedAt || !question) return;
    const deadlineMs = computeDeadlineMs(questionStartedAt, question.timerSeconds);

    // TEMPORARY trace (timer/auto-close investigation) — logs once per
    // mount of this effect, i.e. once per question. If this ever logs
    // TWICE in a row for the same questionId without a "cleared" in
    // between, that's a duplicate-timer bug; if it logs once but with a
    // deadline sooner than expected, that's a unit/timestamp bug.
    console.log("[HOST TIMER INIT]", {
      questionId: question.id,
      startedAt: questionStartedAt,
      deadline: new Date(deadlineMs).toISOString(),
      browserNow: new Date().toISOString(),
      calculatedRemaining: computeRemainingSeconds(deadlineMs),
    });

    const tick = () => setSecondsLeft(computeRemainingSeconds(deadlineMs));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase, questionStartedAt, question]);

  const closeQuestion = useCallback(async (source: "MANUAL_HOST" | "TIMER" = "MANUAL_HOST") => {
    if (transitioningRef.current) return;
    transitioningRef.current = true;
    setTransitioning(true);

    try {
      const preClose = new Map(leaderboardRef.current.map((e) => [e.participantId, e]));

      const closeResult = await closeQuestionAction(sessionId, source);
      if (closeResult.error) {
        // Surfaced, not silently swallowed — a host clicking Close Question
        // and seeing nothing happen (no error, no phase change) is exactly
        // the symptom this is fixing.
        toast.error(closeResult.error);
        return;
      }

      setPhase("QUESTION_RESULTS");

      // Grace-period wait (fix, §3/§6) — the question's answer window is
      // authoritatively [start, deadline + ANSWER_GRACE_PERIOD_MS] no
      // matter when Close was clicked (a manual click before the nominal
      // deadline, or the auto-close-on-timer-0 effect right at it). Waiting
      // here before ever fetching results means an in-flight submission
      // that's still genuinely within its window has a real chance to land
      // in participant_answers first — never snapshot a result before the
      // last acceptable requests have been processed.
      if (questionStartedAt && question) {
        const deadlineMs = computeDeadlineMs(questionStartedAt, question.timerSeconds);
        const waitMs = deadlineMs + ANSWER_GRACE_PERIOD_MS - Date.now();
        if (waitMs > 0) {
          setAwaitingFinalAnswers(true);
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          setAwaitingFinalAnswers(false);
        }
      }

      const [state, questionResult] = await Promise.all([
        getHostLiveStateAction(sessionId),
        getCurrentQuestionResultAction(sessionId),
      ]);

      if (!("error" in state)) {
        setResponseCount(state.responseCount);
        setLeaderboard(
          state.leaderboard.map((e) => ({
            ...e,
            previousRank: preClose.get(e.participantId)?.rank ?? null,
            delta: e.score - (preClose.get(e.participantId)?.score ?? e.score),
          }))
        );
      }
      if (!("error" in questionResult)) {
        setResult(questionResult);
        if (question) {
          setQuestionResults((prev) => ({ ...prev, [question.id]: questionResult }));
        }
      }
    } finally {
      transitioningRef.current = false;
      setTransitioning(false);
    }
  }, [sessionId, question, questionStartedAt]);

  const nextQuestion = useCallback(async () => {
    if (transitioningRef.current) return;
    transitioningRef.current = true;
    setTransitioning(true);

    try {
      const res = await nextQuestionAction(sessionId);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }

      if (res.finished) {
        setPhase("FINISHED");
        const state = await getHostLiveStateAction(sessionId);
        if (!("error" in state)) setLeaderboard(toEntries(state.leaderboard));
        return;
      }

      setQuestionIndex((i) => i + 1);
      setQuestionStartedAt(new Date().toISOString()); // optimistic — the next poll tick corrects it if it drifts
      setResponseCount(0);
      setResult(undefined);
      setPhase("QUESTION_ACTIVE");
    } finally {
      transitioningRef.current = false;
      setTransitioning(false);
    }
  }, [sessionId]);

  const advanceFromResults = useCallback(() => {
    if (question?.type === "QUIZ") {
      setPhase("LEADERBOARD");
    } else {
      void nextQuestion();
    }
  }, [question, nextQuestion]);

  const endGame = useCallback(async () => {
    if (transitioningRef.current) return;
    transitioningRef.current = true;
    setTransitioning(true);

    try {
      const res = await endGameAction(sessionId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setPhase("FINISHED");
      const state = await getHostLiveStateAction(sessionId);
      if (!("error" in state)) setLeaderboard(toEntries(state.leaderboard));
    } finally {
      transitioningRef.current = false;
      setTransitioning(false);
    }
  }, [sessionId]);

  // Timer hitting 0 auto-closes — same host-is-the-authority behavior as
  // before, now backed by the real DB write AND a mandatory server-side
  // deadline check (source: "TIMER" — see closeCurrentQuestion's doc
  // comment). This is the ONLY place in the codebase that triggers an
  // automatic close; there is no participant-side or realtime-listener
  // trigger anywhere.
  useEffect(() => {
    if (phase === "QUESTION_ACTIVE" && secondsLeft === 0 && questionStartedAt && question) {
      const deadlineMs = computeDeadlineMs(questionStartedAt, question.timerSeconds);
      console.log("[AUTO CLOSE ATTEMPT]", {
        questionId: question.id,
        caller: "hooks/use-host-gameplay.ts (secondsLeft===0 effect)",
        startedAt: questionStartedAt,
        deadline: new Date(deadlineMs).toISOString(),
        now: new Date().toISOString(),
        nowMinusDeadlineMs: Date.now() - deadlineMs,
      });
      void closeQuestion("TIMER");
    }
  }, [secondsLeft, phase, questionStartedAt, question, closeQuestion]);

  const participantQuestion: ParticipantQuestion | null = question ? toParticipantQuestion(question) : null;

  return {
    phase,
    questionIndex,
    totalQuestions: quiz.questions.length,
    totalParticipants: leaderboard.length,
    question,
    participantQuestion,
    result,
    questionResults,
    secondsLeft,
    responseCount,
    leaderboard,
    transitioning,
    awaitingFinalAnswers,
    closeQuestion,
    advanceFromResults,
    nextQuestion,
    endGame,
  };
}
