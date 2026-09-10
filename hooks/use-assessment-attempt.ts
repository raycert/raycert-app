"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AnswerOption, Assessment, AssessmentAttempt, AttemptStatus, Question, SubmissionReason } from "@/types";
import { getScoredQuestions } from "@/lib/validation/assessment";
import { summarizeAttempt } from "@/lib/assessment/scoring";
import { getAttemptHistoryForIdentity, getNextAttemptNumber, saveAttempt } from "@/lib/assessment/attempt-store";
import {
  toAssessmentParticipantQuestion,
  type AssessmentParticipantQuestion,
} from "@/lib/assessment/participant-question";
import { useAssessmentTimer } from "./use-assessment-timer";

const LABELS = ["A", "B", "C", "D"];

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Re-letters by new position after a shuffle — `id` (and therefore
 * correctness) always travels with the option object, never rebuilt by
 * index, so the id/correct mapping can never drift (§13). */
function relabelOptions(options: AnswerOption[]): AnswerOption[] {
  return options.map((o, i) => ({ ...o, label: LABELS[i] ?? o.label }));
}

/**
 * Post-test attempt state machine (Phase 9C; attempt-limit/scoring/history
 * wiring completed Phase 9D) — self-paced, multi-question navigation, one
 * overall timer. Deliberately NOT a reuse/extension of
 * `use-participant-gameplay.ts`: Live Quiz's Select+Confirm + per-question
 * countdown + auto-advance is a fundamentally different interaction model
 * from Post-test's freely-revisitable, single-overall-timer flow (this
 * phase's §30 regression list keeps both models intact, unmerged).
 *
 * Attempt creation (shuffle, `startedAt`, `expiresAt`, attempt `id`,
 * `attemptNumber`) happens inside a mount-only effect — never in the render
 * body or a lazy `useState` initializer — so `Math.random()`/`Date.now()`/
 * `crypto.randomUUID()`/`sessionStorage` never run during the server-rendered
 * pass of this "use client" component, avoiding a hydration mismatch. A
 * refresh of `/take` re-runs this effect: `attemptNumber` is recomputed from
 * `getNextAttemptNumber` (sessionStorage-backed attempt history, scoped to
 * this `fullName`+`department` — see `lib/assessment/attempt-store.ts`), so
 * a refresh does NOT silently reuse/renumber a still-in-progress attempt —
 * it's simply a fresh, unsaved attempt at that same number until it locks.
 */
export function useAssessmentAttempt(assessment: Assessment, fullName: string, department: string) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [orderedQuestions, setOrderedQuestions] = useState<Question[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // §11 — never create an attempt beyond maxAttempts, even via a direct
    // `/take` navigation that bypasses the Retake gate on `/result`. Scoped
    // to THIS learner (fullName+department) — bug fix: this used to count
    // every attempt for the Assessment regardless of who made it, so a
    // second, different person starting a fresh attempt after the first
    // person had already used up maxAttempts got silently bounced to the
    // first person's locked Result instead of getting their own attempt.
    const attemptNumber = getNextAttemptNumber(assessment.id, fullName, department);
    if (attemptNumber > assessment.settings.maxAttempts) {
      const history = getAttemptHistoryForIdentity(assessment.id, fullName, department);
      const lastAttempt = history[history.length - 1];
      if (lastAttempt) {
        router.replace(`/assessment/${assessment.id}/result?attemptId=${lastAttempt.id}`);
      } else {
        router.replace(`/assessment/${assessment.id}/start`);
      }
      return;
    }

    const scored = getScoredQuestions(assessment.questions);
    const naturalOrder = [...scored].sort((a, b) => a.order - b.order);
    const ordered = assessment.settings.randomizeQuestions ? shuffle(naturalOrder) : naturalOrder;
    const withOptions = ordered.map((q) =>
      assessment.settings.randomizeAnswers ? { ...q, options: relabelOptions(shuffle(q.options)) } : q
    );

    const startedAt = new Date().toISOString();
    const expiresAt =
      assessment.settings.timeLimitMinutes !== null
        ? new Date(Date.now() + assessment.settings.timeLimitMinutes * 60_000).toISOString()
        : null;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-only bootstrap: this IS the attempt's creation, not a derived mirror of other state
    setOrderedQuestions(withOptions);
    setAttempt({
      id: crypto.randomUUID(),
      assessmentId: assessment.id,
      fullName,
      department,
      startedAt,
      expiresAt,
      submittedAt: null,
      attemptNumber,
      status: "IN_PROGRESS",
      submissionReason: null,
      answers: withOptions.map((q) => ({ questionId: q.id, selectedOptionId: null })),
      questionOrder: withOptions.map((q) => q.id),
      // Scoring fields — meaningless while IN_PROGRESS, never read/rendered
      // until the lock effect below computes the real values (§16/§18).
      correctCount: 0,
      incorrectCount: 0,
      unansweredCount: 0,
      earnedPoints: 0,
      totalPoints: 0,
      scorePercent: 0,
      passed: false,
    });
    // Intentionally runs exactly once per mount — a fresh attempt every time
    // /take loads (see doc comment above); assessment/fullName/department
    // are stable for the lifetime of this route.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const timer = useAssessmentTimer(attempt?.expiresAt ?? null);

  const submit = useCallback(
    (reason: SubmissionReason) => {
      setAttempt((prev) => {
        if (!prev || prev.status !== "IN_PROGRESS") return prev;
        const nextStatus: AttemptStatus = reason === "TIMEOUT" ? "TIMEOUT" : "SUBMITTED";
        return { ...prev, status: nextStatus, submittedAt: new Date().toISOString(), submissionReason: reason };
      });
    },
    []
  );

  // Auto-submit the instant the overall timer runs out (§11) — never a
  // per-question timeout, there is no per-question timer in Post-test.
  useEffect(() => {
    if (timer.isExpired && attempt?.status === "IN_PROGRESS") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to an external signal (wall-clock timer expiring), the canonical case this rule allows
      submit("TIMEOUT");
    }
  }, [timer.isExpired, attempt?.status, submit]);

  // Once locked (manual or timeout): score it, persist it to attempt
  // history (lib/assessment/attempt-store.ts), and redirect to /result —
  // a single effect covers both submission paths.
  useEffect(() => {
    if (!attempt || !orderedQuestions) return;
    if (attempt.status !== "SUBMITTED" && attempt.status !== "TIMEOUT") return;
    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;

    const summary = summarizeAttempt(orderedQuestions, attempt.answers, assessment.settings.minimumPassingPoints);
    const finalAttempt: AssessmentAttempt = {
      ...attempt,
      answers: summary.answers,
      correctCount: summary.correctCount,
      incorrectCount: summary.incorrectCount,
      unansweredCount: summary.unansweredCount,
      earnedPoints: summary.earnedPoints,
      totalPoints: summary.totalPoints,
      scorePercent: summary.scorePercent,
      passed: summary.passed,
    };
    saveAttempt(assessment.id, finalAttempt);
    setAttempt(finalAttempt);
    router.push(`/assessment/${assessment.id}/result?attemptId=${finalAttempt.id}`);
  }, [attempt, orderedQuestions, assessment.id, assessment.settings.minimumPassingPoints, router]);

  const selectAnswer = useCallback(
    (optionId: string) => {
      if (!orderedQuestions) return;
      const questionId = orderedQuestions[currentIndex]?.id;
      if (!questionId) return;
      setAttempt((prev) => {
        if (!prev || prev.status !== "IN_PROGRESS") return prev;
        return {
          ...prev,
          answers: prev.answers.map((a) =>
            a.questionId === questionId
              ? { ...a, selectedOptionId: optionId, answeredAt: new Date().toISOString() }
              : a
          ),
        };
      });
    },
    [orderedQuestions, currentIndex]
  );

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (orderedQuestions && i < orderedQuestions.length - 1 ? i + 1 : i));
  }, [orderedQuestions]);

  const goPrevious = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const jumpTo = useCallback(
    (index: number) => {
      if (!orderedQuestions) return;
      setCurrentIndex(Math.min(Math.max(0, index), orderedQuestions.length - 1));
    },
    [orderedQuestions]
  );

  const participantQuestions: AssessmentParticipantQuestion[] = orderedQuestions
    ? orderedQuestions.map((q, i) => toAssessmentParticipantQuestion(q, i + 1))
    : [];

  const totalQuestions = orderedQuestions?.length ?? 0;
  const currentQuestion = participantQuestions[currentIndex] ?? null;
  const currentAnswer = attempt?.answers.find((a) => a.questionId === currentQuestion?.id) ?? null;
  const answeredQuestionIds = new Set(
    (attempt?.answers ?? []).filter((a) => a.selectedOptionId !== null).map((a) => a.questionId)
  );

  return {
    isReady: attempt !== null && orderedQuestions !== null,
    attempt,
    participantQuestions,
    currentIndex,
    currentQuestion,
    selectedOptionId: currentAnswer?.selectedOptionId ?? null,
    answeredQuestionIds,
    timer,
    answeredCount: answeredQuestionIds.size,
    totalQuestions,
    selectAnswer,
    goNext,
    goPrevious,
    jumpTo,
    submit,
  };
}
