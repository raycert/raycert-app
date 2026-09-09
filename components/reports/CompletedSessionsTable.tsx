import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QuestionTypeBadge } from "@/components/quiz/QuestionTypeBadge";
import { formatDate } from "@/lib/format";
import type { CompletedSessionSummary } from "@/mocks/reports";

/** Results Dashboard list (High-Fidelity #24) — a real <table> for semantic
 * headers + horizontal scroll on narrow viewports (README §14). */
export function CompletedSessionsTable({ sessions }: { sessions: CompletedSessionSummary[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-180 border-collapse text-left">
        <caption className="sr-only">Danh sách session đã hoàn thành</caption>
        <thead>
          <tr className="border-b border-border bg-surface text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
            <th scope="col" className="px-4 py-2.5">
              Quiz
            </th>
            <th scope="col" className="px-4 py-2.5">
              Ngày
            </th>
            <th scope="col" className="px-4 py-2.5">
              Participants
            </th>
            <th scope="col" className="px-4 py-2.5">
              Câu hỏi
            </th>
            <th scope="col" className="px-4 py-2.5">
              Loại
            </th>
            <th scope="col" className="px-4 py-2.5">
              Trạng thái
            </th>
            <th scope="col" className="px-4 py-2.5">
              <span className="sr-only">Action</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session.sessionId} className="border-b border-border last:border-0">
              <td className="px-4 py-3 text-[13.5px] font-semibold text-heading">{session.quizTitle}</td>
              <td className="px-4 py-3 text-[13px] text-muted-foreground">{formatDate(session.hostedAt)}</td>
              <td className="px-4 py-3 text-[13px] text-muted-foreground">{session.participantCount}</td>
              <td className="px-4 py-3 text-[13px] text-muted-foreground">{session.questionCount}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  {session.quizCount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                      <QuestionTypeBadge type="QUIZ" size="sm" /> ×{session.quizCount}
                    </span>
                  ) : null}
                  {session.pollCount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                      <QuestionTypeBadge type="POLL" size="sm" /> ×{session.pollCount}
                    </span>
                  ) : null}
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-full bg-success-100 px-2.5 py-1 text-[11px] font-semibold text-success-600">
                  Completed
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/results/${session.sessionId}`}>View Report</Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
