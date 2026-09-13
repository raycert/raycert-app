import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HostShell } from "@/components/layout/HostShell";
import { createGameSession } from "@/lib/data/game-sessions";

/** Entry point for the "Host" button on a Quiz (§1) — creates a real
 * `game_sessions` row (real PIN, `host_id` from the authenticated trainer)
 * and redirects to its Lobby, mirroring the insert-on-visit pattern
 * `/quizzes/new`/`/assessments/new` established in Phase 10C. */
export default async function NewHostSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ quizId?: string }>;
}) {
  const { quizId } = await searchParams;

  if (!quizId) {
    return (
      <HostShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
          <h1 className="font-heading text-[24px] font-bold leading-8">Thiếu thông tin quiz</h1>
          <Button variant="secondary" asChild>
            <Link href="/quizzes">← Quay lại My Quizzes</Link>
          </Button>
        </div>
      </HostShell>
    );
  }

  const result = await createGameSession(quizId);

  if ("error" in result) {
    return (
      <HostShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
          <h1 className="font-heading text-[24px] font-bold leading-8">Không thể bắt đầu Host</h1>
          <p className="max-w-md text-base text-white/70">{result.error}</p>
          <Button variant="secondary" asChild>
            <Link href="/quizzes">← Quay lại My Quizzes</Link>
          </Button>
        </div>
      </HostShell>
    );
  }

  redirect(`/host/${result.id}/lobby`);
}
