import type { Question, QuestionType } from "@/types";
import { AddQuestionDialog } from "./AddQuestionDialog";
import { QuestionListItem } from "./QuestionListItem";

export function QuestionList({
  questions,
  selectedId,
  onSelect,
  onMoveUp,
  onMoveDown,
  onCreateQuestion,
}: {
  questions: Question[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onCreateQuestion: (type: QuestionType) => void;
}) {
  const sorted = [...questions].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col gap-2 p-4">
      {sorted.map((question, index) => (
        <QuestionListItem
          key={question.id}
          question={question}
          order={index + 1}
          selected={question.id === selectedId}
          onSelect={() => onSelect(question.id)}
          canMoveUp={index > 0}
          canMoveDown={index < sorted.length - 1}
          onMoveUp={() => onMoveUp(question.id)}
          onMoveDown={() => onMoveDown(question.id)}
        />
      ))}
      <AddQuestionDialog onCreateQuestion={onCreateQuestion} />
    </div>
  );
}
