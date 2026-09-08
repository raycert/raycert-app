"use client";

import { XIcon } from "lucide-react";
import type { AnswerOption } from "@/types";
import { cn } from "@/lib/utils";

export function AnswerOptionEditor({
  option,
  questionId,
  showCorrectToggle,
  onChangeText,
  onSetCorrect,
  onRemove,
  canRemove,
}: {
  option: AnswerOption;
  questionId: string;
  showCorrectToggle: boolean;
  onChangeText: (text: string) => void;
  onSetCorrect?: () => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const isCorrect = !!option.isCorrect;

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-[13px]",
        showCorrectToggle && isCorrect
          ? "border-2 border-primary bg-[#f7faff]"
          : "border-[1.5px] border-border"
      )}
    >
      {showCorrectToggle ? (
        <label className="flex shrink-0 cursor-pointer items-center">
          <span className="sr-only">Đáp án đúng</span>
          <input
            type="radio"
            name={`correct-${questionId}`}
            checked={isCorrect}
            onChange={onSetCorrect}
            className="peer sr-only"
          />
          <span
            className={cn(
              "flex size-4.5 items-center justify-center rounded-full border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2",
              isCorrect ? "border-primary bg-primary" : "border-border-strong"
            )}
          />
        </label>
      ) : null}

      <span className="shrink-0 text-sm font-semibold text-muted-foreground">
        {option.label}.
      </span>

      <label className="flex-1">
        <span className="sr-only">Nội dung đáp án {option.label}</span>
        <input
          type="text"
          value={option.text}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder="Nhập đáp án…"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
        />
      </label>

      {showCorrectToggle && isCorrect ? (
        <span className="shrink-0 text-[11px] font-bold text-success-600">✓ correct</span>
      ) : null}

      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        aria-label={`Xoá đáp án ${option.label}`}
        className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
      >
        <XIcon className="size-3.5" />
      </button>
    </div>
  );
}
