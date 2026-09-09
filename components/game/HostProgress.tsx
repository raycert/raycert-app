import type { QuestionType } from "@/types";
import { QuestionTypeBadge } from "@/components/quiz/QuestionTypeBadge";

export function HostProgress({
  current,
  total,
  questionType,
}: {
  current: number;
  total: number;
  questionType: QuestionType;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg font-semibold text-white/70">
        Câu {current}/{total}
      </span>
      <QuestionTypeBadge type={questionType} />
    </div>
  );
}
