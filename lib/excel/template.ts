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

export const POST_TEST_TEMPLATE_FILENAME = "raycert-posttest-import-template.xlsx";

/**
 * Post-test's own column set (timer fix-up, §5/§7) — no `Option E`/`Option
 * F` (Post-test QUIZ caps at 4 options) and no `Time` (Post-test has no
 * per-question timer, only the overall `timeLimitMinutes` at the assessment
 * level). `lib/excel/parse.ts` looks up columns by header name and already
 * tolerates missing ones — importing a file built from this narrower
 * template needs zero parser changes. A Quiz template re-imported here still
 * works too: its extra `Option E`/`Option F`/`Time` columns are simply
 * ignored by `validateImportRow`'s `POST_TEST` branch.
 */
export const POST_TEST_TEMPLATE_COLUMNS = [
  "Type",
  "Question",
  "Option A",
  "Option B",
  "Option C",
  "Option D",
  "Correct Answer",
  "Points",
] as const;

/**
 * Post-test variant of `generateTemplateBlob` (Phase 9B §8, timer fix-up
 * §5/§8) — same generator shape, reused, but its own narrower column set
 * (`POST_TEST_TEMPLATE_COLUMNS`, no Time/Option E/F) and QUIZ-only sample
 * rows on Post-test's own low-integer points scale. Does not touch
 * `generateTemplateBlob`/`TEMPLATE_COLUMNS`/`TEMPLATE_FILENAME` above — the
 * Quiz template is unchanged.
 */
export async function generatePostTestTemplateBlob(): Promise<Blob> {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Questions");

  sheet.columns = POST_TEST_TEMPLATE_COLUMNS.map((header) => ({
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
    "Correct Answer": "A",
    Points: 2,
  });
  sheet.addRow({
    Type: "QUIZ",
    Question: "RayCert dùng để làm gì?",
    "Option A": "Quiz đào tạo realtime cho doanh nghiệp",
    "Option B": "Quản lý bảng lương",
    "Option C": "",
    "Option D": "",
    "Correct Answer": "A",
    Points: "", // left blank to illustrate default = 1
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
