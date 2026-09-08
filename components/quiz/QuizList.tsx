import type { Quiz } from "@/types";
import { QuizListHeader, QuizRow } from "./QuizRow";

export function QuizList({ quizzes }: { quizzes: Quiz[] }) {
  if (quizzes.length === 0) {
    return (
      <p className="px-3.5 py-10 text-center text-sm text-muted-foreground">
        Không tìm thấy quiz phù hợp.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-180 flex-col gap-2">
        <QuizListHeader />
        {quizzes.map((quiz) => (
          <QuizRow key={quiz.id} quiz={quiz} />
        ))}
      </div>
    </div>
  );
}
