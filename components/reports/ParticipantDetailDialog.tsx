import { CheckIcon, XIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuestionTypeBadge } from "@/components/quiz/QuestionTypeBadge";
import { cn } from "@/lib/utils";
import { formatResponseSeconds } from "@/lib/format";
import type { ParticipantDetail } from "@/mocks/reports";

/**
 * Per-participant drill-down (Phase 8 §6) — QUIZ rows show selected answer +
 * correct/incorrect + points + response time; POLL rows show only the
 * selected option, no correctness, points always 0 (CLAUDE.md §2/§9).
 */
export function ParticipantDetailDialog({
  detail,
  open,
  onOpenChange,
}: {
  detail: ParticipantDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {detail ? (
          <>
            <DialogHeader>
              <DialogTitle>{detail.nickname}</DialogTitle>
              <DialogDescription>
                {detail.rank !== null ? `Xếp hạng #${detail.rank} · ` : ""}
                Tổng điểm: {detail.totalScore ?? "— (session không có QUIZ)"}
              </DialogDescription>
            </DialogHeader>
            <ul className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
              {detail.responses.map((response) => {
                const isUnanswered = response.selectedOptionLabel === null;
                return (
                  <li
                    key={response.questionId}
                    className="flex flex-col gap-1.5 rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12.5px] font-semibold text-muted-foreground">
                        Câu {response.order}
                      </span>
                      <QuestionTypeBadge type={response.type} size="sm" />
                    </div>
                    <p className="text-[13.5px] font-medium text-heading">{response.questionText}</p>

                    {isUnanswered ? (
                      <p className="text-[12.5px] text-muted-foreground">Không trả lời</p>
                    ) : (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]">
                        <span className="text-muted-foreground">
                          Đã chọn:{" "}
                          <span className="font-semibold text-heading">
                            {response.selectedOptionLabel}) {response.selectedOptionText}
                          </span>
                        </span>
                        {response.type === "QUIZ" ? (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 font-semibold",
                              response.isCorrect ? "text-success-600" : "text-error-600"
                            )}
                          >
                            {response.isCorrect ? (
                              <CheckIcon className="size-3.5" aria-hidden="true" />
                            ) : (
                              <XIcon className="size-3.5" aria-hidden="true" />
                            )}
                            {response.isCorrect ? "Đúng" : "Sai"} · {response.pointsAwarded ?? 0} điểm
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Không tính đúng/sai (POLL) · 0 điểm</span>
                        )}
                        {response.responseMs !== null ? (
                          <span className="text-muted-foreground">
                            {formatResponseSeconds(response.responseMs)}
                          </span>
                        ) : null}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
