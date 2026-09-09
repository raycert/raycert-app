import type { ParticipantQuestion } from "@/lib/game/participant-question";
import { HostProgress } from "./HostProgress";
import { HostTimer } from "./HostTimer";
import { HostResponseCounter } from "./HostResponseCounter";

/**
 * Host's projector view of the active question. Deliberately takes a
 * `ParticipantQuestion` (never the raw `Question`) — the same security
 * boundary as the participant's screen: no `isCorrect` reaches this
 * component even though the host hook technically holds it (§14).
 *
 * Options share `ParticipantAnswerOption`'s "default" token language
 * (surface/border/heading — same colors, same radius) at projector scale,
 * rather than reusing that component directly: it's built for an
 * interactive participant and dims itself when non-interactive, which is
 * the opposite of what a "make it readable from across the room" projector
 * view needs.
 */
export function HostQuestionView({
  question,
  questionNumber,
  totalQuestions,
  secondsLeft,
  responseCount,
  totalParticipants,
}: {
  question: ParticipantQuestion;
  questionNumber: number;
  totalQuestions: number;
  secondsLeft: number;
  responseCount: number;
  totalParticipants: number;
}) {
  return (
    <div className="flex flex-1 flex-col gap-8">
      <div className="flex items-center justify-between">
        <HostProgress current={questionNumber} total={totalQuestions} questionType={question.type} />
        <HostTimer secondsLeft={secondsLeft} />
      </div>

      <h1 className="font-heading text-center text-[32px] font-bold text-white lg:text-[40px]">
        {question.text}
      </h1>

      {question.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- local/mock URL
        <img
          src={question.imageUrl}
          alt={question.imageFileName ?? ""}
          className="mx-auto max-h-[30vh] w-auto rounded-lg object-contain"
        />
      ) : null}

      <div
        role="radiogroup"
        aria-label={question.text}
        className="mx-auto grid w-full max-w-4xl gap-3 sm:grid-cols-2"
      >
        {question.options.map((option) => (
          <div
            key={option.id}
            role="radio"
            aria-checked={false}
            aria-disabled="true"
            className="flex min-h-16 items-center gap-3 rounded-[10px] border-[1.5px] border-white/20 bg-white px-5 py-4 text-left text-heading"
          >
            <span className="shrink-0 text-lg font-bold">{option.label}.</span>
            <span className="flex-1 text-lg font-medium">{option.text}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <HostResponseCounter responded={responseCount} total={totalParticipants} />
      </div>
    </div>
  );
}
