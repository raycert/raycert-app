export function ParticipantRankCard({ rank, score }: { rank: number; score: number }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-secondary px-6 py-5 text-center">
      <p className="text-[12.5px] text-muted-foreground">Bạn xếp thứ</p>
      <p className="font-heading text-[40px] font-extrabold leading-none text-primary">
        #{rank}
      </p>
      <p className="text-[13.5px] text-body">
        Tổng điểm: <strong className="text-heading">{score.toLocaleString("vi-VN")}</strong>
      </p>
    </div>
  );
}
