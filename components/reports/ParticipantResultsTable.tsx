import { ParticipantResultRow } from "@/components/reports/ParticipantResultRow";
import type { ParticipantResultRow as ParticipantResultRowData } from "@/mocks/reports";

/**
 * Participant Results table (README §5/§14 — semantic headers, horizontal
 * scroll on narrow viewports instead of breaking layout). `hasQuiz = false`
 * means the session is all-POLL: rank/score are never computed for POLL
 * (CLAUDE.md §2), so those columns render "—" via ParticipantResultRow.
 */
export function ParticipantResultsTable({
  rows,
  hasQuiz,
  onSelectParticipant,
}: {
  rows: ParticipantResultRowData[];
  hasQuiz: boolean;
  onSelectParticipant: (participantId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {!hasQuiz ? (
        <p className="text-[12px] text-muted-foreground">
          Session này chỉ có câu hỏi POLL — không tính điểm hoặc xếp hạng.
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-140 border-collapse text-left">
          <caption className="sr-only">Kết quả từng participant trong session</caption>
          <thead>
            <tr className="border-b border-border bg-surface text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
              <th scope="col" className="px-3 py-2.5">
                Rank
              </th>
              <th scope="col" className="px-3 py-2.5">
                Nickname
              </th>
              <th scope="col" className="px-3 py-2.5">
                Score
              </th>
              <th scope="col" className="px-3 py-2.5">
                Correct
              </th>
              <th scope="col" className="px-3 py-2.5">
                Incorrect
              </th>
              <th scope="col" className="px-3 py-2.5">
                Unanswered
              </th>
              <th scope="col" className="px-3 py-2.5">
                Avg response
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <ParticipantResultRow
                key={row.participantId}
                row={row}
                onSelect={() => onSelectParticipant(row.participantId)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
