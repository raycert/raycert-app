import { HostShell } from "@/components/layout/HostShell";
import { HostLobbyPanel } from "@/components/game/HostLobbyPanel";
import { mockGameSession, mockParticipants } from "@/mocks";

export default async function HostLobbyPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  return (
    <HostShell>
      <div className="flex flex-1 flex-col justify-center">
        <HostLobbyPanel
          sessionCode={sessionId}
          pin={mockGameSession.pin}
          participants={mockParticipants}
        />
      </div>
    </HostShell>
  );
}
