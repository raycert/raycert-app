/**
 * Excel template generation — client-side only (exceljs), no backend.
 * Column order/names must match `lib/excel/parse.ts`'s header mapping.
 */

export const TEMPLATE_FILENAME = "raycert-import-template.xlsx";
export const TEMPLATE_COLUMNS = [
  "Type",
  "Question",
  "Option A",
  "Option B",
  "Option C",
  "Option D",
  "Option E",
  "Option F",
  "Correct Answer",
  "Time",
  "Points",
] as const;

export async function generateTemplateBlob(): Promise<Blob> {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Questions");

  sheet.columns = TEMPLATE_COLUMNS.map((header) => ({
    header,
    key: header,
    width: header === "Question" ? 42 : header.startsWith("Option") ? 20 : 14,
  }));
  sheet.getRow(1).font = { bold: true };

  sheet.addRow({
    Type: "QUIZ",
    Question: "Thủ đô của Việt Nam là gì?",
    "Option A": "Hà Nội",
    "Option B": "Đà Nẵng",
    "Option C": "TP. Hồ Chí Minh",
    "Option D": "Huế",
    "Option E": "",
    "Option F": "",
    "Correct Answer": "A",
    Time: 20,
    Points: 1000,
  });
  sheet.addRow({
    Type: "POLL",
    Question: "Bạn đánh giá buổi training này thế nào?",
    "Option A": "Rất hài lòng",
    "Option B": "Bình thường",
    "Option C": "Cần cải thiện",
    "Option D": "",
    "Option E": "",
    "Option F": "",
    "Correct Answer": "",
    Time: 15,
    Points: "",
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
