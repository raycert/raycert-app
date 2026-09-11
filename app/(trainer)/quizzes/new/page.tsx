import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createBlankQuiz } from "@/lib/data/quizzes";

export default async function NewQuizPage() {
  const result = await createBlankQuiz();

  if ("error" in result) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
        <h1 className="font-heading text-[24px] font-bold leading-8 text-heading">
          Không thể tạo Quiz mới
        </h1>
        <p className="max-w-md text-base text-muted-foreground">{result.error}</p>
        <Button variant="secondary" asChild>
          <Link href="/quizzes">← Quay lại My Quizzes</Link>
        </Button>
      </div>
    );
  }

  redirect(`/quizzes/${result.id}`);
}
