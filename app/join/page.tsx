"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PinInput } from "@/components/participant/PinInput";
import { resolveSessionByPin } from "@/mocks/session";

type PinStatus = "idle" | "validating" | "invalid" | "success";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function JoinPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<PinStatus>("idle");

  const isPinComplete = pin.length === 6;
  const busy = status === "validating" || status === "success";

  function handlePinChange(next: string) {
    setPin(next);
    if (status === "invalid") setStatus("idle");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isPinComplete || busy) return;

    setStatus("validating");
    await wait(500);

    const session = resolveSessionByPin(pin);
    if (!session) {
      setStatus("invalid");
      return;
    }

    setStatus("success");
    await wait(300);
    router.push(`/join/${session.id}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center"
    >
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-[32px] font-bold leading-10 text-heading">
          Join Game
        </h1>
        <p className="text-base text-muted-foreground">Nhập Game PIN để tham gia</p>
      </div>

      <div className="w-full max-w-xs">
        <PinInput
          value={pin}
          onChange={handlePinChange}
          error={status === "invalid" ? "PIN không hợp lệ" : undefined}
          disabled={busy}
        />
      </div>

      <Button
        type="submit"
        size="touch"
        className="w-full max-w-xs"
        disabled={!isPinComplete || busy}
      >
        {status === "validating"
          ? "Đang kiểm tra…"
          : status === "success"
            ? "Đang chuyển hướng…"
            : "Continue"}
      </Button>

      <Link href="/" className="text-sm font-medium text-primary hover:underline">
        ← Về trang chủ
      </Link>
    </form>
  );
}
