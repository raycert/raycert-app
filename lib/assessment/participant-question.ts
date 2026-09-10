import type { Question } from "@/types";

/**
 * Participant-safe view of a Post-test Question — mirrors
 * `lib/game/participant-question.ts`'s security-boundary pattern for Live
 * Quiz: `isCorrect` is stripped at the type level, not just hidden in the
 * UI, so nothing the take-flow renders can ever read correctness before
 * Phase 9D's Result screen (this phase's §5/§6 — no correct/incorrect,
 * no earned points, no PASS/FAIL during the take flow). `order` here is the
 * question's position *within this attempt* (post-shuffle when
 * `randomizeQuestions` is on), not `Question.order` from the source
 * Assessment.
 */
export interface AssessmentParticipantOption {
  id: string;
  label: string;
  text: string;
}

export interface AssessmentParticipantQuestion {
  id: string;
  text: string;
  imageUrl?: string;
  imageFileName?: string;
  options: AssessmentParticipantOption[];
  points?: number; // informational ("worth 2 pts"), not a correctness leak
  order: number;
}

export function toAssessmentParticipantQuestion(
  question: Question,
  attemptOrder: number
): AssessmentParticipantQuestion {
  return {
    id: question.id,
    text: question.text,
    imageUrl: question.imageUrl,
    imageFileName: question.imageFileName,
    options: question.options.map(({ id, label, text }) => ({ id, label, text })),
    points: question.points,
    order: attemptOrder,
  };
}
