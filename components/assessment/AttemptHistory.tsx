import type { AssessmentAttempt } from "@/types";
import { cn } from "@/lib/utils";
import { formatScorePercent } from "@/lib/format";

/** Local attempt history (Phase 9D §12) — not full trainer analytics, just
 * this learner's own past attempts in this browser tab
 * (`lib/assessment/attempt-store.ts`, sessionStorage). Renders nothing on a
 * first attempt (nothing to list yet). */
export function AttemptHistory({ attempts }: { attempts: AssessmentAttempt[] }) {
  if (attempts.length === 0) return null;

  const sorted = [...attempts].sort((a, b) => a.attemptNumber - b.attemptNumber);

  return (
    <div className="flex w-full flex-col gap-2">
      <h2 className="font-heading text-base font-bold text-heading">Lịch sử làm bài</h2>
      <div className="flex flex-col gap-1.5">
        {sorted.map((a) => (
          <div
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg border border-border px-3.5 py-2.5 text-[12.5px]"
          >
            <span className="font-semibold text-heading">Lần {a.attemptNumber}</span>
            <span className="text-muted-foreground">
              {a.earnedPoints} / {a.totalPoints} điểm
            </span>
            <span className="text-muted-foreground">{formatScorePercent(a.scorePercent)}</span>
            <span className={cn("font-semibold", a.passed ? "text-success-600" : "text-error-600")}>
              {a.passed ? "ĐẠT" : "KHÔNG ĐẠT"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
