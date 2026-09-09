import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function AnswerSubmittedState({
  variant,
  selectedOption,
}: {
  variant: "quiz" | "poll";
  selectedOption: { label: string; text: string } | null;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
      <div
        className={cn(
          "flex size-10 items-center justify-center rounded-full",
          variant === "quiz" ? "bg-brand-100 text-primary" : "bg-teal-100 text-[#1c6e6e]"
        )}
      >
        <CheckIcon className="size-5" />
      </div>
      <p className="text-[15px] font-bold text-heading">
        {selectedOption ? "Đã gửi câu trả lời" : "Không có câu trả lời"}
      </p>
      {selectedOption ? (
        <span
          className={cn(
            "rounded-lg border-2 px-5 py-2.5 text-[13.5px] font-semibold",
            variant === "quiz" ? "border-primary text-primary" : "border-teal-500 text-[#1c6e6e]"
          )}
        >
          {selectedOption.label}. {selectedOption.text}
        </span>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Đang chờ người hướng dẫn kết thúc câu hỏi...
      </p>
    </div>
  );
}
