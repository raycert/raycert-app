"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Quiz } from "@/types";
import { QuestionTypeBadge } from "./QuestionTypeBadge";

export function QuizPreviewDialog({
  open,
  onOpenChange,
  quiz,
  hasIncompleteQuestions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quiz: Quiz;
  hasIncompleteQuestions: boolean;
}) {
  const sorted = [...quiz.questions].sort((a, b) => a.order - b.order);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading">Preview — {quiz.title || "Untitled Quiz"}</DialogTitle>
        </DialogHeader>

        {hasIncompleteQuestions ? (
          <p className="rounded-lg bg-amber-100 px-3.5 py-2.5 text-[12.5px] text-amber-600">
            ⚠ Quiz còn câu hỏi chưa hoàn chỉnh — sẽ không host được cho đến khi hoàn tất.
          </p>
        ) : null}

        {sorted.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Chưa có câu hỏi nào trong quiz này.
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {sorted.map((question, index) => (
              <div key={question.id} className="flex flex-col gap-2.5 rounded-lg border border-border p-4">
                <div className="flex items-center gap-2">
                  <QuestionTypeBadge type={question.type} size="sm" />
                  <span className="text-xs text-muted-foreground">
                    Câu {index + 1} · {question.timerSeconds}s
                    {question.type === "QUIZ" ? ` · ${question.points} điểm` : ""}
                  </span>
                </div>
                <p className="text-sm font-semibold">
                  {question.text.trim() || "(chưa có nội dung câu hỏi)"}
                </p>
                {question.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local object/mock URL
                  <img
                    src={question.imageUrl}
                    alt=""
                    className="max-h-40 w-fit rounded-lg object-contain"
                  />
                ) : null}
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {question.options.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[12.5px]"
                    >
                      <span className="font-semibold text-muted-foreground">
                        {option.label}.
                      </span>
                      <span className="truncate">{option.text || "(trống)"}</span>
                      {question.type === "QUIZ" && option.isCorrect ? (
                        <span className="ml-auto shrink-0 text-[11px] font-bold text-success-600">
                          ✓
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
