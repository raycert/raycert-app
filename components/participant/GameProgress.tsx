import type { QuestionType } from "@/types";
import { QuestionTypeBadge } from "@/components/quiz/QuestionTypeBadge";

export function GameProgress({
  current,
  total,
  questionType,
}: {
  current: number;
  total: number;
  questionType: QuestionType;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>
        Câu {current}/{total}
      </span>
      {questionType === "POLL" ? <QuestionTypeBadge type="POLL" size="sm" /> : null}
    </div>
  );
}
