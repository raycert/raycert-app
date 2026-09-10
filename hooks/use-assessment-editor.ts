"use client";

import { useCallback, useState } from "react";
import type {
  AnswerOption,
  Assessment,
  AssessmentSettings,
  AssessmentStatus,
  Question,
  QuestionType,
} from "@/types";
import { isQuestionComplete } from "@/lib/validation/question";
import {
  getAssessmentValidationMessages,
  getScoredQuestions,
  getTotalPoints,
} from "@/lib/validation/assessment";

const LABELS = ["A", "B", "C", "D", "E", "F"];
const MAX_OPTIONS: Record<QuestionType, number> = { QUIZ: 4, POLL: 6 };
const MIN_OPTIONS = 2;

function relabel(options: AnswerOption[]): AnswerOption[] {
  return options.map((o, i) => ({ ...o, label: LABELS[i] }));
}

function withComputedCompleteness(question: Question): Question {
  return { ...question, isComplete: isQuestionComplete(question) };
}

function createBlankQuestion(type: QuestionType, order: number): Question {
  const options = relabel([
    { id: crypto.randomUUID(), label: "A", text: "" },
    { id: crypto.randomUUID(), label: "B", text: "" },
  ]);
  return withComputedCompleteness({
    id: crypto.randomUUID(),
    type,
    text: "",
    options,
    timerSeconds: type === "QUIZ" ? 20 : 15,
    // Post-test default = 1 point/question (addendum §2) — NOT Live Quiz's
    // 1000-point preset (hooks/use-quiz-editor.ts keeps that, untouched).
    points: type === "QUIZ" ? 1 : undefined,
    order,
    isComplete: false,
  });
}

/** Forces status back to "inactive" whenever the assessment stops being
 * publishable — e.g. deleting the last QUIZ question while Active. */
function withStatusClamp(assessment: Assessment): Assessment {
  if (assessment.status === "active" && getAssessmentValidationMessages(assessment).length > 0) {
    return { ...assessment, status: "inactive" };
  }
  return assessment;
}

/**
 * Client/local editor state for the Assessment Editor (Phase 9A). Mirrors
 * `useQuizEditor`'s question-array CRUD (same `Question`/`AnswerOption`
 * shape, reused unmodified) plus Assessment-level fields — no persistence,
 * everything lives in React state seeded from mock data or a blank draft.
 */
export function useAssessmentEditor(initialAssessment: Assessment) {
  const [assessment, setAssessment] = useState<Assessment>(initialAssessment);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    initialAssessment.questions[0]?.id ?? null
  );

  const updateQuestions = useCallback(
    (updater: (questions: Question[]) => Question[]) => {
      setAssessment((prev) =>
        withStatusClamp({
          ...prev,
          questions: updater(prev.questions),
          updatedAt: new Date().toISOString(),
        })
      );
    },
    []
  );

  const setTitle = useCallback((title: string) => {
    setAssessment((prev) => withStatusClamp({ ...prev, title, updatedAt: new Date().toISOString() }));
  }, []);

  const setCompanyName = useCallback((companyName: string) => {
    setAssessment((prev) => ({ ...prev, companyName, updatedAt: new Date().toISOString() }));
  }, []);

  const setDescription = useCallback((description: string) => {
    setAssessment((prev) => ({ ...prev, description, updatedAt: new Date().toISOString() }));
  }, []);

  const updateBanner = useCallback(
    (patch: Partial<Pick<Assessment, "bannerImageUrl" | "bannerFileName" | "bannerMimeType">>) => {
      setAssessment((prev) => ({ ...prev, ...patch, updatedAt: new Date().toISOString() }));
    },
    []
  );

  const updateSettings = useCallback((patch: Partial<AssessmentSettings>) => {
    setAssessment((prev) =>
      withStatusClamp({
        ...prev,
        settings: { ...prev.settings, ...patch },
        updatedAt: new Date().toISOString(),
      })
    );
  }, []);

  const setStatus = useCallback((status: AssessmentStatus) => {
    setAssessment((prev) => withStatusClamp({ ...prev, status, updatedAt: new Date().toISOString() }));
  }, []);

  const selectQuestion = useCallback((id: string) => {
    setSelectedQuestionId(id);
  }, []);

  const addQuestion = useCallback(
    (type: QuestionType) => {
      const newQuestion = createBlankQuestion(type, assessment.questions.length + 1);
      updateQuestions((questions) => [...questions, newQuestion]);
      setSelectedQuestionId(newQuestion.id);
      return newQuestion.id;
    },
    [assessment.questions.length, updateQuestions]
  );

  const removeQuestion = useCallback(
    (id: string) => {
      updateQuestions((questions) =>
        questions.filter((q) => q.id !== id).map((q, i) => ({ ...q, order: i + 1 }))
      );
      setSelectedQuestionId((current) => (current === id ? null : current));
    },
    [updateQuestions]
  );

  const moveQuestion = useCallback(
    (id: string, direction: "up" | "down") => {
      updateQuestions((questions) => {
        const index = questions.findIndex((q) => q.id === id);
        const swapWith = direction === "up" ? index - 1 : index + 1;
        if (index < 0 || swapWith < 0 || swapWith >= questions.length) return questions;
        const next = [...questions];
        [next[index], next[swapWith]] = [next[swapWith], next[index]];
        return next.map((q, i) => ({ ...q, order: i + 1 }));
      });
    },
    [updateQuestions]
  );

  const patchQuestion = useCallback(
    (id: string, patch: Partial<Question>) => {
      updateQuestions((questions) =>
        questions.map((q) => (q.id === id ? withComputedCompleteness({ ...q, ...patch }) : q))
      );
    },
    [updateQuestions]
  );

  const addOption = useCallback(
    (questionId: string) => {
      updateQuestions((questions) =>
        questions.map((q) => {
          if (q.id !== questionId || q.options.length >= MAX_OPTIONS[q.type]) return q;
          const nextOptions = relabel([
            ...q.options,
            { id: crypto.randomUUID(), label: "", text: "" },
          ]);
          return withComputedCompleteness({ ...q, options: nextOptions });
        })
      );
    },
    [updateQuestions]
  );

  const removeOption = useCallback(
    (questionId: string, optionId: string) => {
      updateQuestions((questions) =>
        questions.map((q) => {
          if (q.id !== questionId || q.options.length <= MIN_OPTIONS) return q;
          const nextOptions = relabel(q.options.filter((o) => o.id !== optionId));
          return withComputedCompleteness({ ...q, options: nextOptions });
        })
      );
    },
    [updateQuestions]
  );

  const updateOptionText = useCallback(
    (questionId: string, optionId: string, text: string) => {
      updateQuestions((questions) =>
        questions.map((q) => {
          if (q.id !== questionId) return q;
          const nextOptions = q.options.map((o) => (o.id === optionId ? { ...o, text } : o));
          return withComputedCompleteness({ ...q, options: nextOptions });
        })
      );
    },
    [updateQuestions]
  );

  const setCorrectOption = useCallback(
    (questionId: string, optionId: string) => {
      updateQuestions((questions) =>
        questions.map((q) => {
          if (q.id !== questionId || q.type !== "QUIZ") return q;
          const nextOptions = q.options.map((o) => ({ ...o, isCorrect: o.id === optionId }));
          return withComputedCompleteness({ ...q, options: nextOptions });
        })
      );
    },
    [updateQuestions]
  );

  const importQuestions = useCallback(
    (newQuestions: Question[]) => {
      if (newQuestions.length === 0) return;
      updateQuestions((questions) =>
        [...questions, ...newQuestions].map((q, i) => ({ ...q, order: i + 1 }))
      );
      setSelectedQuestionId(newQuestions[0].id);
    },
    [updateQuestions]
  );

  const selectedQuestion = assessment.questions.find((q) => q.id === selectedQuestionId) ?? null;
  const scoredQuestionCount = getScoredQuestions(assessment.questions).length;
  // Derived, not stored — recomputed every render so it stays in sync with
  // add/remove/edit-points/import automatically (addendum §3).
  const totalPoints = getTotalPoints(assessment.questions);
  const validationMessages = getAssessmentValidationMessages(assessment);
  const isPublishable = validationMessages.length === 0;

  return {
    assessment,
    selectedQuestion,
    selectedQuestionId,
    scoredQuestionCount,
    totalPoints,
    validationMessages,
    isPublishable,
    setTitle,
    setCompanyName,
    setDescription,
    updateBanner,
    updateSettings,
    setStatus,
    selectQuestion,
    addQuestion,
    removeQuestion,
    moveQuestion,
    patchQuestion,
    addOption,
    removeOption,
    updateOptionText,
    setCorrectOption,
    importQuestions,
  };
}
