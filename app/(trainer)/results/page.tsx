"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/layout/EmptyState";
import { ReportFilters, type ReportMixFilter } from "@/components/reports/ReportFilters";
import { CompletedSessionsTable } from "@/components/reports/CompletedSessionsTable";
import { mockCompletedSessions } from "@/mocks";

function matchesMixFilter(
  session: { quizCount: number; pollCount: number },
  filter: ReportMixFilter
): boolean {
  if (filter === "all") return true;
  if (filter === "quiz-only") return session.quizCount > 0 && session.pollCount === 0;
  if (filter === "poll-only") return session.pollCount > 0 && session.quizCount === 0;
  return session.quizCount > 0 && session.pollCount > 0; // mixed
}

export default function ResultsPage() {
  const [search, setSearch] = useState("");
  const [mixFilter, setMixFilter] = useState<ReportMixFilter>("all");

  const filteredSessions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return mockCompletedSessions.filter((session) => {
      const matchesSearch = !query || session.quizTitle.toLowerCase().includes(query);
      return matchesSearch && matchesMixFilter(session, mixFilter);
    });
  }, [search, mixFilter]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-[32px] font-bold leading-10 text-heading">
          Results Dashboard
        </h1>
        <p className="text-base text-muted-foreground">
          {mockCompletedSessions.length} session đã hoàn thành
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <ReportFilters
            search={search}
            onSearchChange={setSearch}
            mixFilter={mixFilter}
            onMixFilterChange={setMixFilter}
          />

          {mockCompletedSessions.length === 0 ? (
            <EmptyState title="Chưa host session nào" description="Kết quả sẽ hiển thị ở đây sau khi bạn host một session." />
          ) : filteredSessions.length === 0 ? (
            <EmptyState
              title="Không tìm thấy session phù hợp"
              description="Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc."
            />
          ) : (
            <CompletedSessionsTable sessions={filteredSessions} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
