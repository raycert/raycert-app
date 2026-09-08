"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveSessionByCode } from "@/mocks/session";

/**
 * Reached via QR scan, Join Link, or redirect from /join after a valid PIN
 * (§ Route / UI cập nhật). Session is already resolved from the URL — no
 * PIN re-entry here, straight to Nickname Entry.
 */
export default function JoinSessionPage() {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const router = useRouter();
  const session = resolveSessionByCode(sessionCode);

  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | undefined>();

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (nickname.trim().length < 2) {
      setError("Nickname cần ít nhất 2 ký tự");
      return;
    }
    setError(undefined);
    router.push(`/play/${session!.id}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center"
    >
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-[32px] font-bold leading-10 text-heading">
          Nhập nickname
        </h1>
        <p className="text-base text-muted-foreground">
          PIN: <span className="font-semibold text-heading">{session.pin}</span>
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-1.5">
        <Input
          autoFocus
          maxLength={20}
          placeholder="Nickname của bạn"
          aria-invalid={!!error}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="h-14 text-center text-lg"
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>

      <Button type="submit" size="touch" className="w-full max-w-xs">
        Join Game
      </Button>

      <Link href="/join" className="text-sm font-medium text-primary hover:underline">
        ← Nhập PIN khác
      </Link>
    </form>
  );
}
