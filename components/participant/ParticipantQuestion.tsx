import type { ParticipantQuestion as ParticipantQuestionData } from "@/lib/game/participant-question";
import { GameProgress } from "./GameProgress";
import { ParticipantTimer } from "./ParticipantTimer";
import { ParticipantAnswerOption } from "./ParticipantAnswerOption";
import { AnswerSubmittedState } from "./AnswerSubmittedState";
import { SubmitAnswerButton } from "./SubmitAnswerButton";

export function ParticipantQuestion({
  question,
  questionNumber,
  totalQuestions,
  secondsLeft,
  submitted,
  selectedOptionId,
  onSelectOption,
  onSubmit,
}: {
  question: ParticipantQuestionData;
  questionNumber: number;
  totalQuestions: number;
  secondsLeft: number;
  submitted: boolean;
  selectedOptionId: string | null;
  onSelectOption: (optionId: string) => void;
  onSubmit: () => void;
}) {
  const variant = question.type === "QUIZ" ? "quiz" : "poll";
  const selectedOption = question.options.find((o) => o.id === selectedOptionId) ?? null;
  const manyOptions = question.options.length >= 5;

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pt-4">
      <div className="flex items-center justify-between">
        <GameProgress current={questionNumber} total={totalQuestions} questionType={question.type} />
        <ParticipantTimer secondsLeft={secondsLeft} variant={variant} locked={submitted} />
      </div>

      {submitted ? (
        <AnswerSubmittedState variant={variant} selectedOption={selectedOption} />
      ) : (
        <>
          <h1 className="font-heading text-center text-[19px] font-bold text-heading">
            {question.text}
          </h1>

          {question.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- local/mock URL
            <img
              src={question.imageUrl}
              alt={question.imageFileName ?? ""}
              className="mx-auto max-h-50 w-auto rounded-lg object-contain"
            />
          ) : null}

          <div
            role="radiogroup"
            aria-label={question.text}
            className={
              manyOptions
                ? "flex max-h-72 flex-col gap-2 overflow-y-auto pr-0.5"
                : "flex flex-col gap-2"
            }
          >
            {question.options.map((option) => (
              <ParticipantAnswerOption
                key={option.id}
                variant={variant}
                label={option.label}
                text={option.text}
                interactive
                state={option.id === selectedOptionId ? "selected" : "default"}
                onSelect={() => onSelectOption(option.id)}
              />
            ))}
          </div>

          <div className="sticky bottom-0 -mx-4 mt-auto border-t border-border bg-background px-4 py-3">
            <SubmitAnswerButton
              variant={variant}
              disabled={!selectedOptionId}
              onClick={onSubmit}
            />
          </div>
        </>
      )}
    </div>
  );
}
