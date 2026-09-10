import { AssessmentStart } from "@/components/assessment/AssessmentStart";
import { getAssessment } from "@/mocks";

export default async function AssessmentStartPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  const assessment = getAssessment(assessmentId);

  if (!assessment) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-heading text-[22px] font-bold text-heading">
          Không tìm thấy bài kiểm tra
        </h1>
        <p className="text-sm text-muted-foreground">
          Liên kết không hợp lệ hoặc bài Post-test &quot;{assessmentId}&quot; đã bị gỡ.
        </p>
      </div>
    );
  }

  if (assessment.status !== "active") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-heading text-[22px] font-bold text-heading">
          Bài kiểm tra chưa mở
        </h1>
        <p className="text-sm text-muted-foreground">
          &quot;{assessment.title}&quot; hiện đang tắt (Inactive). Vui lòng liên hệ người hướng
          dẫn.
        </p>
      </div>
    );
  }

  return <AssessmentStart assessment={assessment} />;
}
