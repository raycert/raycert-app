import type { HostGamePhase } from "@/hooks/use-host-gameplay";
import type { QuestionType } from "@/types";
import { Button } from "@/components/ui/button";

export function HostGameControls({
  phase,
  questionType,
  transitioning,
  onCloseQuestion,
  onAdvanceFromResults,
  onNextQuestion,
  onEndGame,
}: {
  phase: HostGamePhase;
  questionType: QuestionType;
  /** True only while a Close/Next/End transition's server round-trip is in
   * flight (§9) — never disabled for any other reason (timer, response
   * count, participant count). */
  transitioning: boolean;
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
          disabled={transitioning}
        >
          End Game
        </Button>
        <Button
          className="bg-white text-primary hover:bg-white/90"
          onClick={onCloseQuestion}
          disabled={transitioning}
        >
          {transitioning ? "Đang xử lý…" : questionType === "QUIZ" ? "Close Question" : "Close Poll"}
        </Button>
      </div>
    );
  }

  if (phase === "QUESTION_RESULTS") {
    return (
      <div className="flex justify-center">
        <Button
          className="bg-white text-primary hover:bg-white/90"
          onClick={onAdvanceFromResults}
          disabled={transitioning}
        >
          {transitioning ? "Đang xử lý…" : questionType === "QUIZ" ? "Leaderboard" : "Next Question"}
        </Button>
      </div>
    );
  }

  if (phase === "LEADERBOARD") {
    return (
      <div className="flex justify-center">
        <Button
          className="bg-white text-primary hover:bg-white/90"
          onClick={onNextQuestion}
          disabled={transitioning}
        >
          {transitioning ? "Đang xử lý…" : "Next Question"}
        </Button>
      </div>
    );
  }

  return null;
}
