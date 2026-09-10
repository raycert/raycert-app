import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/layout/EmptyState";
import { AssessmentList } from "@/components/assessment/AssessmentList";
import { mockAssessments } from "@/mocks";

// This route reads the mutable `mockAssessments` singleton (Duplicate,
// Company Name + Duplicate addendum §7-16) — without this, Next.js
// prerenders it as a static page (no dynamic segment, no dynamic API calls),
// so a Duplicate's `router.refresh()` re-fetches a stale cached render
// instead of a fresh one reflecting the just-added assessment.
export const dynamic = "force-dynamic";

export default function AssessmentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-[32px] font-bold leading-10 text-heading">
            Assessments
          </h1>
          <p className="text-base text-muted-foreground">
            {mockAssessments.length} Post-test trong thư viện của bạn
          </p>
        </div>
        <Button asChild>
          <Link href="/assessments/new">+ Create Assessment</Link>
        </Button>
      </div>

      <Card>
        <CardContent>
          {mockAssessments.length === 0 ? (
            <EmptyState
              title="Chưa có Post-test nào"
              description="Tạo Post-test đầu tiên để bắt đầu."
              action={
                <Button asChild>
                  <Link href="/assessments/new">+ Create Assessment</Link>
                </Button>
              }
            />
          ) : (
            <AssessmentList assessments={mockAssessments} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
