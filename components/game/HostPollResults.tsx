import type { PollResult, Question } from "@/types";
import { ResultBar } from "./ResultBar";

export function HostPollResults({
  question,
  result,
}: {
  question: Question;
  result: PollResult;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-6">
      <h2 className="text-center text-2xl font-bold text-white">{question.text}</h2>

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
              variant="poll"
            />
          );
        })}
      </div>

      <p className="text-center text-sm text-white/60">
        Tổng lượt bình chọn: {result.responseCount}
      </p>
    </div>
  );
}
