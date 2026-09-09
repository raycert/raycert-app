"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LeaderboardEntry, QuestionResult } from "@/types";
import { mockParticipants } from "@/mocks";
import { getGameplayResult, mockGameplayQuestions } from "@/mocks/gameplay";
import { toParticipantQuestion, type ParticipantQuestion } from "@/lib/game/participant-question";
import { calculateMockQuizPoints } from "@/lib/game/scoring";

export type GamePhase =
  | "WAITING"
  | "QUESTION_ACTIVE"
  | "ANSWER_SUBMITTED"
  | "QUESTION_RESULTS"
  | "LEADERBOARD"
  | "FINISHED";

export interface AnswerRecord {
  optionId: string | null; // null = timed out with no answer
  isCorrect?: boolean; // QUIZ only
  pointsAwarded?: number; // QUIZ only
  responseMs?: number;
}

// Mock-only pacing for the auto-advance ("host ends question / moves on")
// simulation — not a security/timing boundary, just demo pacing.
const RESULT_DISPLAY_MS = 4000;
const LEADERBOARD_DISPLAY_MS = 4000;
const ME_ID = "me";

/**
 * Local state machine for participant gameplay (Phase 6). No backend: the
 * countdown "ending" a question (not the participant's own submit) is what
 * simulates the host closing it — matching how a real session would work,
 * where results only appear once the host/server ends the question for
 * everyone, not the instant one participant submits.
 */
export function useParticipantGameplay(nickname: string) {
  const [phase, setPhase] = useState<GamePhase>("WAITING");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({});
  const [myScore, setMyScore] = useState(0);

  // Kept in sync at every state-setting call site (not via a mirroring
  // effect) so timer callbacks always read the latest value, never a stale
  // closure, without needing a reducer.
  const currentRef = useRef({ questionIndex: 0, selectedOptionId: null as string | null });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionStartedAtRef = useRef(0);
  // Set at the moment `submitAnswer` is actually called — closeQuestion (which
  // only runs once the timer/host ends the question, possibly much later)
  // must score against *this* timestamp, not against whenever it happens to run.
  const submittedAtRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    intervalRef.current = null;
    advanceTimeoutRef.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const enterQuestion = useCallback(
    (index: number) => {
      clearTimers();
      const question = mockGameplayQuestions[index];
      currentRef.current = { questionIndex: index, selectedOptionId: null };
      setQuestionIndex(index);
      setSelectedOptionId(null);
      setSecondsLeft(question.timerSeconds);
      questionStartedAtRef.current = Date.now();
      submittedAtRef.current = null;
      setPhase("QUESTION_ACTIVE");
    },
    [clearTimers]
  );

  const goToNextQuestion = useCallback(() => {
    const nextIndex = currentRef.current.questionIndex + 1;
    if (nextIndex >= mockGameplayQuestions.length) {
      clearTimers();
      setPhase("FINISHED");
      return;
    }
    enterQuestion(nextIndex);
  }, [clearTimers, enterQuestion]);

  const closeQuestion = useCallback(() => {
    clearTimers();
    const { questionIndex: idx, selectedOptionId: selected } = currentRef.current;
    const question = mockGameplayQuestions[idx];
    const result = getGameplayResult(question.id);

    let record: AnswerRecord;
    if (question.type === "QUIZ") {
      const correctOptionId = (result as QuestionResult | undefined)?.correctOptionId;
      const isCorrect = selected !== null && selected === correctOptionId;
      const responseMs =
        selected !== null && submittedAtRef.current !== null
          ? submittedAtRef.current - questionStartedAtRef.current
          : undefined;
      const totalMs = question.timerSeconds * 1000;
      const remainingMs = responseMs !== undefined ? Math.max(0, totalMs - responseMs) : 0;
      const pointsAwarded = calculateMockQuizPoints({
        isCorrect,
        basePoints: question.points ?? 1000,
        remainingMs,
        totalMs,
      });
      record = { optionId: selected, isCorrect, pointsAwarded, responseMs };
      setMyScore((s) => s + pointsAwarded);
    } else {
      record = { optionId: selected };
    }

    setAnswers((prev) => ({ ...prev, [question.id]: record }));
    setPhase("QUESTION_RESULTS");

    advanceTimeoutRef.current = setTimeout(() => {
      if (question.type === "QUIZ") {
        setPhase("LEADERBOARD");
        advanceTimeoutRef.current = setTimeout(goToNextQuestion, LEADERBOARD_DISPLAY_MS);
      } else {
        goToNextQuestion();
      }
    }, RESULT_DISPLAY_MS);
  }, [clearTimers, goToNextQuestion]);

  const startGame = useCallback(() => {
    setMyScore(0);
    setAnswers({});
    enterQuestion(0);
  }, [enterQuestion]);

  const selectOption = useCallback((optionId: string) => {
    currentRef.current.selectedOptionId = optionId;
    setSelectedOptionId(optionId);
  }, []);

  const submitAnswer = useCallback(() => {
    setPhase((p) => {
      if (p !== "QUESTION_ACTIVE") return p;
      submittedAtRef.current = Date.now();
      return "ANSWER_SUBMITTED";
    });
  }, []);

  // Countdown ticks while active or submitted — it keeps running after this
  // participant submits, because everyone else (and the host) is still on
  // the clock too.
  useEffect(() => {
    if (phase !== "QUESTION_ACTIVE" && phase !== "ANSWER_SUBMITTED") return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, questionIndex]);

  // Timer hitting 0 is what closes the question — simulating the host/
  // server ending it, independent of whether this participant submitted.
  useEffect(() => {
    if ((phase === "QUESTION_ACTIVE" || phase === "ANSWER_SUBMITTED") && secondsLeft === 0) {
      closeQuestion();
    }
  }, [secondsLeft, phase, closeQuestion]);

  const question = mockGameplayQuestions[questionIndex];
  const participantQuestion: ParticipantQuestion | null = question
    ? toParticipantQuestion(question)
    : null;
  const currentResult = question ? getGameplayResult(question.id) : undefined;
  const currentAnswer = question ? answers[question.id] : undefined;

  const leaderboard: { entries: LeaderboardEntry[]; myRank: number } = (() => {
    const others: LeaderboardEntry[] = mockParticipants.map((p) => ({
      rank: 0,
      participantId: p.id,
      nickname: p.nickname,
      score: p.totalScore,
    }));
    const combined = [
      ...others,
      { rank: 0, participantId: ME_ID, nickname, score: myScore },
    ].sort((a, b) => b.score - a.score);
    const ranked = combined.map((entry, i) => ({ ...entry, rank: i + 1 }));
    const myRank = ranked.find((e) => e.participantId === ME_ID)?.rank ?? ranked.length;
    return { entries: ranked, myRank };
  })();

  return {
    phase,
    questionIndex,
    totalQuestions: mockGameplayQuestions.length,
    participantQuestion,
    secondsLeft,
    selectedOptionId,
    currentResult,
    currentAnswer,
    myScore,
    leaderboard,
    startGame,
    selectOption,
    submitAnswer,
  };
}
