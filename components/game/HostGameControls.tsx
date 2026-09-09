import type { HostGamePhase } from "@/hooks/use-host-gameplay";
import type { QuestionType } from "@/types";
import { Button } from "@/components/ui/button";

export function HostGameControls({
  phase,
  questionType,
  onCloseQuestion,
  onAdvanceFromResults,
  onNextQuestion,
  onEndGame,
}: {
  phase: HostGamePhase;
  questionType: QuestionType;
  onCloseQuestion: () => void;
  onAdvanceFromResults: () => void;
  onNextQuestion: () => void;
  onEndGame: () => void;
}) {
  if (phase === "QUESTION_ACTIVE") {
    return (
      <div className="flex justify-center gap-3">
        <Button
          variant="outline"
          className="border-white/30 bg-transparent text-white hover:bg-white/10"
          onClick={onEndGame}
        >
          End Game
        </Button>
        <Button className="bg-white text-primary hover:bg-white/90" onClick={onCloseQuestion}>
          {questionType === "QUIZ" ? "Close Question" : "Close Poll"}
        </Button>
      </div>
    );
  }

  if (phase === "QUESTION_RESULTS") {
    return (
      <div className="flex justify-center">
        <Button className="bg-white text-primary hover:bg-white/90" onClick={onAdvanceFromResults}>
          {questionType === "QUIZ" ? "Leaderboard" : "Next Question"}
        </Button>
      </div>
    );
  }

  if (phase === "LEADERBOARD") {
    return (
      <div className="flex justify-center">
        <Button className="bg-white text-primary hover:bg-white/90" onClick={onNextQuestion}>
          Next Question
        </Button>
      </div>
    );
  }

  return null;
}
