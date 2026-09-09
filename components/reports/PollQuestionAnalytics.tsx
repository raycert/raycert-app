import { QuestionAnalyticsCard } from "@/components/reports/QuestionAnalyticsCard";
import { ResponseDistribution } from "@/components/reports/ResponseDistribution";
import type { PollQuestionAnalytics as PollQuestionAnalyticsData } from "@/mocks/reports";

/** POLL question analytics — response count, option distribution/%, total
 * voters. Never shows correct/incorrect (CLAUDE.md §2, §13). */
export function PollQuestionAnalytics({ analytics }: { analytics: PollQuestionAnalyticsData }) {
  return (
    <QuestionAnalyticsCard order={analytics.order} type="POLL" questionText={analytics.questionText}>
      <p className="mb-3 text-[12.5px] text-muted-foreground">
        Tổng số người bình chọn:{" "}
        <span className="font-semibold text-heading">{analytics.totalVoters}</span>
      </p>
      <ResponseDistribution options={analytics.distribution} variant="poll" />
    </QuestionAnalyticsCard>
  );
}
