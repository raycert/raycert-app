import { formatDate, formatResponseSeconds } from "@/lib/format";
import { ReportMetricCard } from "@/components/reports/ReportMetricCard";
import type { SessionReportOverview } from "@/mocks/reports";

/**
 * Session Report overview (High-Fidelity #25) — quiz/date/host header +
 * metric card grid. QUIZ-only metrics (score, correct rate, high/low,
 * response time) render "—" when the session has no QUIZ questions at all
 * (CLAUDE.md §13 — never blend POLL into these numbers).
 */
export function ReportSummary({ overview }: { overview: SessionReportOverview }) {
  const hasQuiz = overview.quizCount > 0;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-[24px] font-bold leading-8 text-heading">
          {overview.quizTitle}
        </h1>
        <p className="text-[13px] text-muted-foreground">
          {formatDate(overview.hostedAt)} · Host: {overview.hostName}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        <ReportMetricCard label="Participants" value={overview.totalParticipants} />
        <ReportMetricCard label="QUIZ" value={overview.quizCount} />
        <ReportMetricCard label="POLL" value={overview.pollCount} />
        <ReportMetricCard
          label="Avg score"
          value={hasQuiz ? (overview.averageScore ?? 0) : "—"}
          muted={!hasQuiz}
        />
        <ReportMetricCard
          label="Avg correct rate"
          value={hasQuiz ? `${overview.averageCorrectRate ?? 0}%` : "—"}
          muted={!hasQuiz}
        />
        <ReportMetricCard
          label="Avg response time"
          value={hasQuiz && overview.averageResponseMs !== null ? formatResponseSeconds(overview.averageResponseMs) : "—"}
          muted={!hasQuiz}
        />
      </div>

      {hasQuiz ? (
        <div className="grid grid-cols-2 gap-2.5 sm:w-1/2">
          <ReportMetricCard label="Highest score" value={overview.highestScore ?? "—"} />
          <ReportMetricCard label="Lowest score" value={overview.lowestScore ?? "—"} />
        </div>
      ) : null}
    </div>
  );
}
