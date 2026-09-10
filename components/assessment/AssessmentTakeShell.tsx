"use client";

import { useState } from "react";
import type { Assessment } from "@/types";
import { Button } from "@/components/ui/button";
import { useAssessmentAttempt } from "@/hooks/use-assessment-attempt";
import { AssessmentProgress } from "./AssessmentProgress";
import { AssessmentCountdown } from "./AssessmentCountdown";
import { AssessmentNavigator } from "./AssessmentNavigator";
import { AssessmentQuestion } from "./AssessmentQuestion";
import { SubmitAssessmentDialog } from "./SubmitAssessmentDialog";

/** `/assessment/[assessmentId]/take` (Phase 9C §5) — self-paced, one overall
 * timer, freely revisitable questions. Owns `useAssessmentAttempt`. */
export function AssessmentTakeShell({
  assessment,
  fullName,
  department,
}: {
  assessment: Assessment;
  fullName: string;
  department: string;
}) {
  const {
    isReady,
    participantQuestions,
    currentIndex,
    currentQuestion,
    selectedOptionId,
    answeredQuestionIds,
    timer,
    answeredCount,
    totalQuestions,
    selectAnswer,
    goNext,
    goPrevious,
    jumpTo,
    submit,
  } = useAssessmentAttempt(assessment, fullName, department);

  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  if (!isReady || !currentQuestion) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
        Đang chuẩn bị bài làm…
      </div>
    );
  }

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalQuestions - 1;
  const answeredIndices = new Set(
    participantQuestions
      .map((q, i) => (answeredQuestionIds.has(q.id) ? i : null))
      .filter((i): i is number => i !== null)
  );

  return (
    <div className="flex flex-1 flex-col gap-3 px-4 pt-4 pb-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <AssessmentProgress
          current={currentIndex + 1}
          total={totalQuestions}
          points={currentQuestion.points}
        />
        <div className="flex items-center gap-3">
          <AssessmentCountdown timer={timer} mode="participant" />
          <Button type="button" variant="secondary" size="sm" onClick={() => setSubmitDialogOpen(true)}>
            Nộp bài
          </Button>
        </div>
      </div>

      <AssessmentNavigator
        total={totalQuestions}
        currentIndex={currentIndex}
        answeredIndices={answeredIndices}
        onJump={jumpTo}
      />

      <AssessmentQuestion
        question={currentQuestion}
        selectedOptionId={selectedOptionId}
        onSelectOption={selectAnswer}
      />

      <div className="sticky bottom-0 -mx-4 mt-auto flex items-center gap-2 border-t border-border bg-background px-4 py-3">
        <Button
          type="button"
          variant="outline"
          size="touch"
          className="flex-1"
          onClick={goPrevious}
          disabled={isFirst}
        >
          Previous
        </Button>
        <Button type="button" size="touch" className="flex-1" onClick={goNext} disabled={isLast}>
          Next
        </Button>
      </div>

      <SubmitAssessmentDialog
        open={submitDialogOpen}
        onOpenChange={setSubmitDialogOpen}
        totalQuestions={totalQuestions}
        answeredCount={answeredCount}
        onConfirmSubmit={() => {
          setSubmitDialogOpen(false);
          submit("MANUAL");
        }}
      />
    </div>
  );
}
