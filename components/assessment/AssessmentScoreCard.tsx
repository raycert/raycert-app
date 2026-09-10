import { formatScorePercent } from "@/lib/format";

/** Score summary block (Phase 9D §3/§20): earned/total points, %, and the
 * passing threshold — three numbers side by side so "how close was I to the
 * threshold" reads at a glance. */
export function AssessmentScoreCard({
  earnedPoints,
  totalPoints,
  scorePercent,
  minimumPassingPoints,
}: {
  earnedPoints: number;
  totalPoints: number;
  scorePercent: number;
  minimumPassingPoints: number;
}) {
  return (
    <div className="grid w-full grid-cols-3 gap-2 rounded-lg bg-surface p-4 text-center">
      <div>
        <p className="font-heading text-lg font-extrabold text-heading">
          {earnedPoints} / {totalPoints}
        </p>
        <p className="text-[11px] text-muted-foreground">Điểm</p>
      </div>
      <div>
        <p className="font-heading text-lg font-extrabold text-heading">{formatScorePercent(scorePercent)}</p>
        <p className="text-[11px] text-muted-foreground">Tỷ lệ</p>
      </div>
      <div>
        <p className="font-heading text-lg font-extrabold text-heading">
          {minimumPassingPoints} / {totalPoints}
        </p>
        <p className="text-[11px] text-muted-foreground">Điểm tối thiểu để đạt</p>
      </div>
    </div>
  );
}
