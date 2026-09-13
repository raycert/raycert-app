"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLivePoll } from "@/hooks/use-live-poll";
import { getHostLiveStateAction, startGameAction } from "@/app/host/[sessionId]/actions";
import { GameQRCode } from "./GameQRCode";
import { GamePin } from "./GamePin";
import { JoinInstructions } from "./JoinInstructions";
import { CopyJoinLinkButton } from "./CopyJoinLinkButton";

const POLL_INTERVAL_MS = 2500;

/**
 * Host Lobby's join panel: QR Code | Game PIN side-by-side on desktop/projector,
 * stacked on narrow screens (§ Design consistency). Computes the join URL from
 * the current origin at mount — never hard-codes a production domain.
 *
 * Participant list/count is real now (Phase 10D §3) — polled every ~2.5s
 * (§11's "minimal polling", not Realtime) from `getHostLiveStateAction` so
 * the host sees people join without needing to refresh.
 */
export function HostLobbyPanel({
  sessionId,
  pin,
  initialParticipants,
}: {
  sessionId: string;
  pin: string;
  initialParticipants: { nickname: string }[];
}) {
  const [joinUrl, setJoinUrl] = useState(`/join/${sessionId}`);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    // window.location.origin only exists after mount (no window during SSR).
    // Seeding state with the relative path keeps the first client render
    // identical to the server-rendered HTML, avoiding a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setJoinUrl(`${window.location.origin}/join/${sessionId}`);
  }, [sessionId]);

  const { data: polled } = useLivePoll(() => getHostLiveStateAction(sessionId), POLL_INTERVAL_MS, true);
  const participants =
    polled && !("error" in polled)
      ? polled.leaderboard.map((e) => ({ nickname: e.nickname }))
      : initialParticipants;

  // Defensive self-redirect: the Lobby route's server-side `redirect()` (in
  // page.tsx) only re-checks `session.status` on a fresh page load. A tab
  // that's been sitting on this page since before Start Game — restored via
  // back/forward navigation, Next.js's client-side router cache serving a
  // stale render, or simply a second tab that never re-fetched — never gets
  // a fresh server round-trip, so that check never re-runs and the host is
  // left staring at a Lobby with no way forward (no Close/Next Question
  // buttons exist here — those are only on /live). This poll already
  // running for the participant list is repurposed to also catch that and
  // navigate away itself, closing the gap the one-time server check leaves.
  //
  // Hard navigation (`window.location.href`), not `router.replace` — a real
  // repro on this app showed `startGame` succeeding server-side (confirmed
  // via the DB) while `router.push`/`router.replace` left the browser
  // sitting on the exact same Lobby render indefinitely. A full navigation
  // can't be affected by the App Router's client-side cache or a stale
  // hook-closure the way a soft navigation can — it always forces a fresh
  // request to the server, which is what actually needs to happen here.
  useEffect(() => {
    if (polled && !("error" in polled) && polled.status !== "WAITING") {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberate, see comment above
      window.location.href = `/host/${sessionId}/live`;
    }
  }, [polled, sessionId]);

  async function handleStart() {
    setStarting(true);
    const result = await startGameAction(sessionId);
    if (result.error) {
      toast.error(result.error);
      setStarting(false);
      return;
    }
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberate, see comment above
    window.location.href = `/host/${sessionId}/live`;
  }

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
              key={p.nickname}
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
          <Button size="lg" className="mt-2" onClick={handleStart} disabled={starting}>
            {starting ? "Đang bắt đầu…" : "Start Game"}
          </Button>
        )}
      </div>
    </div>
  );
}
