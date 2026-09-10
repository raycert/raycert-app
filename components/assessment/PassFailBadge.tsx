import { CircleCheckIcon, CircleXIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Result status (Phase 9D §3/§4) — the hero element of the Result screen.
 * Icon + explicit bold text always together, never color-only (§4/§29).
 * Wording is fixed to "ĐẠT"/"KHÔNG ĐẠT" — never "Winner"/"Rank"/
 * "Leaderboard"/"Score bonus" (§4), keeping this visually and verbally
 * distinct from Live Quiz's leaderboard language.
 */
export function PassFailBadge({ passed }: { passed: boolean }) {
  return (
    <div
      role="status"
      className={cn(
        "flex w-full flex-col items-center gap-1.5 rounded-xl border-2 px-6 py-5",
        passed ? "border-success-600 bg-success-100" : "border-error-600 bg-error-100"
      )}
    >
      {passed ? (
        <CircleCheckIcon className="size-9 text-success-600" aria-hidden="true" />
      ) : (
        <CircleXIcon className="size-9 text-error-600" aria-hidden="true" />
      )}
      <p
        className={cn(
          "font-heading text-[24px] font-extrabold tracking-wide",
          passed ? "text-success-600" : "text-error-600"
        )}
      >
        {passed ? "ĐẠT" : "KHÔNG ĐẠT"}
      </p>
    </div>
  );
}
