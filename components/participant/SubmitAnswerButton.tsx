"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SubmitAnswerButton({
  variant,
  disabled,
  loading,
  onClick,
}: {
  variant: "quiz" | "poll";
  disabled: boolean;
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="touch"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "w-full",
        variant === "poll" && !disabled && !loading && "bg-[#1c6e6e] hover:bg-[#1c6e6e]/90"
      )}
    >
      {loading ? "Đang gửi…" : "Gửi câu trả lời"}
    </Button>
  );
}
