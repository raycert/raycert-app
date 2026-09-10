"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QuestionTypeBadge } from "@/components/quiz/QuestionTypeBadge";
import type { Assessment } from "@/types";
import { getEquivalentPassRate, getTotalPoints } from "@/lib/validation/assessment";

/** Trainer-facing preview (mirrors QuizPreviewDialog) — correct answers are
 * shown because this is an authoring view, not the participant take-flow
 * (deferred to Phase 9B). */
export function AssessmentPreviewDialog({
  open,
  onOpenChange,
  assessment,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessment: Assessment;
}) {
  const sorted = [...assessment.questions].sort((a, b) => a.order - b.order);
  const totalPoints = getTotalPoints(assessment.questions);
  const passRate = getEquivalentPassRate(assessment.settings.minimumPassingPoints, totalPoints);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading">
            Preview — {assessment.title || "Untitled Post-test"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-x-5 gap-y-1 rounded-lg bg-surface px-4 py-3 text-[12.5px] text-muted-foreground">
          <span>
            Điểm đạt:{" "}
            <span className="font-semibold text-heading">
              {assessment.settings.minimumPassingPoints}/{totalPoints}
            </span>{" "}
            ({passRate !== null ? `${passRate}%` : "—"})
          </span>
          <span>
            Attempts:{" "}
            <span className="font-semibold text-heading">{assessment.settings.maxAttempts}</span>
          </span>
          <span>
            Time limit:{" "}
            <span className="font-semibold text-heading">
              {assessment.settings.timeLimitMinutes !== null
                ? `${assessment.settings.timeLimitMinutes} phút`
                : "Không giới hạn"}
            </span>
          </span>
        </div>

        {sorted.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Chưa có câu hỏi nào trong Post-test này.
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {sorted.map((question, index) => (
              <div key={question.id} className="flex flex-col gap-2.5 rounded-lg border border-border p-4">
                <div className="flex items-center gap-2">
                  <QuestionTypeBadge type={question.type} size="sm" />
                  <span className="text-xs text-muted-foreground">
                    Câu {index + 1}
                    {question.type === "QUIZ" ? ` · ${question.points} điểm` : " · không tính điểm"}
                  </span>
                </div>
                <p className="text-sm font-semibold">
                  {question.text.trim() || "(chưa có nội dung câu hỏi)"}
                </p>
                {question.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local object/mock URL
                  <img
                    src={question.imageUrl}
                    alt={question.imageFileName ?? ""}
                    className="max-h-40 w-fit rounded-lg object-contain"
                  />
                ) : null}
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {question.options.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[12.5px]"
                    >
                      <span className="font-semibold text-muted-foreground">{option.label}.</span>
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
