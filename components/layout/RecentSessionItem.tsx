import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format";
import type { RecentSessionSummary } from "@/mocks/session";

export function RecentSessionItem({ session }: { session: RecentSessionSummary }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3.5">
      <p className="text-[13.5px] font-semibold">
        {session.quizTitle}{" "}
        <span className="font-normal text-muted-foreground">
          · {formatRelativeTime(session.hostedAt)} · {session.participantCount} người tham gia
        </span>
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" asChild>
          <Link href={`/quizzes/${session.quizId}`}>Edit</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href={`/host/${session.sessionId}/lobby`}>Host</Link>
        </Button>
      </div>
    </div>
  );
}
