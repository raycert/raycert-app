import type { ReactNode } from "react";
import { AlertTriangleIcon } from "lucide-react";
import { QuestionTypeBadge } from "@/components/quiz/QuestionTypeBadge";
import type { QuestionType } from "@/types";

/** Shared shell for one question's analytics — header (order, type badge, text,
 * optional knowledge-gap flag) + type-specific body passed in as children. */
export function QuestionAnalyticsCard({
  order,
  type,
  questionText,
  isKnowledgeGap = false,
  children,
}: {
  order: number;
  type: QuestionType;
  questionText: string;
  isKnowledgeGap?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 text-[13px] font-semibold text-muted-foreground">Câu {order}</span>
          <p className="text-[14.5px] font-semibold text-heading">{questionText}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isKnowledgeGap ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
              <AlertTriangleIcon className="size-3" aria-hidden="true" />
              Knowledge gap
            </span>
          ) : null}
          <QuestionTypeBadge type={type} size="sm" />
        </div>
      </div>
      {children}
    </div>
  );
}
