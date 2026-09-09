import { AlertTriangleIcon } from "lucide-react";
import type { QuizQuestionAnalytics } from "@/mocks/reports";

/**
 * Mock rule (CLAUDE.md §13, Phase 8 spec): QUIZ questions with correct rate
 * < 70% are flagged for review. Never applies to POLL. No AI — a fixed
 * threshold computed in `mocks/reports.ts`.
 */
export function KnowledgeGapSection({ gaps }: { gaps: QuizQuestionAnalytics[] }) {
  return (
    <section aria-labelledby="knowledge-gap-heading" className="flex flex-col gap-2">
      <h2 id="knowledge-gap-heading" className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
        Knowledge Gaps · Câu hỏi cần xem lại
      </h2>
      {gaps.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border-strong px-4 py-4 text-[13px] text-muted-foreground">
          Không phát hiện knowledge gap nào (mọi câu QUIZ đều có tỉ lệ đúng ≥ 70%).
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {gaps.map((gap) => (
            <li
              key={gap.questionId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500 bg-amber-100 px-4 py-3"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
                <div>
                  <p className="text-[13.5px] font-semibold text-heading">
                    Câu {gap.order} · {gap.questionText}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    Tỉ lệ đúng {gap.correctPercent}% · {gap.responseCount - Math.round((gap.correctPercent / 100) * gap.responseCount)} phản hồi sai
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-amber-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                Nên ôn tập lại
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
