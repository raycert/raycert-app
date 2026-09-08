import { mockGameSession, mockParticipants } from "@/mocks";
import { HostLobbyPanel } from "@/components/game/HostLobbyPanel";

export default async function HostLobbyPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  return (
    <div className="flex flex-1 flex-col justify-center">
      <HostLobbyPanel
        sessionCode={sessionId}
        pin={mockGameSession.pin}
        participants={mockParticipants}
      />
    </div>
  );
}
