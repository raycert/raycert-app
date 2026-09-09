import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import type { HostLeaderboardEntry } from "@/hooks/use-host-gameplay";
import { cn } from "@/lib/utils";

const VISIBLE_ROWS = 10;

export function HostLeaderboard({ entries }: { entries: HostLeaderboardEntry[] }) {
  const visible = entries.slice(0, VISIBLE_ROWS);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-2.5">
      <h2 className="mb-2 text-center font-heading text-2xl font-bold text-white">Leaderboard</h2>
      {visible.map((entry) => {
        const rankChange = entry.previousRank !== null ? entry.previousRank - entry.rank : 0;
        return (
          <div
            key={entry.participantId}
            className={cn(
              "flex items-center gap-4 rounded-lg px-5 py-3",
              entry.rank <= 3 ? "bg-white/15" : "bg-white/[0.06]"
            )}
          >
            <span className="w-8 shrink-0 font-heading text-lg font-bold text-white">
              {entry.rank}
            </span>
            <span className="flex-1 truncate text-[15px] font-semibold text-white">
              {entry.nickname}
            </span>
            {rankChange !== 0 ? (
              <span
                className={cn(
                  "flex shrink-0 items-center gap-0.5 text-xs font-semibold",
                  rankChange > 0 ? "text-success-100" : "text-error-100"
                )}
              >
                {rankChange > 0 ? (
                  <ArrowUpIcon className="size-3.5" />
                ) : (
                  <ArrowDownIcon className="size-3.5" />
                )}
                {Math.abs(rankChange)}
              </span>
            ) : null}
            {entry.delta > 0 ? (
              <span className="shrink-0 text-xs font-semibold text-success-100">
                +{entry.delta.toLocaleString("vi-VN")}
              </span>
            ) : null}
            <span className="w-20 shrink-0 text-right text-[15px] font-bold text-white">
              {entry.score.toLocaleString("vi-VN")}
            </span>
          </div>
        );
      })}
    </div>
  );
}
