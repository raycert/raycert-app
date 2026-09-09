"use client";

import { useEffect } from "react";
import { CheckIcon } from "lucide-react";
import type { PollResult as PollResultData, QuestionResult } from "@/types";
import { AvatarChip } from "./AvatarChip";
import { ParticipantQuestion } from "./ParticipantQuestion";
import { QuizResult } from "@/components/game/QuizResult";
import { PollResult, type PollResultRow } from "@/components/game/PollResult";
import { ParticipantLeaderboard } from "@/components/leaderboard/ParticipantLeaderboard";
import { useParticipantGameplay } from "@/hooks/use-participant-gameplay";

// Mock-only pacing: no real host, so the Waiting Room auto-starts after a
// short delay instead of giving the participant a start control (they never
// self-start — CLAUDE.md §3, §11).
const AUTO_START_DELAY_MS = 3000;

function buildPollRows(result: PollResultData, question: { options: { id: string; label: string; text: string }[] }): PollResultRow[] {
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
  nickname,
  quizTitle,
  participantCount,
}: {
  nickname: string;
  quizTitle: string;
  participantCount: number;
}) {
  const {
    phase,
    questionIndex,
    totalQuestions,
    participantQuestion,
    secondsLeft,
    selectedOptionId,
    currentResult,
    currentAnswer,
    myScore,
    leaderboard,
    startGame,
    selectOption,
    submitAnswer,
  } = useParticipantGameplay(nickname);

  useEffect(() => {
    if (phase !== "WAITING") return;
    const timeout = setTimeout(startGame, AUTO_START_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [phase, startGame]);

  if (phase === "WAITING") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
        <div className="flex flex-col items-center gap-1">
          <p className="text-xs leading-4 uppercase tracking-wide text-muted-foreground">
            {quizTitle}
          </p>
          <h1 className="font-heading text-[24px] font-bold leading-8 text-heading">
            Waiting Room
          </h1>
        </div>

        <div className="flex flex-col items-center gap-3">
          <AvatarChip nickname={nickname} />
          <p className="text-lg font-semibold text-heading">{nickname}</p>
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
    const finalRank = leaderboard.myRank;
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3.5 px-6 text-center">
        <p className="text-[12.5px] text-muted-foreground">Bạn xếp thứ</p>
        <p className="font-heading text-[44px] font-extrabold leading-none text-primary">
          #{finalRank}
        </p>
        <p className="text-[13.5px] text-body">
          Tổng điểm: <strong className="text-heading">{myScore.toLocaleString("vi-VN")}</strong>
        </p>
      </div>
    );
  }

  if (!participantQuestion) return null;

  if (phase === "QUESTION_ACTIVE" || phase === "ANSWER_SUBMITTED") {
    return (
      <ParticipantQuestion
        question={participantQuestion}
        questionNumber={questionIndex + 1}
        totalQuestions={totalQuestions}
        secondsLeft={secondsLeft}
        submitted={phase === "ANSWER_SUBMITTED"}
        selectedOptionId={selectedOptionId}
        onSelectOption={selectOption}
        onSubmit={submitAnswer}
      />
    );
  }

  if (phase === "QUESTION_RESULTS" && currentResult) {
    if (participantQuestion.type === "QUIZ") {
      const result = currentResult as QuestionResult;
      const correctOption = participantQuestion.options.find(
        (o) => o.id === result.correctOptionId
      )!;
      const selected = participantQuestion.options.find(
        (o) => o.id === currentAnswer?.optionId
      );
      return (
        <QuizResult
          isCorrect={currentAnswer?.optionId == null ? null : (currentAnswer?.isCorrect ?? false)}
          selectedOption={selected ? { label: selected.label, text: selected.text } : null}
          correctOption={{ label: correctOption.label, text: correctOption.text }}
          pointsAwarded={currentAnswer?.pointsAwarded ?? 0}
          responseMs={currentAnswer?.responseMs}
          totalScore={myScore}
        />
      );
    }

    return (
      <PollResult
        rows={buildPollRows(currentResult as PollResultData, participantQuestion)}
        selectedOptionId={currentAnswer?.optionId ?? null}
        totalVoters={currentResult.responseCount}
      />
    );
  }

  if (phase === "LEADERBOARD") {
    return <ParticipantLeaderboard entries={leaderboard.entries} myRank={leaderboard.myRank} />;
  }

  return null;
}
