"use client";

import type { PollResult as PollResultData, Question, QuestionResult } from "@/types";
import { useHostGameplay } from "@/hooks/use-host-gameplay";
import { HostQuestionView } from "./HostQuestionView";
import { HostQuizResults } from "./HostQuizResults";
import { HostPollResults } from "./HostPollResults";
import { HostGameControls } from "./HostGameControls";
import { HostLeaderboard } from "@/components/leaderboard/HostLeaderboard";
import { FinalLeaderboard } from "@/components/leaderboard/FinalLeaderboard";

function averageQuizCorrectRate(
  questions: Question[],
  questionResults: Record<string, QuestionResult | PollResultData>
): number | null {
  const rates = questions
    .filter((q) => q.type === "QUIZ")
    .map((q) => questionResults[q.id])
    .filter((r): r is QuestionResult => !!r && "correctRate" in r)
    .map((r) => r.correctRate);
  if (rates.length === 0) return null;
  return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
}

export function HostGameShell({
  sessionId,
  quiz,
  initialStatus,
  initialQuestionIndex,
  initialQuestionStartedAt,
  initialLeaderboard,
}: {
  sessionId: string;
  quiz: { title: string; questions: Question[] };
  initialStatus: "QUESTION_ACTIVE" | "QUESTION_RESULTS" | "FINISHED";
  initialQuestionIndex: number;
  initialQuestionStartedAt: string | null;
  initialLeaderboard: { participantId: string; nickname: string; score: number; rank: number }[];
}) {
  const {
    phase,
    questionIndex,
    totalQuestions,
    totalParticipants,
    question,
    participantQuestion,
    result,
    questionResults,
    secondsLeft,
    responseCount,
    leaderboard,
    transitioning,
    awaitingFinalAnswers,
    closeQuestion,
    advanceFromResults,
    nextQuestion,
    endGame,
  } = useHostGameplay({
    sessionId,
    quiz,
    initialStatus,
    initialQuestionIndex,
    initialQuestionStartedAt,
    initialLeaderboard,
  });

  const quizCount = quiz.questions.filter((q) => q.type === "QUIZ").length;
  const pollCount = quiz.questions.filter((q) => q.type === "POLL").length;

  if (phase === "FINISHED") {
    return (
      <FinalLeaderboard
        entries={leaderboard}
        totalParticipants={totalParticipants}
        quizCount={quizCount}
        pollCount={pollCount}
        avgCorrectRate={averageQuizCorrectRate(quiz.questions, questionResults)}
      />
    );
  }

  if (!question || !participantQuestion) return null;

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

      {phase === "QUESTION_RESULTS" && awaitingFinalAnswers ? (
        <p className="flex flex-1 items-center justify-center text-center text-white/70">
          Đang chờ các câu trả lời cuối cùng…
        </p>
      ) : null}

      {phase === "QUESTION_RESULTS" && !awaitingFinalAnswers && result ? (
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
        transitioning={transitioning}
        onCloseQuestion={closeQuestion}
        onAdvanceFromResults={advanceFromResults}
        onNextQuestion={nextQuestion}
        onEndGame={endGame}
      />
    </div>
  );
}
