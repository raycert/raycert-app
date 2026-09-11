import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/layout/EmptyState";
import { QuizLibrary } from "@/components/quiz/QuizLibrary";
import { listQuizzesForCurrentUser } from "@/lib/data/quizzes";

// Real per-trainer data now (Phase 10C) — force-dynamic so a Duplicate/Delete's
// router.refresh() (see QuizRow.tsx) always re-fetches a fresh render instead
// of a stale cached one (no dynamic segment on this route otherwise).
export const dynamic = "force-dynamic";

export default async function MyQuizzesPage() {
  const quizzes = await listQuizzesForCurrentUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-[32px] font-bold leading-10 text-heading">
          My Quizzes
        </h1>
        <p className="text-base text-muted-foreground">
          {quizzes.length} quiz trong thư viện của bạn
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4">
          {quizzes.length === 0 ? (
            <EmptyState
              title="Chưa có quiz nào"
              description="Tạo quiz đầu tiên để bắt đầu đào tạo."
              action={
                <Button asChild>
                  <Link href="/quizzes/new">+ Create Quiz</Link>
                </Button>
              }
            />
          ) : (
            <QuizLibrary quizzes={quizzes} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
