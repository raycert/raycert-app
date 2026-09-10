import type { Assessment } from "@/types";
import { AssessmentCard } from "./AssessmentCard";

export function AssessmentList({ assessments }: { assessments: Assessment[] }) {
  if (assessments.length === 0) {
    return (
      <p className="px-3.5 py-10 text-center text-sm text-muted-foreground">
        Không tìm thấy Post-test phù hợp.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {assessments.map((assessment) => (
        <AssessmentCard key={assessment.id} assessment={assessment} />
      ))}
    </div>
  );
}
