import type { ValidatedImportRow } from "@/lib/excel/validate";
import { QuestionTypeBadge } from "@/components/quiz/QuestionTypeBadge";
import { ExcelValidationMessage } from "./ExcelValidationMessage";

const GRID_COLS = "grid-cols-[52px_70px_2fr_80px_1.8fr]";

export function ExcelPreviewTable({ rows }: { rows: ValidatedImportRow[] }) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-150 flex-col gap-1.5">
        <div
          className={`grid ${GRID_COLS} gap-2.5 px-2.5 text-[10.5px] font-bold tracking-wide text-muted-foreground uppercase`}
        >
          <div>Row</div>
          <div>Type</div>
          <div>Question</div>
          <div>Status</div>
          <div>Error</div>
        </div>
        {rows.map((row) => (
          <div
            key={row.row}
            className={`grid ${GRID_COLS} items-center gap-2.5 rounded-md border px-2.5 py-2 text-[12px] ${
              row.status === "error" ? "border-error-100 bg-error-100/50" : "border-border"
            }`}
          >
            <div>{row.row}</div>
            <div>
              <QuestionTypeBadge type={row.type} size="sm" />
            </div>
            <div className="truncate">{row.question || "(trống)"}</div>
            <div
              className={
                row.status === "valid" ? "font-bold text-success-600" : "font-bold text-error-600"
              }
            >
              {row.status === "valid" ? "Hợp lệ" : "Lỗi"}
            </div>
            <div>
              <ExcelValidationMessage
                errorColumn={row.errorColumn}
                errorMessage={row.errorMessage}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
