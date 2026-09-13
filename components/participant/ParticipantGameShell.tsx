"use client";

import { CheckIcon } from "lucide-react";
import { toast } from "sonner";
import type { PollResult as PollResultData } from "@/types";
import { AvatarChip } from "./AvatarChip";
import { ParticipantQuestion } from "./ParticipantQuestion";
import { QuizResult } from "@/components/game/QuizResult";
import { PollResult, type PollResultRow } from "@/components/game/PollResult";
import { useParticipantGameplay } from "@/hooks/use-participant-gameplay";
import type { PlayState } from "@/app/play/[sessionId]/actions";

const SUBMIT_REJECTION_MESSAGE: Record<string, string> = {
  SESSION_NOT_FOUND: "Phiên tham gia không hợp lệ, vui lòng tham gia lại.",
  QUESTION_CHANGED: "Câu hỏi đã đóng hoặc đã chuyển sang câu khác.",
  QUESTION_EXPIRED: "Đã hết thời gian trả lời câu này.",
  ALREADY_ANSWERED: "Bạn đã trả lời câu này rồi.",
  INVALID_OPTION: "Lựa chọn không hợp lệ.",
  UNKNOWN_ERROR: "Không thể gửi câu trả lời. Vui lòng thử lại.",
};

function buildPollRows(
  result: PollResultData,
  question: { options: { id: string; label: string; text: string }[] }
): PollResultRow[] {
  return result.distribution.map((d) => {
    const option = question.options.find((o) => o.id === d.optionId);
    return {
      optionId: d.optionId,
      label: option?.label ?? "?",
      text: option?.text ?? "",
      count: d.count,
      percent: d.percent,
    };
  });
}

export function ParticipantGameShell({
  sessionId,
  initialState,
}: {
  sessionId: string;
  initialState: PlayState;
}) {
  const {
    phase,
    totalQuestions,
    participantCount,
    participantQuestion,
    secondsLeft,
    selectedOptionId,
    myResult,
    myScore,
    finalLeaderboard,
    myFinalRank,
    myParticipantId,
    submitting,
    selectOption,
    submitAnswer,
  } = useParticipantGameplay(sessionId, initialState);

  async function handleSubmit() {
    const result = await submitAnswer();
    if (!result.success) {
      toast.error(SUBMIT_REJECTION_MESSAGE[result.reason] ?? SUBMIT_REJECTION_MESSAGE.UNKNOWN_ERROR);
    }
  }

  if (phase === "WAITING") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
        <div className="flex flex-col items-center gap-1">
          <p className="text-xs leading-4 uppercase tracking-wide text-muted-foreground">
            {initialState.quizTitle}
          </p>
          <h1 className="font-heading text-[24px] font-bold leading-8 text-heading">
            Waiting Room
          </h1>
        </div>

        <div className="flex flex-col items-center gap-3">
          <AvatarChip nickname={initialState.myNickname} />
          <p className="text-lg font-semibold text-heading">{initialState.myNickname}</p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-100 px-3 py-1 text-[12.5px] font-semibold text-success-600">
            <CheckIcon className="size-3.5" />
            Đã tham gia
          </span>
        </div>

        <div aria-live="polite" className="flex flex-col items-center gap-3">
          <span className="flex size-3 rounded-full bg-primary" aria-hidden="true">
            <span className="size-full animate-ping rounded-full bg-primary" />
          </span>
          <p className="text-base text-muted-foreground">
            Đang chờ người hướng dẫn bắt đầu...
          </p>
        </div>

        <div className="flex flex-col items-center gap-1 text-[12.5px] text-muted-foreground">
          <p>{participantCount} người đã tham gia</p>
          <p className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-success-600" aria-hidden="true" />
            Đã kết nối
          </p>
        </div>
      </div>
    );
  }

  if (phase === "FINISHED") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3.5 px-6 text-center">
        <p className="text-[12.5px] text-muted-foreground">Bạn xếp thứ</p>
        <p className="font-heading text-[44px] font-extrabold leading-none text-primary">
          {myFinalRank !== null ? `#${myFinalRank}` : "—"}
        </p>
        <p className="text-[13.5px] text-body">
          Tổng điểm: <strong className="text-heading">{myScore.toLocaleString("vi-VN")}</strong>
        </p>
        {finalLeaderboard.length > 0 ? (
          <div className="mt-4 flex w-full max-w-xs flex-col gap-1.5">
            {finalLeaderboard.slice(0, 5).map((entry) => (
              <div
                key={entry.participantId}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                  entry.participantId === myParticipantId
                    ? "bg-primary/10 font-semibold text-primary"
                    : "bg-surface-subtle text-body"
                }`}
              >
                <span>
                  #{entry.rank} {entry.nickname}
                </span>
                <span>{entry.score.toLocaleString("vi-VN")}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (!participantQuestion) return null;

  if (phase === "QUESTION_ACTIVE" || phase === "ANSWER_SUBMITTED") {
    return (
      <ParticipantQuestion
        question={participantQuestion}
        questionNumber={participantQuestion.order}
        totalQuestions={totalQuestions}
        secondsLeft={secondsLeft}
        submitted={phase === "ANSWER_SUBMITTED" || submitting}
        selectedOptionId={selectedOptionId}
        onSelectOption={selectOption}
        onSubmit={handleSubmit}
      />
    );
  }

  if (phase === "QUESTION_RESULTS") {
    if (!myResult || !myResult.revealed) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <p className="text-base text-muted-foreground">Đang chờ kết quả…</p>
        </div>
      );
    }

    if (myResult.type === "QUIZ") {
      const correctOption = participantQuestion.options.find(
        (o) => o.id === myResult.result.correctOptionId
      );
      const selected = participantQuestion.options.find((o) => o.id === myResult.selectedOptionId);
      if (!correctOption) return null;
      return (
        <QuizResult
          isCorrect={myResult.selectedOptionId == null ? null : myResult.isCorrect}
          selectedOption={selected ? { label: selected.label, text: selected.text } : null}
          correctOption={{ label: correctOption.label, text: correctOption.text }}
          pointsAwarded={myResult.pointsAwarded}
          responseMs={myResult.responseMs ?? undefined}
          totalScore={myScore}
        />
      );
    }

    return (
      <PollResult
        rows={buildPollRows(myResult.result, participantQuestion)}
        selectedOptionId={myResult.selectedOptionId}
        totalVoters={myResult.result.responseCount}
      />
    );
  }

  return null;
}
