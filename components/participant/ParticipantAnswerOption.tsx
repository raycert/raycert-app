import { CheckIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type CommonProps = {
  label: string;
  text: string;
  interactive: boolean;
  onSelect?: () => void;
};

type QuizProps = CommonProps & {
  variant: "quiz";
  state: "default" | "selected" | "correct" | "incorrect";
};

type PollProps = CommonProps & {
  // Type-level guard (docs/design/README.md §6): a POLL option can never be
  // told it's "correct"/"incorrect" — that state doesn't exist on this
  // variant's props at all, not just hidden in the UI.
  variant: "poll";
  state: "default" | "selected";
};

export type ParticipantAnswerOptionProps = QuizProps | PollProps;

export function ParticipantAnswerOption(props: ParticipantAnswerOptionProps) {
  const { label, text, interactive, onSelect, variant, state } = props;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={state === "selected" || state === "correct" || state === "incorrect"}
      disabled={!interactive}
      onClick={onSelect}
      className={cn(
        "flex min-h-14 w-full items-center gap-3 rounded-[10px] border-[1.5px] px-4 py-3.5 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        state === "default" && "border-border bg-surface text-heading",
        state === "selected" &&
          variant === "quiz" &&
          "border-2 border-primary bg-secondary text-primary",
        state === "selected" &&
          variant === "poll" &&
          "border-2 border-teal-500 bg-teal-100 text-[#1c6e6e]",
        state === "correct" && "border-success-600 bg-success-100 text-success-600",
        state === "incorrect" && "border-error-600 bg-error-100 text-error-600",
        !interactive && state === "default" && "opacity-60"
      )}
    >
      <span className="shrink-0 font-semibold">{label}.</span>
      <span className="flex-1">{text}</span>
      {state === "correct" ? <CheckIcon className="size-4 shrink-0" /> : null}
      {state === "incorrect" ? <XIcon className="size-4 shrink-0" /> : null}
    </button>
  );
}
