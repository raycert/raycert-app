"use client";

import type { PollResult as PollResultData, QuestionResult } from "@/types";
import { useHostGameplay } from "@/hooks/use-host-gameplay";
import { getGameplayResult, mockGameplayQuestions } from "@/mocks/gameplay";
import { HostQuestionView } from "./HostQuestionView";
import { HostQuizResults } from "./HostQuizResults";
import { HostPollResults } from "./HostPollResults";
import { HostGameControls } from "./HostGameControls";
import { HostLeaderboard } from "@/components/leaderboard/HostLeaderboard";
import { FinalLeaderboard } from "@/components/leaderboard/FinalLeaderboard";
import { HostDevMockControls } from "@/components/dev/HostDevMockControls";

const quizCount = mockGameplayQuestions.filter((q) => q.type === "QUIZ").length;
const pollCount = mockGameplayQuestions.filter((q) => q.type === "POLL").length;

function averageQuizCorrectRate(): number | null {
  const rates = mockGameplayQuestions
    .filter((q) => q.type === "QUIZ")
    .map((q) => (getGameplayResult(q.id) as QuestionResult | undefined)?.correctRate)
    .filter((v): v is number => typeof v === "number");
  if (rates.length === 0) return null;
  return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
}

export function HostGameShell() {
  const {
    phase,
    questionIndex,
    totalQuestions,
    totalParticipants,
    question,
    participantQuestion,
    result,
    secondsLeft,
    responseCount,
    leaderboard,
    closeQuestion,
    advanceFromResults,
    nextQuestion,
    endGame,
    devBumpResponseCount,
  } = useHostGameplay();

  if (phase === "FINISHED") {
    return (
      <FinalLeaderboard
        entries={leaderboard}
        totalParticipants={totalParticipants}
        quizCount={quizCount}
        pollCount={pollCount}
        avgCorrectRate={averageQuizCorrectRate()}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8">
      {phase === "QUESTION_ACTIVE" ? (
        <HostQuestionView
          question={participantQuestion}
          questionNumber={questionIndex + 1}
          totalQuestions={totalQuestions}
          secondsLeft={secondsLeft}
          responseCount={responseCount}
          totalParticipants={totalParticipants}
        />
      ) : null}

      {phase === "QUESTION_RESULTS" && result ? (
        question.type === "QUIZ" ? (
          <HostQuizResults
            question={question}
            result={result as QuestionResult}
            totalParticipants={totalParticipants}
          />
        ) : (
          <HostPollResults question={question} result={result as PollResultData} />
        )
      ) : null}

      {phase === "LEADERBOARD" ? <HostLeaderboard entries={leaderboard} /> : null}

      <HostGameControls
        phase={phase}
        questionType={question.type}
        onCloseQuestion={closeQuestion}
        onAdvanceFromResults={advanceFromResults}
        onNextQuestion={nextQuestion}
        onEndGame={endGame}
      />

      {phase === "QUESTION_ACTIVE" ? (
        <HostDevMockControls onBumpResponseCount={devBumpResponseCount} />
      ) : null}
    </div>
  );
}
