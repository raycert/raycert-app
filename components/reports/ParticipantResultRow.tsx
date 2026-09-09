import { formatResponseSeconds } from "@/lib/format";
import type { ParticipantResultRow as ParticipantResultRowData } from "@/mocks/reports";

/** One row of the Participant Results table — a real <tr> so screen readers
 * keep the row/column association (README §14, semantic table headers). */
export function ParticipantResultRow({
  row,
  onSelect,
}: {
  row: ParticipantResultRowData;
  onSelect: () => void;
}) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-3 py-2.5 text-[13px] font-semibold text-muted-foreground">
        {row.rank ?? "—"}
      </td>
      <td className="px-3 py-2.5">
        <button
          type="button"
          onClick={onSelect}
          className="rounded text-[13.5px] font-semibold text-primary underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {row.nickname}
        </button>
      </td>
      <td className="px-3 py-2.5 text-[13.5px] font-semibold text-heading">
        {row.totalScore ?? "—"}
      </td>
      <td className="px-3 py-2.5 text-[13px] text-success-600">{row.correctCount}</td>
      <td className="px-3 py-2.5 text-[13px] text-error-600">{row.incorrectCount}</td>
      <td className="px-3 py-2.5 text-[13px] text-muted-foreground">{row.unansweredCount}</td>
      <td className="px-3 py-2.5 text-[13px] text-muted-foreground">
        {row.averageResponseMs !== null ? formatResponseSeconds(row.averageResponseMs) : "—"}
      </td>
    </tr>
  );
}
