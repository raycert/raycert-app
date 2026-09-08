"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PinInput } from "@/components/participant/PinInput";
import { resolveSessionByPin } from "@/mocks/session";

export default function JoinPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | undefined>();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length !== 6) {
      setError("Nhập đủ 6 số PIN");
      return;
    }
    const session = resolveSessionByPin(pin);
    if (!session) {
      setError("PIN không hợp lệ");
      return;
    }
    setError(undefined);
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
        <PinInput value={pin} onChange={setPin} error={error} />
      </div>

      <Button type="submit" size="touch" className="w-full max-w-xs">
        Continue
      </Button>

      <Link href="/" className="text-sm font-medium text-primary hover:underline">
        ← Về trang chủ
      </Link>
    </form>
  );
}
