"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { ActivityMode, ImportState, Question } from "@/types";
import { ExcelParseError, parseExcelFile } from "@/lib/excel/parse";
import { summarizeRows, validateImportRow, type ValidatedImportRow } from "@/lib/excel/validate";
import {
  downloadBlob,
  generatePostTestTemplateBlob,
  generateTemplateBlob,
  POST_TEST_TEMPLATE_FILENAME,
  TEMPLATE_FILENAME,
} from "@/lib/excel/template";
import { ExcelDropzone } from "./ExcelDropzone";
import { ExcelImportSummary } from "./ExcelImportSummary";
import { ExcelPreviewTable } from "./ExcelPreviewTable";

/**
 * Reused as-is by Quiz Editor (`mode="LIVE_QUIZ"`, default — unchanged
 * behavior) and Assessment Editor (`mode="POST_TEST"` — Phase 9B): QUIZ-only,
 * blank Points default to 1, its own template variant. Parsing stays
 * format-agnostic; only validation/labels/template branch on `mode`.
 */
export function ExcelImportDialog({
  open,
  onOpenChange,
  onImportQuestions,
  mode = "LIVE_QUIZ",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportQuestions: (questions: Question[]) => void;
  mode?: ActivityMode;
}) {
  const [state, setState] = useState<ImportState>("empty");
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ValidatedImportRow[]>([]);
  const [parseError, setParseError] = useState<string | undefined>();

  function reset() {
    setState("empty");
    setFileName("");
    setRows([]);
    setParseError(undefined);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleFileSelected(file: File) {
    setParseError(undefined);
    setFileName(file.name);
    setState("selected");
    // Yield a tick so "selected" actually paints before "validating" —
    // otherwise React batches both updates into one render.
    await new Promise((resolve) => setTimeout(resolve, 150));
    setState("validating");
    try {
      const rawRows = await parseExcelFile(file);
      setRows(rawRows.map((r) => validateImportRow(r, mode)));
      setState("preview");
    } catch (error) {
      setParseError(
        error instanceof ExcelParseError
          ? error.message
          : "Không thể đọc file. Vui lòng thử lại."
      );
      setState("empty");
    }
  }

  async function handleDownloadTemplate() {
    const blob =
      mode === "POST_TEST" ? await generatePostTestTemplateBlob() : await generateTemplateBlob();
    downloadBlob(blob, mode === "POST_TEST" ? POST_TEST_TEMPLATE_FILENAME : TEMPLATE_FILENAME);
  }

  function handleImport() {
    const validQuestions = rows
      .filter((r) => r.status === "valid" && r.builtQuestion)
      .map((r) => r.builtQuestion!);
    if (validQuestions.length === 0) return;

    setState("importing");
    setTimeout(() => {
      onImportQuestions(validQuestions);
      toast.success(`Đã import ${validQuestions.length} câu hỏi`);
      handleOpenChange(false);
    }, 400);
  }

  const summary = summarizeRows(rows);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {mode === "POST_TEST" ? "Import Excel — Post-test" : "Import Excel"}
          </DialogTitle>
          <DialogDescription>
            {mode === "POST_TEST"
              ? "Chỉ hỗ trợ file .xlsx theo template Post-test — chỉ QUIZ (không POLL), Points bỏ trống sẽ mặc định = 1. Dữ liệu được đọc hoàn toàn ở trình duyệt — không upload lên server."
              : "Chỉ hỗ trợ file .xlsx theo đúng template RayCert. Dữ liệu được đọc hoàn toàn ở trình duyệt — không upload lên server."}
          </DialogDescription>
        </DialogHeader>

        {state === "empty" ? (
          <div className="flex flex-col gap-2">
            <ExcelDropzone
              onFileSelected={handleFileSelected}
              onDownloadTemplate={handleDownloadTemplate}
            />
            {parseError ? (
              <p role="alert" className="text-[12.5px] text-error-600">
                {parseError}
              </p>
            ) : null}
          </div>
        ) : null}

        {state === "selected" || state === "validating" ? (
          <div className="flex flex-col items-center gap-2.5 rounded-lg border border-border px-6 py-8 text-center">
            <p className="text-[12.5px] font-semibold">{fileName}</p>
            <Progress value={state === "validating" ? 65 : 15} className="max-w-80" />
            <p className="text-[11.5px] text-muted-foreground">Đang kiểm tra dữ liệu…</p>
          </div>
        ) : null}

        {state === "preview" || state === "importing" ? (
          <div className="flex flex-col gap-3.5">
            <ExcelImportSummary fileName={fileName} summary={summary} mode={mode} />
            <ExcelPreviewTable rows={rows} mode={mode} />
          </div>
        ) : null}

        <DialogFooter>
          {state === "preview" || state === "importing" ? (
            <>
              <Button type="button" variant="outline" onClick={reset} disabled={state === "importing"}>
                Upload lại file
              </Button>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleImport}
                disabled={summary.validCount === 0 || state === "importing"}
              >
                {state === "importing"
                  ? "Đang import…"
                  : `Import ${summary.validCount} câu hợp lệ`}
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
