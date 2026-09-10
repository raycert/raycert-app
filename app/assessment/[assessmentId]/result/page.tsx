import { AssessmentResult } from "@/components/assessment/AssessmentResult";
import { getAssessment } from "@/mocks";

/**
 * Landing point after Submit (Phase 9C §11/§16, real Result screen built
 * Phase 9D). The actual attempt (score, per-question review, history) lives
 * in `sessionStorage` (`lib/assessment/attempt-store.ts`) — a server
 * component can't read that, so this page only resolves `assessment` +
 * `attemptId` and hands both to the "use client" `AssessmentResult`.
 */
export default async function AssessmentResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ assessmentId: string }>;
  searchParams: Promise<{ attemptId?: string }>;
}) {
  const { assessmentId } = await params;
  const { attemptId } = await searchParams;

  const assessment = getAssessment(assessmentId);
  if (!assessment) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-heading text-[22px] font-bold text-heading">
          Không tìm thấy bài kiểm tra
        </h1>
        <p className="text-sm text-muted-foreground">
          Bài Post-test &quot;{assessmentId}&quot; không tồn tại hoặc đã bị gỡ.
        </p>
      </div>
    );
  }

  return <AssessmentResult assessment={assessment} attemptId={attemptId} />;
}
