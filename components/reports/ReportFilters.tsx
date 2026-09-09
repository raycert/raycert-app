"use client";

import { SearchInput } from "@/components/layout/SearchInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ReportMixFilter = "all" | "quiz-only" | "poll-only" | "mixed";

const MIX_FILTER_LABELS: Record<ReportMixFilter, string> = {
  all: "Tất cả",
  "quiz-only": "Chỉ QUIZ",
  "poll-only": "Chỉ POLL",
  mixed: "Kết hợp QUIZ + POLL",
};

/** Basic search + QUIZ/POLL mix filter for the Results list (Phase 8 §2). */
export function ReportFilters({
  search,
  onSearchChange,
  mixFilter,
  onMixFilterChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  mixFilter: ReportMixFilter;
  onMixFilterChange: (value: ReportMixFilter) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <SearchInput
        id="results-search"
        label="Search sessions"
        value={search}
        onChange={onSearchChange}
        placeholder="Tìm theo tên quiz…"
        className="w-full sm:w-64"
      />
      <Select value={mixFilter} onValueChange={(v) => onMixFilterChange(v as ReportMixFilter)}>
        <SelectTrigger aria-label="Lọc theo loại câu hỏi" className="w-full sm:w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(MIX_FILTER_LABELS) as ReportMixFilter[]).map((key) => (
            <SelectItem key={key} value={key}>
              {MIX_FILTER_LABELS[key]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
