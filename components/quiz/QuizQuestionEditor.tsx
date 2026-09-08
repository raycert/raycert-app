"use client";

import { Trash2Icon } from "lucide-react";
import type { Question } from "@/types";
import { Textarea } from "@/components/ui/textarea";
import { QuestionImageUpload } from "@/components/media/QuestionImageUpload";
import { AnswerOptionEditor } from "./AnswerOptionEditor";
import { QuestionSettings } from "./QuestionSettings";
import { QuestionTypeBadge } from "./QuestionTypeBadge";
import { ValidationMessage } from "./ValidationMessage";

const MAX_OPTIONS = 4;

export function QuizQuestionEditor({
  question,
  order,
  validationMessages,
  onChangeText,
  onUploadImage,
  onRemoveImage,
  onAddOption,
  onRemoveOption,
  onChangeOptionText,
  onSetCorrect,
  onTimerChange,
  onPointsChange,
  onDelete,
}: {
  question: Question;
  order: number;
  validationMessages: string[];
  onChangeText: (text: string) => void;
  onUploadImage: (url: string, fileName: string) => void;
  onRemoveImage: () => void;
  onAddOption: () => void;
  onRemoveOption: (optionId: string) => void;
  onChangeOptionText: (optionId: string, text: string) => void;
  onSetCorrect: (optionId: string) => void;
  onTimerChange: (seconds: number) => void;
  onPointsChange: (points: number) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex max-w-[640px] flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QuestionTypeBadge type="QUIZ" />
          <span className="text-xs text-muted-foreground">Câu hỏi {order}</span>
        </div>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Xoá câu hỏi này"
          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-error-100 hover:text-error-600"
        >
          <Trash2Icon className="size-4" />
        </button>
      </div>

      <label>
        <span className="sr-only">Nội dung câu hỏi</span>
        <Textarea
          value={question.text}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder="Nhập câu hỏi…"
          className="min-h-14 text-sm font-semibold"
        />
      </label>

      <QuestionImageUpload
        imageUrl={question.imageUrl}
        onUploaded={onUploadImage}
        onRemove={onRemoveImage}
      />

      <div className="flex flex-col gap-2">
        {question.options.map((option) => (
          <AnswerOptionEditor
            key={option.id}
            option={option}
            questionId={question.id}
            showCorrectToggle
            onChangeText={(text) => onChangeOptionText(option.id, text)}
            onSetCorrect={() => onSetCorrect(option.id)}
            onRemove={() => onRemoveOption(option.id)}
            canRemove={question.options.length > 2}
          />
        ))}
        {question.options.length < MAX_OPTIONS ? (
          <button
            type="button"
            onClick={onAddOption}
            className="rounded-lg border-[1.5px] border-dashed border-border py-2.5 text-center text-[12.5px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            + Add option (tối đa {MAX_OPTIONS})
          </button>
        ) : null}
      </div>

      <QuestionSettings
        timerSeconds={question.timerSeconds}
        onTimerChange={onTimerChange}
        points={question.points}
        onPointsChange={onPointsChange}
      />

      <ValidationMessage messages={validationMessages} />
    </div>
  );
}
