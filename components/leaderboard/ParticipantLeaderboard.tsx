import type { LeaderboardEntry } from "@/types";
import { cn } from "@/lib/utils";
import { ParticipantRankCard } from "./ParticipantRankCard";

const TOP_N = 5;

/** Top 5 if the participant is in it, otherwise top 3 + the rows nearby their own rank. */
function pickVisibleRows(entries: LeaderboardEntry[], myRank: number): LeaderboardEntry[] {
  if (myRank <= TOP_N) return entries.slice(0, TOP_N);

  const top = entries.slice(0, 3);
  const nearby = entries.filter((e) => e.rank >= myRank - 1 && e.rank <= myRank + 1);
  return [...top, ...nearby];
}

export function ParticipantLeaderboard({
  entries,
  myRank,
  myParticipantId = "me",
}: {
  entries: LeaderboardEntry[];
  myRank: number;
  myParticipantId?: string;
}) {
  const mine = entries.find((e) => e.rank === myRank);
  const visible = pickVisibleRows(entries, myRank);
  const hasGap = myRank > TOP_N + 1;

  return (
    <div className="flex flex-1 flex-col gap-4 px-5 py-4">
      <ParticipantRankCard rank={myRank} score={mine?.score ?? 0} />

      <div className="flex flex-col gap-1.5">
        {visible.map((entry, i) => (
          <div key={entry.participantId}>
            {hasGap && i === 3 ? (
              <div className="py-1 text-center text-xs text-muted-foreground" aria-hidden="true">
                ···
              </div>
            ) : null}
            <div
              className={cn(
                "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-[13px]",
                entry.participantId === myParticipantId
                  ? "bg-secondary font-semibold text-primary"
                  : "bg-background text-body"
              )}
            >
              <span className="w-6 shrink-0 font-heading font-bold text-muted-foreground">
                {entry.rank}
              </span>
              <span className="flex-1 truncate">{entry.nickname}</span>
              <span className="font-semibold">{entry.score.toLocaleString("vi-VN")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
