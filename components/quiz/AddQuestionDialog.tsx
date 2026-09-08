"use client";

import { useState } from "react";
import type { QuestionType } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function QuestionTypeCard({
  title,
  description,
  variant,
  onClick,
}: {
  title: string;
  description: string;
  variant: "brand" | "neutral";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-lg border-2 px-5.5 py-5.5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        variant === "brand"
          ? "border-primary bg-secondary hover:bg-secondary/80"
          : "border-border hover:border-primary/50"
      )}
    >
      <p
        className={cn(
          "text-sm font-bold",
          variant === "brand" ? "text-primary" : "text-heading"
        )}
      >
        {title}
      </p>
      <p
        className={cn(
          "mt-1.5 text-[11.5px]",
          variant === "brand" ? "text-brand-500" : "text-muted-foreground"
        )}
      >
        {description}
      </p>
    </button>
  );
}

export function AddQuestionDialog({
  onCreateQuestion,
}: {
  onCreateQuestion: (type: QuestionType) => void;
}) {
  const [open, setOpen] = useState(false);

  function handleSelect(type: QuestionType) {
    onCreateQuestion(type);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="mt-1 rounded-lg border-[1.5px] border-dashed border-border py-3 text-center text-[12.5px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          + Add Question
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-heading">Thêm câu hỏi</DialogTitle>
        </DialogHeader>
        <div className="flex gap-3.5">
          <QuestionTypeCard
            title="Trắc nghiệm"
            description="Có đáp án đúng, có điểm, leaderboard"
            variant="brand"
            onClick={() => handleSelect("QUIZ")}
          />
          <QuestionTypeCard
            title="Bình chọn"
            description="Không đáp án đúng, chỉ distribution"
            variant="neutral"
            onClick={() => handleSelect("POLL")}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
