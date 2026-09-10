"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/** Submit confirmation (Phase 9C §15) — different copy/actions depending on
 * whether every question has an answer. */
export function SubmitAssessmentDialog({
  open,
  onOpenChange,
  totalQuestions,
  answeredCount,
  onConfirmSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalQuestions: number;
  answeredCount: number;
  onConfirmSubmit: () => void;
}) {
  const unansweredCount = totalQuestions - answeredCount;
  const isComplete = unansweredCount === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading">Nộp bài</DialogTitle>
          <DialogDescription>
            {isComplete
              ? `Bạn đã trả lời đủ ${totalQuestions}/${totalQuestions} câu. Bạn có chắc muốn nộp bài?`
              : `Bạn đã trả lời ${answeredCount}/${totalQuestions} câu. Còn ${unansweredCount} câu chưa trả lời.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {isComplete ? "Quay lại" : "Quay lại làm tiếp"}
          </Button>
          <Button type="button" onClick={onConfirmSubmit}>
            {isComplete ? "Nộp bài" : "Vẫn nộp bài"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
