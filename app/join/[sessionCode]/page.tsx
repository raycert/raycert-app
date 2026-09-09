"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSessionQuizTitle, isNicknameTaken, resolveSessionByCode } from "@/mocks/session";

type NicknameStatus = "idle" | "joining" | "invalid" | "duplicate";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const MAX_NICKNAME_LENGTH = 20;

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
  const [status, setStatus] = useState<NicknameStatus>("idle");

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

  const quizTitle = getSessionQuizTitle(session);
  const trimmed = nickname.trim();
  const isValidLength = trimmed.length >= 2 && trimmed.length <= MAX_NICKNAME_LENGTH;
  const busy = status === "joining";

  function handleNicknameChange(next: string) {
    setNickname(next);
    if (status === "invalid" || status === "duplicate") setStatus("idle");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidLength || busy) return;

    if (isNicknameTaken(trimmed)) {
      setStatus("duplicate");
      return;
    }

    setStatus("joining");
    await wait(450);
    router.push(`/play/${session!.id}?nickname=${encodeURIComponent(trimmed)}`);
  }

  const error =
    status === "duplicate"
      ? "Nickname đã có người dùng trong phiên này, vui lòng chọn tên khác"
      : status === "invalid"
        ? "Nickname cần 2–20 ký tự"
        : undefined;

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
          {quizTitle} · PIN: <span className="font-semibold text-heading">{session.pin}</span>
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-1.5">
        <label htmlFor="nickname" className="sr-only">
          Nickname
        </label>
        <Input
          id="nickname"
          autoFocus
          maxLength={MAX_NICKNAME_LENGTH}
          placeholder="Nickname của bạn"
          aria-invalid={!!error}
          aria-describedby={error ? "nickname-error" : undefined}
          disabled={busy}
          value={nickname}
          onChange={(e) => handleNicknameChange(e.target.value)}
          className="h-14 text-center text-lg"
        />
        {error ? (
          <p id="nickname-error" role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="touch" className="w-full max-w-xs" disabled={!isValidLength || busy}>
        {busy ? "Đang tham gia…" : "Join Game"}
      </Button>

      <Link href="/join" className="text-sm font-medium text-primary hover:underline">
        ← Nhập PIN khác
      </Link>
    </form>
  );
}
