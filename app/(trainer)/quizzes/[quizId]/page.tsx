import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QuizEditorPage } from "@/components/quiz/QuizEditorPage";
import { getQuizById } from "@/lib/data/quizzes";

export const dynamic = "force-dynamic";

export default async function EditQuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  const quiz = await getQuizById(quizId);

  if (!quiz) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
        <h1 className="font-heading text-[24px] font-bold leading-8 text-heading">
          Không tìm thấy quiz
        </h1>
        <p className="max-w-md text-base text-muted-foreground">
          Quiz &quot;{quizId}&quot; không tồn tại, hoặc không thuộc về tài khoản của bạn.
        </p>
        <Button variant="secondary" asChild>
          <Link href="/quizzes">← Quay lại My Quizzes</Link>
        </Button>
      </div>
    );
  }

  return <QuizEditorPage initialQuiz={quiz} />;
}
