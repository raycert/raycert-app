import { HostShell } from "@/components/layout/HostShell";
import { HostGameShell } from "@/components/game/HostGameShell";

export default async function HostLivePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  await params; // not used yet — mock game state is session-agnostic (single fixed sequence)

  return (
    <HostShell wide>
      <HostGameShell />
    </HostShell>
  );
}
