import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AssessmentEditor } from "@/components/assessment/AssessmentEditor";
import { getAssessment } from "@/mocks";

export default async function EditAssessmentPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  const assessment = getAssessment(assessmentId);

  if (!assessment) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
        <h1 className="font-heading text-[24px] font-bold leading-8 text-heading">
          Không tìm thấy assessment
        </h1>
        <p className="max-w-md text-base text-muted-foreground">
          Không tìm thấy assessment &quot;{assessmentId}&quot; trong mock data.
        </p>
        <Button variant="secondary" asChild>
          <Link href="/assessments">← Quay lại Assessments</Link>
        </Button>
      </div>
    );
  }

  return <AssessmentEditor initialAssessment={assessment} />;
}
