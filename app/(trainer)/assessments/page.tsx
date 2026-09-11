import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/layout/EmptyState";
import { AssessmentList } from "@/components/assessment/AssessmentList";
import { listAssessmentsForCurrentUser } from "@/lib/data/assessments";

// Real per-trainer data now (Phase 10C) — force-dynamic so a Duplicate's
// router.refresh() (see AssessmentCard.tsx) always re-fetches a fresh
// render instead of a stale cached one (no dynamic segment on this route
// otherwise, so Next.js would happily prerender it once and reuse that).
export const dynamic = "force-dynamic";

export default async function AssessmentsPage() {
  const assessments = await listAssessmentsForCurrentUser();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-[32px] font-bold leading-10 text-heading">
            Assessments
          </h1>
          <p className="text-base text-muted-foreground">
            {assessments.length} Post-test trong thư viện của bạn
          </p>
        </div>
        <Button asChild>
          <Link href="/assessments/new">+ Create Assessment</Link>
        </Button>
      </div>

      <Card>
        <CardContent>
          {assessments.length === 0 ? (
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
            <AssessmentList assessments={assessments} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
