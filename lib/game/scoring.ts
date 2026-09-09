/**
 * CLIENT MOCK ONLY — illustrates the CLAUDE.md §10 scoring shape
 * (`basePoints + speed bonus 0–300`, correct only) for Phase 6 demo
 * purposes. Not authoritative: a real server must recompute this from its
 * own timer/submission timestamps, never trust a client-reported value.
 */
export function calculateMockQuizPoints(params: {
  isCorrect: boolean;
  basePoints: number;
  remainingMs: number;
  totalMs: number;
}): number {
  if (!params.isCorrect) return 0;
  const speedRatio = Math.max(0, Math.min(1, params.remainingMs / params.totalMs));
  const speedBonus = Math.round(speedRatio * 300);
  return params.basePoints + speedBonus;
}
