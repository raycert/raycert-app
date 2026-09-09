"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LeaderboardEntry, PollResult, Question, QuestionResult } from "@/types";
import { mockParticipants } from "@/mocks";
import { getGameplayResult, mockGameplayQuestions } from "@/mocks/gameplay";
import { toParticipantQuestion, type ParticipantQuestion } from "@/lib/game/participant-question";

export type HostGamePhase = "QUESTION_ACTIVE" | "QUESTION_RESULTS" | "LEADERBOARD" | "FINISHED";

export interface HostLeaderboardEntry extends LeaderboardEntry {
  previousRank: number | null;
  delta: number;
}

// Mock-only pacing: no realtime backend, so response count during
// QUESTION_ACTIVE just ticks up on its own to look alive (§10).
const RESPONSE_TICK_MS = 900;

function rankParticipants(scores: Record<string, number>): LeaderboardEntry[] {
  return mockParticipants
    .map((p) => ({
      rank: 0,
      participantId: p.id,
      nickname: p.nickname,
      score: scores[p.id] ?? p.totalScore,
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

/**
 * Local state machine for Host Live Gameplay (Phase 7) — unlike the
 * participant's timer-only auto-advance (Phase 6), transitions here are
 * host-action-driven (Close Question / Next Question / End Game), matching
 * CLAUDE.md §3 ("Host ... Start/end câu hỏi"). The countdown reaching 0 also
 * auto-closes the question, so a forgetful host doesn't get stuck.
 */
export function useHostGameplay() {
  const [phase, setPhase] = useState<HostGamePhase>("QUESTION_ACTIVE");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(mockGameplayQuestions[0].timerSeconds);
  const [responseCount, setResponseCount] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(mockParticipants.map((p) => [p.id, p.totalScore]))
  );
  const [lastDeltas, setLastDeltas] = useState<Record<string, number>>({});
  const [previousRanks, setPreviousRanks] = useState<Record<string, number>>({});

  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const responseIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (responseIntervalRef.current) clearInterval(responseIntervalRef.current);
    timerIntervalRef.current = null;
    responseIntervalRef.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const question: Question = mockGameplayQuestions[questionIndex];
  const result = getGameplayResult(question.id);

  const closeQuestion = useCallback(() => {
    clearTimers();
    setPhase((p) => (p === "QUESTION_ACTIVE" ? "QUESTION_RESULTS" : p));

    // Snapshot ranks *before* this question's scoring lands, so the
    // leaderboard can show who moved up/down because of it.
    setPreviousRanks(
      Object.fromEntries(rankParticipants(scores).map((e) => [e.participantId, e.rank]))
    );

    if (question.type === "QUIZ") {
      const quizResult = result as QuestionResult | undefined;
      const correctProbability = (quizResult?.correctRate ?? 50) / 100;
      const deltas: Record<string, number> = {};
      for (const p of mockParticipants) {
        const gotItRight = Math.random() < correctProbability;
        deltas[p.id] = gotItRight
          ? (question.points ?? 1000) + Math.round(Math.random() * 300)
          : 0;
      }
      setScores((prev) => {
        const next = { ...prev };
        for (const id of Object.keys(deltas)) {
          next[id] = (prev[id] ?? 0) + deltas[id];
        }
        return next;
      });
      setLastDeltas(deltas);
    } else {
      setLastDeltas({});
    }
  }, [clearTimers, question, result, scores]);

  const goToNextQuestion = useCallback(() => {
    const next = questionIndex + 1;
    if (next >= mockGameplayQuestions.length) {
      setPhase("FINISHED");
      return;
    }
    setQuestionIndex(next);
    setSecondsLeft(mockGameplayQuestions[next].timerSeconds);
    setResponseCount(0);
    setPhase("QUESTION_ACTIVE");
  }, [questionIndex]);

  const advanceFromResults = useCallback(() => {
    if (question.type === "QUIZ") {
      setPhase("LEADERBOARD");
    } else {
      goToNextQuestion();
    }
  }, [question, goToNextQuestion]);

  const endGame = useCallback(() => {
    clearTimers();
    setPhase("FINISHED");
  }, [clearTimers]);

  // Dev/mock-only helper (§10) — never used by the real host controls.
  const devBumpResponseCount = useCallback(() => {
    setResponseCount((c) => Math.min(c + 1, mockParticipants.length));
  }, []);

  useEffect(() => {
    if (phase !== "QUESTION_ACTIVE") return;
    timerIntervalRef.current = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [phase, questionIndex]);

  useEffect(() => {
    if (phase === "QUESTION_ACTIVE" && secondsLeft === 0) {
      // Timer reaching 0 is an external event (like a WebSocket message)
      // this effect reacts to — auto-closing the question, same as a host
      // clicking "Close Question" themselves.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      closeQuestion();
    }
  }, [secondsLeft, phase, closeQuestion]);

  // Mock-only: response count creeps up on its own while a question is live.
  useEffect(() => {
    if (phase !== "QUESTION_ACTIVE") return;
    responseIntervalRef.current = setInterval(() => {
      setResponseCount((c) => Math.min(c + 1, mockParticipants.length));
    }, RESPONSE_TICK_MS);
    return () => {
      if (responseIntervalRef.current) clearInterval(responseIntervalRef.current);
    };
  }, [phase, questionIndex]);

  const participantQuestion: ParticipantQuestion = toParticipantQuestion(question);
  const ranked = rankParticipants(scores);
  const leaderboard: HostLeaderboardEntry[] = ranked.map((entry) => ({
    ...entry,
    previousRank: previousRanks[entry.participantId] ?? null,
    delta: lastDeltas[entry.participantId] ?? 0,
  }));

  return {
    phase,
    questionIndex,
    totalQuestions: mockGameplayQuestions.length,
    totalParticipants: mockParticipants.length,
    question, // full data (includes isCorrect) — only ever pass to Results-phase components
    participantQuestion, // sanitized — the only shape allowed during QUESTION_ACTIVE
    result: result as QuestionResult | PollResult | undefined,
    secondsLeft,
    responseCount,
    leaderboard,
    closeQuestion,
    advanceFromResults,
    nextQuestion: goToNextQuestion,
    endGame,
    devBumpResponseCount,
  };
}
