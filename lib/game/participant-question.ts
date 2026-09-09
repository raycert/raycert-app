import type { Question, QuestionType } from "@/types";

/**
 * Participant-safe view of a Question — used for the ACTIVE/SUBMITTED
 * phases, before a question closes. `isCorrect` is stripped at the type
 * level (not just hidden in the UI): a component typed against
 * `ParticipantAnswerOption[]` cannot read correctness even if it wanted to.
 * This mirrors what a real backend would do — the initial `question:started`
 * payload never carries `correctOptionId`/`isCorrect` (CLAUDE.md §5, §7) —
 * so swapping this mock for a real API later needs no UI rework.
 */
export interface ParticipantAnswerOption {
  id: string;
  label: string;
  text: string;
}

export interface ParticipantQuestion {
  id: string;
  type: QuestionType;
  text: string;
  imageUrl?: string;
  imageFileName?: string;
  options: ParticipantAnswerOption[];
  timerSeconds: number;
  points?: number; // QUIZ only — informational ("worth 1000 pts"), not a correctness leak
  order: number;
}

export function toParticipantQuestion(question: Question): ParticipantQuestion {
  return {
    id: question.id,
    type: question.type,
    text: question.text,
    imageUrl: question.imageUrl,
    imageFileName: question.imageFileName,
    options: question.options.map(({ id, label, text }) => ({ id, label, text })),
    timerSeconds: question.timerSeconds,
    points: question.points,
    order: question.order,
  };
}
