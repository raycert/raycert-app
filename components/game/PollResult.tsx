import { PollResultBar } from "./PollResultBar";

export interface PollResultRow {
  optionId: string;
  label: string;
  text: string;
  count: number;
  percent: number;
}

export function PollResult({
  rows,
  selectedOptionId,
  totalVoters,
}: {
  rows: PollResultRow[];
  selectedOptionId: string | null;
  totalVoters: number;
}) {
  const selected = rows.find((r) => r.optionId === selectedOptionId);

  return (
    <div className="flex flex-1 flex-col justify-center gap-4 px-5">
      <p className="text-center text-[12.5px] text-muted-foreground">
        {selected ? (
          <>
            Bạn đã chọn:{" "}
            <strong className="text-[#1c6e6e]">
              {selected.label}. {selected.text}
            </strong>
          </>
        ) : (
          "Bạn không trả lời câu này"
        )}
      </p>

      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <PollResultBar
            key={row.optionId}
            label={row.label}
            text={row.text}
            percent={row.percent}
            count={row.count}
            highlighted={row.optionId === selectedOptionId}
          />
        ))}
      </div>

      <p className="text-center text-[11.5px] text-muted-foreground">
        {totalVoters} lượt bình chọn · Đang chờ câu tiếp theo…
      </p>
    </div>
  );
}
