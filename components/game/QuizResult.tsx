import { CheckIcon, MinusIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuizResult({
  isCorrect,
  selectedOption,
  correctOption,
  pointsAwarded,
  responseMs,
  totalScore,
}: {
  /** null = timed out with no answer — never styled as incorrect. */
  isCorrect: boolean | null;
  selectedOption: { label: string; text: string } | null;
  correctOption: { label: string; text: string };
  pointsAwarded: number;
  responseMs?: number;
  totalScore: number;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3.5 px-6 text-center">
      <div
        className={cn(
          "flex size-13 items-center justify-center rounded-full",
          isCorrect === true
            ? "bg-success-100 text-success-600"
            : isCorrect === false
              ? "bg-error-100 text-error-600"
              : "bg-muted text-muted-foreground"
        )}
      >
        {isCorrect === true ? (
          <CheckIcon className="size-6" />
        ) : isCorrect === false ? (
          <XIcon className="size-6" />
        ) : (
          <MinusIcon className="size-6" />
        )}
      </div>

      <p
        className={cn(
          "text-[17px] font-bold",
          isCorrect === true
            ? "text-success-600"
            : isCorrect === false
              ? "text-error-600"
              : "text-muted-foreground"
        )}
      >
        {isCorrect === true ? "Đúng!" : isCorrect === false ? "Sai" : "Không có câu trả lời"}
      </p>

      {selectedOption ? (
        <p className="text-[13px] text-body">
          Bạn đã chọn: <strong className="text-heading">{selectedOption.label}. {selectedOption.text}</strong>
        </p>
      ) : null}

      {isCorrect !== true ? (
        <p className="text-[13px] text-body">
          Đáp án đúng: <strong className="text-success-600">{correctOption.label}. {correctOption.text}</strong>
        </p>
      ) : null}

      <p className="text-[13px] text-body">
        {pointsAwarded > 0 ? `+${pointsAwarded.toLocaleString("vi-VN")} điểm` : "+0 điểm"}
        {responseMs !== undefined ? ` · ${(responseMs / 1000).toFixed(1)}s` : ""}
      </p>

      <div className="w-full border-t border-border pt-3 text-[13px] text-body">
        Tổng điểm: <strong className="text-heading">{totalScore.toLocaleString("vi-VN")}</strong>
      </div>

      <p className="text-[11.5px] text-muted-foreground">Đang chờ câu tiếp theo…</p>
    </div>
  );
}
