import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HostShell } from "@/components/layout/HostShell";
import { HostLobbyPanel } from "@/components/game/HostLobbyPanel";
import { getGameSessionForHost } from "@/lib/data/game-sessions";

export const dynamic = "force-dynamic";

export default async function HostLobbyPage({
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

  if (session.status !== "WAITING") {
    redirect(`/host/${sessionId}/live`);
  }

  return (
    <HostShell>
      <div className="flex flex-1 flex-col justify-center">
        <div className="mb-2 text-center text-sm font-medium text-white/60">{session.quizTitle}</div>
        <HostLobbyPanel
          sessionId={sessionId}
          pin={session.pin}
          initialParticipants={session.participants.map((p) => ({ nickname: p.nickname }))}
        />
      </div>
    </HostShell>
  );
}
