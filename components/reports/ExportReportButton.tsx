"use client";

import { useState } from "react";
import { DownloadIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/excel/template";
import { generateReportExportBlob, reportExportFilename } from "@/lib/excel/report-export";
import type { SessionReport } from "@/mocks/reports";

/** Export Excel UI foundation (Phase 8 §8) — client-side workbook via exceljs,
 * mirrors the Excel import feature's download pattern (Phase 4). */
export function ExportReportButton({ report }: { report: SessionReport }) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const blob = await generateReportExportBlob(report);
      downloadBlob(blob, reportExportFilename(report));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button variant="secondary" onClick={handleExport} disabled={isExporting}>
      {isExporting ? (
        <Loader2Icon className="animate-spin" aria-hidden="true" />
      ) : (
        <DownloadIcon aria-hidden="true" />
      )}
      Export Excel
    </Button>
  );
}
