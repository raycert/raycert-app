import type { ActivityMode } from "@/types";
import type { ImportSummary } from "@/lib/excel/validate";

/** Extended Phase 9B §10: `mode="POST_TEST"` shows total points of valid
 * rows instead of the QUIZ/POLL split (always all-QUIZ, so that split is
 * redundant there); `mode="LIVE_QUIZ"` (default) is unchanged. */
export function ExcelImportSummary({
  fileName,
  summary,
  mode = "LIVE_QUIZ",
}: {
  fileName: string;
  summary: ImportSummary;
  mode?: ActivityMode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-body">
      <span className="font-semibold">{fileName}</span>
      <span>
        Tổng: <strong>{summary.total}</strong>
      </span>
      {mode === "POST_TEST" ? (
        <span>
          Tổng điểm (câu hợp lệ): <strong>{summary.totalPoints}</strong>
        </span>
      ) : (
        <>
          <span>QUIZ: {summary.quizCount}</span>
          <span>POLL: {summary.pollCount}</span>
        </>
      )}
      <span className="font-bold text-success-600">Hợp lệ: {summary.validCount}</span>
      <span className="font-bold text-error-600">Lỗi: {summary.errorCount}</span>
    </div>
  );
}
