"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { joinAction } from "@/app/join/actions";

type NicknameStatus = "idle" | "joining" | "error";

const MAX_NICKNAME_LENGTH = 20;

export function NicknameEntryForm({
  sessionId,
  quizTitle,
  pin,
}: {
  sessionId: string;
  quizTitle: string;
  pin: string;
}) {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [status, setStatus] = useState<NicknameStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const trimmed = nickname.trim();
  const isValidLength = trimmed.length >= 2 && trimmed.length <= MAX_NICKNAME_LENGTH;
  const busy = status === "joining";

  function handleNicknameChange(next: string) {
    setNickname(next);
    if (status === "error") setStatus("idle");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidLength || busy) return;

    setStatus("joining");
    const result = await joinAction(sessionId, trimmed);
    if ("error" in result) {
      setError(result.error);
      setStatus("error");
      return;
    }

    router.push(`/play/${sessionId}`);
  }

  const displayError =
    status === "error" ? (error ?? "Không thể tham gia") : !isValidLength && nickname.length > 0 ? "Nickname cần 2–20 ký tự" : undefined;

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
          {quizTitle} · PIN: <span className="font-semibold text-heading">{pin}</span>
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
          aria-invalid={!!displayError}
          aria-describedby={displayError ? "nickname-error" : undefined}
          disabled={busy}
          value={nickname}
          onChange={(e) => handleNicknameChange(e.target.value)}
          className="h-14 text-center text-lg"
        />
        {displayError ? (
          <p id="nickname-error" role="alert" className="text-sm text-destructive">
            {displayError}
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
