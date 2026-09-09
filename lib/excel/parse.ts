import type { CellValue } from "exceljs";
import { TEMPLATE_COLUMNS } from "./template";

export interface RawExcelRow {
  rowNumber: number; // actual spreadsheet row number (data starts at 2)
  type: string;
  question: string;
  options: [string, string, string, string, string, string]; // A–F, "" if blank
  correctAnswer: string;
  time: string;
  points: string;
}

export class ExcelParseError extends Error {}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z]/g, "");
}

function cellToString(value: CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && "result" in value) {
    // formula cell — never evaluated, only its last computed result is read
    return cellToString((value as { result?: CellValue }).result ?? "");
  }
  if (typeof value === "object" && "richText" in value) {
    return (value as { richText: { text: string }[] }).richText.map((r) => r.text).join("");
  }
  return String(value).trim();
}

/**
 * Reads an .xlsx file entirely client-side (exceljs never executes macros or
 * formulas — only their last computed result is read as plain text/number).
 * Never trusts cell content beyond that: every value still goes through
 * `lib/excel/validate.ts` before becoming a Question.
 */
export async function parseExcelFile(file: File): Promise<RawExcelRow[]> {
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    throw new ExcelParseError("Chỉ hỗ trợ file .xlsx");
  }

  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    throw new ExcelParseError("Không thể đọc file — vui lòng chọn đúng file .xlsx hợp lệ");
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new ExcelParseError("File không có sheet nào");
  }

  const headerRow = sheet.getRow(1);
  const columnIndex = new Map<string, number>();
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    columnIndex.set(normalizeHeader(cellToString(cell.value)), colNumber);
  });

  const getCol = (header: (typeof TEMPLATE_COLUMNS)[number]) =>
    columnIndex.get(normalizeHeader(header));

  const colType = getCol("Type");
  const colQuestion = getCol("Question");
  const colOptions = ["Option A", "Option B", "Option C", "Option D", "Option E", "Option F"].map(
    (h) => getCol(h as (typeof TEMPLATE_COLUMNS)[number])
  );
  const colCorrect = getCol("Correct Answer");
  const colTime = getCol("Time");
  const colPoints = getCol("Points");

  if (!colType || !colQuestion || !colOptions[0] || !colOptions[1]) {
    throw new ExcelParseError(
      "Không tìm thấy cột bắt buộc (Type, Question, Option A, Option B) — dùng đúng Download Template"
    );
  }

  const rows: RawExcelRow[] = [];
  const lastRow = sheet.actualRowCount;

  for (let rowNumber = 2; rowNumber <= lastRow; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    if (row.cellCount === 0) continue;

    const get = (col: number | undefined) => (col ? cellToString(row.getCell(col).value) : "");
    const type = get(colType);
    const question = get(colQuestion);
    const options = colOptions.map((col) => get(col)) as RawExcelRow["options"];
    const correctAnswer = get(colCorrect);
    const time = get(colTime);
    const points = get(colPoints);

    // skip fully blank rows (trailing empty rows are common in real files)
    if (![type, question, ...options, correctAnswer, time, points].some((v) => v.length > 0)) {
      continue;
    }

    rows.push({ rowNumber, type, question, options, correctAnswer, time, points });
  }

  return rows;
}
