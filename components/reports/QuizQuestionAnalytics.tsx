import { formatResponseSeconds } from "@/lib/format";
import { QuestionAnalyticsCard } from "@/components/reports/QuestionAnalyticsCard";
import { ResponseDistribution } from "@/components/reports/ResponseDistribution";
import type { QuizQuestionAnalytics as QuizQuestionAnalyticsData } from "@/mocks/reports";

/** QUIZ question analytics — correct answer, response/unanswered counts,
 * correct/incorrect %, option distribution, avg response time (CLAUDE.md §13). */
export function QuizQuestionAnalytics({ analytics }: { analytics: QuizQuestionAnalyticsData }) {
  return (
    <QuestionAnalyticsCard
      order={analytics.order}
      type="QUIZ"
      questionText={analytics.questionText}
      isKnowledgeGap={analytics.isKnowledgeGap}
    >
      <dl className="mb-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[12.5px] sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Đúng</dt>
          <dd className="font-semibold text-success-600">{analytics.correctPercent}%</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Sai</dt>
          <dd className="font-semibold text-error-600">{analytics.incorrectPercent}%</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Đã trả lời</dt>
          <dd className="font-semibold text-heading">{analytics.responseCount}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Không trả lời</dt>
          <dd className="font-semibold text-heading">{analytics.unansweredCount}</dd>
        </div>
      </dl>
      <ResponseDistribution options={analytics.distribution} variant="quiz" />
      <p className="mt-3 text-[12px] text-muted-foreground">
        Thời gian phản hồi trung bình:{" "}
        <span className="font-semibold text-heading">
          {formatResponseSeconds(analytics.averageResponseMs)}
        </span>
      </p>
    </QuestionAnalyticsCard>
  );
}
