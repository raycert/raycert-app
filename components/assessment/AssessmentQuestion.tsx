import type { AssessmentParticipantQuestion } from "@/lib/assessment/participant-question";
import { AssessmentAnswerOption } from "./AssessmentAnswerOption";

/** Question text → Image → Answer options (Phase 9C §14). No correct answer,
 * no correct/incorrect, no points-earned ever rendered here. */
export function AssessmentQuestion({
  question,
  selectedOptionId,
  onSelectOption,
}: {
  question: AssessmentParticipantQuestion;
  selectedOptionId: string | null;
  onSelectOption: (optionId: string) => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
      <h2 className="font-heading text-[18px] font-bold text-heading">{question.text}</h2>

      {question.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- local/mock URL
        <img
          src={question.imageUrl}
          alt={question.imageFileName ?? ""}
          className="mx-auto max-h-56 w-auto rounded-lg object-contain"
        />
      ) : null}

      <div role="radiogroup" aria-label={question.text} className="flex flex-col gap-2">
        {question.options.map((option) => (
          <AssessmentAnswerOption
            key={option.id}
            label={option.label}
            text={option.text}
            state={option.id === selectedOptionId ? "selected" : "default"}
            onSelect={() => onSelectOption(option.id)}
          />
        ))}
      </div>
    </div>
  );
}
