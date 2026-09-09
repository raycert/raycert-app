"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AnswerOption, Question, QuestionType, Quiz } from "@/types";
import { isQuestionComplete } from "@/lib/validation/question";

export type SaveStatus = "saved" | "saving" | "unsaved";

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
    points: type === "QUIZ" ? 1000 : undefined,
    order,
    isComplete: false,
  });
}

/**
 * Client/local editor state for the Quiz Editor (Phase 3). No persistence —
 * everything lives in React state, seeded once from mock data or a blank
 * draft. Also drives the "Chưa lưu → Đang lưu… → Đã lưu" save-status mock.
 */
export function useQuizEditor(initialQuiz: Quiz) {
  const [quiz, setQuiz] = useState<Quiz>(initialQuiz);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    initialQuiz.questions[0]?.id ?? null
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

  const isFirstRender = useRef(true);
  const savingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSaveStatus("unsaved");
    if (savingTimer.current) clearTimeout(savingTimer.current);
    if (savedTimer.current) clearTimeout(savedTimer.current);

    savingTimer.current = setTimeout(() => {
      setSaveStatus("saving");
      savedTimer.current = setTimeout(() => setSaveStatus("saved"), 600);
    }, 900);

    return () => {
      if (savingTimer.current) clearTimeout(savingTimer.current);
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, [quiz]);

  const updateQuestions = useCallback(
    (updater: (questions: Question[]) => Question[]) => {
      setQuiz((prev) => ({
        ...prev,
        questions: updater(prev.questions),
        updatedAt: new Date().toISOString(),
      }));
    },
    []
  );

  const setTitle = useCallback((title: string) => {
    setQuiz((prev) => ({ ...prev, title, updatedAt: new Date().toISOString() }));
  }, []);

  const selectQuestion = useCallback((id: string) => {
    setSelectedQuestionId(id);
  }, []);

  const addQuestion = useCallback(
    (type: QuestionType) => {
      const newQuestion = createBlankQuestion(type, quiz.questions.length + 1);
      updateQuestions((questions) => [...questions, newQuestion]);
      setSelectedQuestionId(newQuestion.id);
      return newQuestion.id;
    },
    [quiz.questions.length, updateQuestions]
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

  const selectedQuestion = quiz.questions.find((q) => q.id === selectedQuestionId) ?? null;
  const hasIncompleteQuestions =
    quiz.questions.length === 0 || quiz.questions.some((q) => !q.isComplete);

  return {
    quiz,
    saveStatus,
    selectedQuestion,
    selectedQuestionId,
    hasIncompleteQuestions,
    setTitle,
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
