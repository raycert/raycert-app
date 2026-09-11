"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Quiz } from "@/types";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/layout/SearchInput";
import { QuizList } from "./QuizList";

/** Client-side search/filter over the server-fetched quiz list (Phase 10C) —
 * split out of the page so the page itself can stay an async Server
 * Component that fetches real data. */
export function QuizLibrary({ quizzes }: { quizzes: Quiz[] }) {
  const [search, setSearch] = useState("");

  const filteredQuizzes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return quizzes;
    return quizzes.filter((quiz) => quiz.title.toLowerCase().includes(query));
  }, [search, quizzes]);

  return (
    <div className="flex flex-col gap-4">
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
      <QuizList quizzes={filteredQuizzes} />
    </div>
  );
}
