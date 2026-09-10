import type { Assessment } from "@/types";
import { AssessmentEditor } from "@/components/assessment/AssessmentEditor";

export default function NewAssessmentPage() {
  const draft: Assessment = {
    id: crypto.randomUUID(),
    title: "",
    description: "",
    questions: [],
    settings: {
      minimumPassingPoints: 1,
      maxAttempts: 1,
      timeLimitMinutes: null,
      randomizeQuestions: false,
      randomizeAnswers: false,
      showCorrectAnswersAfterSubmit: true,
    },
    status: "inactive",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return <AssessmentEditor initialAssessment={draft} />;
}
