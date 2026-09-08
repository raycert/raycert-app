import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/layout/EmptyState";
import { RecentSessionItem } from "@/components/layout/RecentSessionItem";
import { Button } from "@/components/ui/button";
import { mockRecentSessions } from "@/mocks";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-[32px] font-bold leading-10 text-heading">
          Trainer Dashboard
        </h1>
        <p className="text-base text-muted-foreground">Quick actions và session gần đây</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-5">
          <p className="text-[13px] font-semibold leading-4.5 tracking-wide text-muted-foreground uppercase">
            Recent Sessions
          </p>

          {mockRecentSessions.length === 0 ? (
            <EmptyState
              title="Chưa có session nào"
              description="Host một quiz để bắt đầu buổi đào tạo đầu tiên."
              action={
                <Button asChild>
                  <Link href="/quizzes/new">+ Create Quiz</Link>
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-2.5">
              {mockRecentSessions.map((session) => (
                <RecentSessionItem key={session.sessionId} session={session} />
              ))}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/quizzes"
              className="rounded-lg bg-background px-4 py-4 text-center text-[12.5px] font-semibold text-brand-500 transition-colors hover:bg-secondary"
            >
              My Quizzes →
            </Link>
            <Link
              href="/results"
              className="rounded-lg bg-background px-4 py-4 text-center text-[12.5px] font-semibold text-brand-500 transition-colors hover:bg-secondary"
            >
              Results →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
