import Link from "next/link";
import { NicknameEntryForm } from "@/components/participant/NicknameEntryForm";
import { getPublicSessionInfo } from "@/lib/data/participants";

export const dynamic = "force-dynamic";

/**
 * Reached via QR scan, Join Link, or redirect from /join after a valid PIN
 * (§ Route / UI cập nhật). Session is resolved from the URL (real DB read,
 * Phase 10D) — no PIN re-entry here, straight to Nickname Entry.
 */
export default async function JoinSessionPage({
  params,
}: {
  params: Promise<{ sessionCode: string }>;
}) {
  const { sessionCode } = await params;
  const session = await getPublicSessionInfo(sessionCode);

  if (!session) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-heading text-[24px] font-bold leading-8 text-heading">
          Phiên không hợp lệ hoặc đã kết thúc
        </h1>
        <p className="text-base text-muted-foreground">
          Mã phiên &quot;{sessionCode}&quot; không tồn tại. Kiểm tra lại QR hoặc liên kết được
          chia sẻ.
        </p>
        <Link href="/join" className="text-sm font-medium text-primary hover:underline">
          Nhập PIN thay thế
        </Link>
      </div>
    );
  }

  if (session.status !== "WAITING") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-heading text-[24px] font-bold leading-8 text-heading">
          Trò chơi đã bắt đầu
        </h1>
        <p className="text-base text-muted-foreground">
          &quot;{session.quizTitle}&quot; không còn nhận người tham gia mới.
        </p>
        <Link href="/join" className="text-sm font-medium text-primary hover:underline">
          ← Nhập PIN khác
        </Link>
      </div>
    );
  }

  return <NicknameEntryForm sessionId={session.id} quizTitle={session.quizTitle} pin={session.pin} />;
}
