import type { ActivityMode } from "@/types";
import type { ValidatedImportRow } from "@/lib/excel/validate";
import { QuestionTypeBadge } from "@/components/quiz/QuestionTypeBadge";
import { ExcelValidationMessage } from "./ExcelValidationMessage";

const LIVE_QUIZ_GRID_COLS = "grid-cols-[52px_70px_2fr_80px_1.8fr]";
const POST_TEST_GRID_COLS = "grid-cols-[52px_2fr_90px_70px_80px_1.8fr]";

function getCorrectLabel(row: ValidatedImportRow): string {
  if (!row.builtQuestion) return "—";
  return row.builtQuestion.options.find((o) => o.isCorrect)?.label ?? "—";
}

function getPoints(row: ValidatedImportRow): string {
  return row.builtQuestion?.points !== undefined ? String(row.builtQuestion.points) : "—";
}

/** Import preview (Phase 4, extended Phase 9B §10). `mode="LIVE_QUIZ"` keeps
 * the original Row/Type/Question/Status/Error layout unchanged; `mode="POST_TEST"`
 * swaps the Type column (always QUIZ, redundant) for Correct Answer + Points. */
export function ExcelPreviewTable({
  rows,
  mode = "LIVE_QUIZ",
}: {
  rows: ValidatedImportRow[];
  mode?: ActivityMode;
}) {
  const gridCols = mode === "POST_TEST" ? POST_TEST_GRID_COLS : LIVE_QUIZ_GRID_COLS;

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-150 flex-col gap-1.5">
        <div
          className={`grid ${gridCols} gap-2.5 px-2.5 text-[10.5px] font-bold tracking-wide text-muted-foreground uppercase`}
        >
          <div>Row</div>
          {mode === "POST_TEST" ? (
            <>
              <div>Question</div>
              <div>Correct Answer</div>
              <div>Points</div>
            </>
          ) : (
            <>
              <div>Type</div>
              <div>Question</div>
            </>
          )}
          <div>Status</div>
          <div>Error</div>
        </div>
        {rows.map((row) => (
          <div
            key={row.row}
            className={`grid ${gridCols} items-center gap-2.5 rounded-md border px-2.5 py-2 text-[12px] ${
              row.status === "error" ? "border-error-100 bg-error-100/50" : "border-border"
            }`}
          >
            <div>{row.row}</div>
            {mode === "POST_TEST" ? (
              <>
                <div className="truncate">{row.question || "(trống)"}</div>
                <div>{getCorrectLabel(row)}</div>
                <div>{getPoints(row)}</div>
              </>
            ) : (
              <>
                <div>
                  <QuestionTypeBadge type={row.type} size="sm" />
                </div>
                <div className="truncate">{row.question || "(trống)"}</div>
              </>
            )}
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
