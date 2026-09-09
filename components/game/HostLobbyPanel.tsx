"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Participant } from "@/types";
import { Button } from "@/components/ui/button";
import { GameQRCode } from "./GameQRCode";
import { GamePin } from "./GamePin";
import { JoinInstructions } from "./JoinInstructions";
import { CopyJoinLinkButton } from "./CopyJoinLinkButton";

/**
 * Host Lobby's join panel: QR Code | Game PIN side-by-side on desktop/projector,
 * stacked on narrow screens (§ Design consistency). Computes the join URL from
 * the current origin at mount — never hard-codes a production domain.
 */
export function HostLobbyPanel({
  sessionCode,
  pin,
  participants,
}: {
  sessionCode: string;
  pin: string;
  participants: Participant[];
}) {
  const [joinUrl, setJoinUrl] = useState(`/join/${sessionCode}`);

  useEffect(() => {
    // window.location.origin only exists after mount (no window during SSR).
    // Seeding state with the relative path keeps the first client render
    // identical to the server-rendered HTML, avoiding a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setJoinUrl(`${window.location.origin}/join/${sessionCode}`);
  }, [sessionCode]);

  return (
    <div className="flex flex-1 flex-col gap-10">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center sm:gap-14">
        <GameQRCode url={joinUrl} />
        <div className="flex flex-col items-center gap-3 sm:items-start">
          <GamePin pin={pin} />
          <JoinInstructions />
          <CopyJoinLinkButton url={joinUrl} />
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 border-t border-white/10 pt-8">
        <p className="text-[13px] font-semibold uppercase leading-4.5 tracking-wide text-white/60">
          {participants.length} người tham gia
        </p>
        <div className="flex max-w-2xl flex-wrap justify-center gap-2">
          {participants.map((p) => (
            <span
              key={p.id}
              className="rounded-full bg-white/10 px-3 py-1.5 text-sm text-white"
            >
              {p.nickname}
            </span>
          ))}
        </div>
        {participants.length === 0 ? (
          <Button size="lg" disabled className="mt-2">
            Start Game
          </Button>
        ) : (
          <Button size="lg" className="mt-2" asChild>
            <Link href={`/host/${sessionCode}/live`}>Start Game</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
