"use client";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import type { Question } from "@/types";
import { cn } from "@/lib/utils";
import { QuestionTypeBadge } from "./QuestionTypeBadge";

export function QuestionListItem({
  question,
  order,
  selected,
  onSelect,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: {
  question: Question;
  order: number;
  selected: boolean;
  onSelect: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const incomplete = !question.isComplete;

  return (
    <div
      className={cn(
        "group flex items-center gap-1 rounded-lg border px-2.5 py-2.5 text-[12.5px]",
        selected
          ? "border-2 border-primary bg-secondary"
          : incomplete
            ? "border-error-100 bg-error-100/40 text-error-600"
            : "border-border text-body"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? "true" : undefined}
        className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
      >
        <span className="truncate">
          {order} · {question.text.trim() || "Câu hỏi chưa có tiêu đề"}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {incomplete ? <span aria-label="Câu hỏi chưa hoàn chỉnh">⚠</span> : null}
          <QuestionTypeBadge type={question.type} size="sm" />
        </span>
      </button>

      <span className="hidden shrink-0 flex-col group-hover:flex">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!canMoveUp}
          aria-label="Di chuyển câu hỏi lên"
          className="rounded p-0.5 text-muted-foreground hover:bg-accent disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronUpIcon className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!canMoveDown}
          aria-label="Di chuyển câu hỏi xuống"
          className="rounded p-0.5 text-muted-foreground hover:bg-accent disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronDownIcon className="size-3.5" />
        </button>
      </span>
    </div>
  );
}
