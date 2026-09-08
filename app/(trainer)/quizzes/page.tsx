"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchInput } from "@/components/layout/SearchInput";
import { EmptyState } from "@/components/layout/EmptyState";
import { QuizList } from "@/components/quiz/QuizList";
import { mockQuizzes } from "@/mocks";

export default function MyQuizzesPage() {
  const [search, setSearch] = useState("");

  const filteredQuizzes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return mockQuizzes;
    return mockQuizzes.filter((quiz) => quiz.title.toLowerCase().includes(query));
  }, [search]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-[32px] font-bold leading-10 text-heading">
          My Quizzes
        </h1>
        <p className="text-base text-muted-foreground">
          {mockQuizzes.length} quiz trong thư viện của bạn
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SearchInput
              id="quiz-search"
              label="Search quizzes"
              value={search}
              onChange={setSearch}
              placeholder="Search quizzes…"
              className="w-full sm:w-60"
            />
            <Button asChild>
              <Link href="/quizzes/new">+ Create Quiz</Link>
            </Button>
          </div>

          {mockQuizzes.length === 0 ? (
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
            <QuizList quizzes={filteredQuizzes} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
