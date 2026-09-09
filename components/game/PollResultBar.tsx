import { cn } from "@/lib/utils";

export function PollResultBar({
  label,
  text,
  percent,
  count,
  highlighted,
}: {
  label: string;
  text: string;
  percent: number;
  count: number;
  highlighted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md px-1.5 py-1",
        highlighted && "bg-teal-100/60 ring-1 ring-teal-500"
      )}
    >
      <span className={cn("w-4 shrink-0 text-[11px]", highlighted ? "font-bold text-[#1c6e6e]" : "text-muted-foreground")}>
        {label}
      </span>
      <span className="w-20 shrink-0 truncate text-[11.5px]">{text}</span>
      <div className="h-5 flex-1 overflow-hidden rounded-md bg-muted">
        <div className="h-full bg-teal-500" style={{ width: `${percent}%` }} />
      </div>
      <span className="w-9 shrink-0 text-right text-[11.5px] font-semibold">{percent}%</span>
      <span className="w-8 shrink-0 text-right text-[11px] text-muted-foreground">({count})</span>
      {highlighted ? <span className="sr-only">Bạn đã chọn đáp án này</span> : null}
    </div>
  );
}
