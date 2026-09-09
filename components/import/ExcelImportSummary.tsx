import type { ImportSummary } from "@/lib/excel/validate";

export function ExcelImportSummary({
  fileName,
  summary,
}: {
  fileName: string;
  summary: ImportSummary;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-body">
      <span className="font-semibold">{fileName}</span>
      <span>
        Tổng: <strong>{summary.total}</strong>
      </span>
      <span>QUIZ: {summary.quizCount}</span>
      <span>POLL: {summary.pollCount}</span>
      <span className="font-bold text-success-600">Hợp lệ: {summary.validCount}</span>
      <span className="font-bold text-error-600">Lỗi: {summary.errorCount}</span>
    </div>
  );
}
