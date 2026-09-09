import Link from "next/link";
import { toast } from "sonner";
import type { HostLeaderboardEntry } from "@/hooks/use-host-gameplay";
import { Button } from "@/components/ui/button";

export function FinalLeaderboard({
  entries,
  totalParticipants,
  quizCount,
  pollCount,
  avgCorrectRate,
}: {
  entries: HostLeaderboardEntry[];
  totalParticipants: number;
  quizCount: number;
  pollCount: number;
  avgCorrectRate: number | null;
}) {
  const top3 = entries.slice(0, 3);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 text-center">
      <h1 className="font-heading text-[28px] font-bold text-white">Session hoàn tất</h1>

      <div className="flex flex-wrap justify-center gap-x-7 gap-y-1.5 text-[12.5px] text-white/70">
        <span>{totalParticipants} participants</span>
        <span>{quizCount} QUIZ</span>
        <span>{pollCount} POLL</span>
        {avgCorrectRate !== null ? <span>Avg correct rate: {avgCorrectRate}%</span> : null}
      </div>

      <div className="flex flex-col gap-2">
        {top3.map((entry) => (
          <div
            key={entry.participantId}
            className="flex items-center gap-4 rounded-lg bg-white/[0.08] px-5 py-3"
          >
            <span className="w-8 shrink-0 font-heading text-lg font-bold text-white">
              {entry.rank}
            </span>
            <span className="flex-1 truncate text-left text-[15px] font-semibold text-white">
              {entry.nickname}
            </span>
            <span className="text-[15px] font-bold text-white">
              {entry.score.toLocaleString("vi-VN")}
            </span>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-3">
        <Button
          variant="outline"
          className="border-white/30 bg-transparent text-white hover:bg-white/10"
          onClick={() => toast("Xem báo cáo chi tiết sẽ có ở Phase 8")}
        >
          View Results
        </Button>
        <Button className="bg-white text-primary hover:bg-white/90" asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
