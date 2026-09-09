import { redirect } from "next/navigation";
import Link from "next/link";
import { ParticipantGameShell } from "@/components/participant/ParticipantGameShell";
import { mockParticipants } from "@/mocks";
import { getSessionQuizTitle, resolveSessionByCode } from "@/mocks/session";

export default async function PlaySessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ nickname?: string }>;
}) {
  const { sessionId } = await params;
  const { nickname } = await searchParams;

  const session = resolveSessionByCode(sessionId);
  if (!session) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-heading text-[24px] font-bold leading-8 text-heading">
          Không tìm thấy phiên
        </h1>
        <p className="text-base text-muted-foreground">
          Phiên &quot;{sessionId}&quot; không tồn tại hoặc đã kết thúc.
        </p>
        <Link href="/join" className="text-sm font-medium text-primary hover:underline">
          Quay lại Join Game
        </Link>
      </div>
    );
  }

  // No nickname in the URL (e.g. a bare /play/[sessionId] visit) — this mock
  // has no server-side session persistence, so nickname is the only signal
  // that the participant actually completed Nickname Entry. Send them there.
  if (!nickname) {
    redirect(`/join/${sessionId}`);
  }

  return (
    <ParticipantGameShell
      nickname={nickname}
      quizTitle={getSessionQuizTitle(session)}
      participantCount={mockParticipants.length + 1}
    />
  );
}
