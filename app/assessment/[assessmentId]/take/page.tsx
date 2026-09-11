import { redirect } from "next/navigation";
import { AssessmentTakeShell } from "@/components/assessment/AssessmentTakeShell";
import { getAssessmentById } from "@/lib/data/assessments";

export const dynamic = "force-dynamic";

export default async function AssessmentTakePage({
  params,
  searchParams,
}: {
  params: Promise<{ assessmentId: string }>;
  searchParams: Promise<{ fullName?: string; department?: string }>;
}) {
  const { assessmentId } = await params;
  const { fullName, department } = await searchParams;

  const assessment = await getAssessmentById(assessmentId);
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

  // No student info in the URL (e.g. a bare /take visit) — this mock has no
  // server-side attempt persistence, so these params are the only signal
  // that Student Information was actually completed. Send them back.
  if (!fullName || !department) {
    redirect(`/assessment/${assessmentId}/start`);
  }

  return <AssessmentTakeShell assessment={assessment} fullName={fullName} department={department} />;
}
