import type { Quiz } from "@/types";
import { QuizEditorPage } from "@/components/quiz/QuizEditorPage";

export default function NewQuizPage() {
  const draft: Quiz = {
    id: crypto.randomUUID(),
    title: "",
    questions: [],
    status: "draft",
    updatedAt: new Date().toISOString(),
  };

  return <QuizEditorPage initialQuiz={draft} />;
}
