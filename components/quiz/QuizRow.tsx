"use client";

import Link from "next/link";
import { MoreHorizontalIcon } from "lucide-react";
import { toast } from "sonner";
import type { Quiz } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime } from "@/lib/format";
import { QuizStatusBadge } from "./QuizStatusBadge";

const GRID_COLS = "grid-cols-[2fr_1fr_1.4fr_1fr_1fr_1.6fr]";

function getQuizMix(quiz: Quiz): string {
  const quizCount = quiz.questions.filter((q) => q.type === "QUIZ").length;
  const pollCount = quiz.questions.filter((q) => q.type === "POLL").length;
  if (quizCount > 0 && pollCount > 0) return `${quizCount} QUIZ · ${pollCount} POLL`;
  if (pollCount > 0) return `${pollCount} POLL`;
  return `${quizCount} QUIZ`;
}

export function QuizListHeader() {
  return (
    <div
      className={`grid ${GRID_COLS} gap-2.5 px-3.5 text-[11px] font-bold tracking-wide text-muted-foreground uppercase`}
    >
      <div>Title</div>
      <div>Questions</div>
      <div>Mix</div>
      <div>Updated</div>
      <div>Status</div>
      <div>Actions</div>
    </div>
  );
}

export function QuizRow({ quiz }: { quiz: Quiz }) {
  return (
    <div
      className={`grid ${GRID_COLS} items-center gap-2.5 rounded-lg border border-border px-3.5 py-3.5 text-[13.5px]`}
    >
      <div className="truncate font-semibold">{quiz.title}</div>
      <div className="text-muted-foreground">{quiz.questions.length}</div>
      <div className="text-muted-foreground">{getQuizMix(quiz)}</div>
      <div className="text-muted-foreground">{formatRelativeTime(quiz.updatedAt)}</div>
      <div>
        <QuizStatusBadge status={quiz.status} />
      </div>
      <div className="flex items-center gap-1.5">
        <Button variant="secondary" size="sm" asChild>
          <Link href={`/quizzes/${quiz.id}`}>Edit</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href={`/host/${quiz.id}/lobby`}>Host</Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon-sm" aria-label={`Thêm hành động cho ${quiz.title}`}>
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => toast(`Đã sao chép "${quiz.title}" (mock)`)}>
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => toast.error(`Đã xoá "${quiz.title}" (mock)`)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
