"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// TEMPORARY diagnostic tracing (participant/host poll transition
// investigation) — always on, not NODE_ENV-gated. Remove once confirmed
// fixed.
const TRACE = true;

/**
 * Minimal polling (Phase 10D §11 — "chưa cần realtime auto-update...
 * polling tối thiểu nếu thật sự cần"), not Realtime/Broadcast. Calls
 * `fetchFn` immediately on mount/dependency change, then again `intervalMs`
 * after the PREVIOUS call's response has been applied — never on a fixed
 * `setInterval` schedule. Used by both the Host (participant list, response
 * count) and Participant (session phase transitions) live views — see
 * `hooks/use-host-gameplay.ts`/`hooks/use-participant-gameplay.ts`.
 *
 * Non-overlapping by construction (regression fix): the previous version
 * used `setInterval(() => fetchAndApply(), intervalMs)`, which fires a new
 * request every tick regardless of whether the last one has resolved yet.
 * An earlier attempt to guard against the resulting out-of-order responses
 * compared each response's id against the LATEST ISSUED request id — but
 * once a second request has been *issued* (not yet resolved), the first
 * response is already "stale" by that rule even if it's the only one that
 * ever comes back quickly; under real latency (request time >= intervalMs)
 * every single response can end up discarded this way — poll starvation,
 * exactly the regression reported. The actual fix is structural, not a
 * smarter comparison: only ONE fetch is ever in flight at a time
 * (recursive `setTimeout`, not `setInterval`), so there is no "newer
 * request" for a response to lose to in the first place — out-of-order
 * responses are impossible, not just detected-and-discarded.
 */
export function useLivePoll<T>(fetchFn: () => Promise<T>, intervalMs: number, enabled: boolean) {
  const [data, setData] = useState<T | null>(null);
  const fetchRef = useRef(fetchFn);
  const requestCounterRef = useRef(0);
  const stoppedRef = useRef(false);

  useEffect(() => {
    fetchRef.current = fetchFn;
  }, [fetchFn]);

  const runOnce = useCallback(async (): Promise<T> => {
    const requestId = ++requestCounterRef.current;
    if (TRACE) console.log("[LIVE POLL START]", { requestId });

    const result = await fetchRef.current();

    if (TRACE) console.log("[LIVE POLL RESPONSE]", { requestId, result });

    if (!stoppedRef.current) {
      setData(result);
    } else if (TRACE) {
      console.log("[LIVE POLL DISCARD]", { requestId, reason: "stopped/unmounted before apply" });
    }
    return result;
  }, []);

  // One-off manual refetch, independent of the scheduled loop below —
  // callers don't currently use this, kept for API compatibility.
  const refetch = useCallback(() => runOnce(), [runOnce]);

  useEffect(() => {
    if (!enabled) return;
    stoppedRef.current = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    // Recursive setTimeout, not setInterval: the next poll is only
    // scheduled AFTER this one's response has been applied, so at most one
    // request is ever in flight — the non-overlapping guarantee itself,
    // not a comparison that tries to approximate it.
    async function loop() {
      if (stoppedRef.current) return;
      try {
        await runOnce();
      } finally {
        if (!stoppedRef.current) {
          timeoutId = setTimeout(loop, intervalMs);
        }
      }
    }

    void loop();

    return () => {
      stoppedRef.current = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [enabled, intervalMs, runOnce]);

  return { data, refetch };
}
