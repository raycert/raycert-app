import { mockParticipants } from "@/mocks";

export default async function PlaySessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const me = mockParticipants[0];

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-xs leading-4 uppercase tracking-wide text-muted-foreground">
        Participant Session (shell) · {sessionId}
      </p>
      <h1 className="font-heading text-[24px] font-bold leading-8 text-heading">
        Xin chào, {me.nickname}
      </h1>
      <p className="text-base text-muted-foreground">
        Đang chờ host bắt đầu câu hỏi…
      </p>
    </div>
  );
}
