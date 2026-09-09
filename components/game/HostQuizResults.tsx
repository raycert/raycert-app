import type { Question, QuestionResult } from "@/types";
import { ResultBar } from "./ResultBar";

export function HostQuizResults({
  question,
  result,
  totalParticipants,
}: {
  question: Question;
  result: QuestionResult;
  totalParticipants: number;
}) {
  const correctOption = question.options.find((o) => o.id === result.correctOptionId);
  const unanswered = Math.max(0, totalParticipants - result.responseCount);

  return (
    <div className="flex flex-1 flex-col justify-center gap-6">
      <h2 className="text-center text-2xl font-bold text-white">{question.text}</h2>

      {correctOption ? (
        <p className="text-center text-lg text-white/90">
          Đáp án đúng:{" "}
          <strong className="text-success-600">
            {correctOption.label}. {correctOption.text}
          </strong>
        </p>
      ) : null}

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
        {result.distribution.map((d) => {
          const option = question.options.find((o) => o.id === d.optionId);
          return (
            <ResultBar
              key={d.optionId}
              label={option?.label ?? "?"}
              text={option?.text ?? ""}
              percent={d.percent}
              count={d.count}
              variant={d.optionId === result.correctOptionId ? "quiz-correct" : "quiz-other"}
            />
          );
        })}
      </div>

      <p className="text-center text-sm text-white/60">
        Tổng phản hồi: {result.responseCount}
        {unanswered > 0 ? ` · Chưa trả lời: ${unanswered}` : ""}
        {" · "}Tỉ lệ đúng: {result.correctRate}%
      </p>
    </div>
  );
}
