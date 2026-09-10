/** Question summary row (Phase 9D §3/§20) — correct/incorrect/unanswered
 * counts, distinct from `AssessmentScoreCard`'s points/percent block. */
export function AssessmentResultSummary({
  correctCount,
  incorrectCount,
  unansweredCount,
}: {
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
}) {
  return (
    <div className="grid w-full grid-cols-3 gap-2 text-center">
      <div>
        <p className="font-heading text-lg font-bold text-success-600">{correctCount}</p>
        <p className="text-[11px] text-muted-foreground">Đúng</p>
      </div>
      <div>
        <p className="font-heading text-lg font-bold text-error-600">{incorrectCount}</p>
        <p className="text-[11px] text-muted-foreground">Sai</p>
      </div>
      <div>
        <p className="font-heading text-lg font-bold text-muted-foreground">{unansweredCount}</p>
        <p className="text-[11px] text-muted-foreground">Chưa trả lời</p>
      </div>
    </div>
  );
}
