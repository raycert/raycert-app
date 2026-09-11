import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AssessmentEditor } from "@/components/assessment/AssessmentEditor";
import { getAssessmentById } from "@/lib/data/assessments";

export const dynamic = "force-dynamic";

export default async function EditAssessmentPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  const assessment = await getAssessmentById(assessmentId);

  if (!assessment) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
        <h1 className="font-heading text-[24px] font-bold leading-8 text-heading">
          Không tìm thấy assessment
        </h1>
        <p className="max-w-md text-base text-muted-foreground">
          Assessment &quot;{assessmentId}&quot; không tồn tại, hoặc không thuộc về tài khoản của
          bạn.
        </p>
        <Button variant="secondary" asChild>
          <Link href="/assessments">← Quay lại Assessments</Link>
        </Button>
      </div>
    );
  }

  return <AssessmentEditor initialAssessment={assessment} />;
}
