import { redirect } from "next/navigation";
import { ParticipantGameShell } from "@/components/participant/ParticipantGameShell";
import { getPlayStateAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function PlaySessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const state = await getPlayStateAction(sessionId);

  // No valid participant cookie for this session (§7 — never joined, or the
  // token is invalid/for a different session): send back to Join rather
  // than fabricate a participant.
  if ("error" in state) {
    redirect(`/join/${sessionId}`);
  }

  return <ParticipantGameShell sessionId={sessionId} initialState={state} />;
}
