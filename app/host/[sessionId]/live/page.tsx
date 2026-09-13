import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HostShell } from "@/components/layout/HostShell";
import { HostGameShell } from "@/components/game/HostGameShell";
import { getGameSessionForHost } from "@/lib/data/game-sessions";
import { getQuizById } from "@/lib/data/quizzes";
import { getLeaderboard } from "@/lib/data/live-answers";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HostLivePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await getGameSessionForHost(sessionId);

  if (!session) {
    return (
      <HostShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
          <h1 className="font-heading text-[24px] font-bold leading-8">Không tìm thấy phiên</h1>
          <p className="max-w-md text-base text-white/70">
            Phiên &quot;{sessionId}&quot; không tồn tại, hoặc bạn không phải host của phiên này.
          </p>
          <Button variant="secondary" asChild>
            <Link href="/quizzes">← Quay lại My Quizzes</Link>
          </Button>
        </div>
      </HostShell>
    );
  }

  if (session.status === "WAITING") {
    redirect(`/host/${sessionId}/lobby`);
  }

  const quiz = await getQuizById(session.quizId);
  if (!quiz) {
    return (
      <HostShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
          <h1 className="font-heading text-[24px] font-bold leading-8">Không tìm thấy quiz</h1>
        </div>
      </HostShell>
    );
  }

  const supabase = await createClient();
  const leaderboard = await getLeaderboard(supabase, sessionId);

  return (
    <HostShell wide>
      <HostGameShell
        sessionId={sessionId}
        quiz={quiz}
        initialStatus={session.status === "ACTIVE" ? "QUESTION_ACTIVE" : session.status}
        initialQuestionIndex={session.currentQuestionIndex}
        initialQuestionStartedAt={session.currentQuestionStartedAt}
        initialLeaderboard={leaderboard}
      />
    </HostShell>
  );
}
