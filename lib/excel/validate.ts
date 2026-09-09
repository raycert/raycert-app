import type { AnswerOption, ImportPreviewRow, Question, QuestionType } from "@/types";
import { isQuestionComplete } from "@/lib/validation/question";
import type { RawExcelRow } from "./parse";

const LABELS = ["A", "B", "C", "D", "E", "F"];

export interface ValidatedImportRow extends ImportPreviewRow {
  /** Only set when `status === "valid"` — ready to append to the Quiz Editor. */
  builtQuestion?: Question;
}

function buildQuestion(params: {
  type: QuestionType;
  question: string;
  optionTexts: string[];
  correctLabel: string;
  time: number;
  points?: number;
}): Question {
  const options: AnswerOption[] = params.optionTexts.map((text, i) => ({
    id: crypto.randomUUID(),
    label: LABELS[i],
    text,
    ...(params.type === "QUIZ" ? { isCorrect: LABELS[i] === params.correctLabel } : {}),
  }));

  const question: Question = {
    id: crypto.randomUUID(),
    type: params.type,
    text: params.question,
    options,
    timerSeconds: Math.round(params.time),
    points: params.type === "QUIZ" ? params.points : undefined,
    order: 0, // reassigned when merged into the Quiz Editor's question list
    isComplete: false,
  };
  return { ...question, isComplete: isQuestionComplete(question) };
}

/**
 * Validates one parsed Excel row against the RayCert QUIZ/POLL rules
 * (docs/design/README.md §12, CLAUDE.md §2). Never auto-corrects data — a
 * row either satisfies every rule or is reported as an error, verbatim.
 */
export function validateImportRow(raw: RawExcelRow): ValidatedImportRow {
  const typeRaw = raw.type.trim().toUpperCase();
  const question = raw.question.trim();
  const options = raw.options.map((o) => o.trim());
  const correctRaw = raw.correctAnswer.trim().toUpperCase();
  const timeRaw = raw.time.trim();
  const pointsRaw = raw.points.trim();

  const fail = (errorColumn: string, errorMessage: string): ValidatedImportRow => ({
    row: raw.rowNumber,
    type: typeRaw === "POLL" ? "POLL" : "QUIZ",
    question,
    status: "error",
    errorColumn,
    errorMessage,
  });

  if (typeRaw !== "QUIZ" && typeRaw !== "POLL") {
    return fail("Type", "Type phải là QUIZ hoặc POLL");
  }
  const type: QuestionType = typeRaw;

  if (!question) {
    return fail("Question", "Thiếu nội dung câu hỏi");
  }
  if (!options[0]) return fail("Option A", "Thiếu Option A");
  if (!options[1]) return fail("Option B", "Thiếu Option B");

  const firstEmptyIndex = options.findIndex((o) => o.length === 0);
  const hasGapAfterEmpty =
    firstEmptyIndex !== -1 && options.slice(firstEmptyIndex + 1).some((o) => o.length > 0);
  if (hasGapAfterEmpty) {
    const label = LABELS[firstEmptyIndex];
    return fail(
      `Option ${label}`,
      `Option ${label} bị bỏ trống trong khi option sau đó có dữ liệu — các option phải điền liên tục từ A`
    );
  }

  const filledCount = firstEmptyIndex === -1 ? options.length : firstEmptyIndex;
  const maxOptions = type === "QUIZ" ? 4 : 6;
  if (filledCount > maxOptions) {
    return fail(`Option ${LABELS[maxOptions]}`, `${type} chỉ được tối đa ${maxOptions} lựa chọn`);
  }

  if (type === "QUIZ") {
    if (!correctRaw) {
      return fail("Correct Answer", "QUIZ cần Correct Answer (A/B/C/D)");
    }
    const correctIndex = LABELS.indexOf(correctRaw);
    if (correctIndex === -1 || correctIndex >= filledCount) {
      return fail(
        "Correct Answer",
        `Correct Answer "${raw.correctAnswer.trim()}" không khớp option nào`
      );
    }
  } else if (correctRaw) {
    return fail("Correct Answer", "POLL không được có Correct Answer");
  }

  const time = Number(timeRaw);
  if (!timeRaw || !Number.isFinite(time) || time <= 0) {
    return fail("Time", "Time không hợp lệ (phải là số giây dương)");
  }

  let points: number | undefined;
  if (type === "QUIZ") {
    const parsedPoints = Number(pointsRaw);
    if (!pointsRaw || !Number.isFinite(parsedPoints) || parsedPoints <= 0) {
      return fail("Points", "QUIZ Points không hợp lệ (phải > 0)");
    }
    points = parsedPoints;
  } else if (pointsRaw) {
    const parsedPoints = Number(pointsRaw);
    if (!Number.isFinite(parsedPoints) || parsedPoints !== 0) {
      return fail("Points", "POLL Points phải là 0 hoặc để trống");
    }
  }

  const builtQuestion = buildQuestion({
    type,
    question,
    optionTexts: options.slice(0, filledCount),
    correctLabel: correctRaw,
    time,
    points,
  });

  return {
    row: raw.rowNumber,
    type,
    question,
    status: "valid",
    builtQuestion,
  };
}

export interface ImportSummary {
  total: number;
  quizCount: number;
  pollCount: number;
  validCount: number;
  errorCount: number;
}

export function summarizeRows(rows: ValidatedImportRow[]): ImportSummary {
  return {
    total: rows.length,
    quizCount: rows.filter((r) => r.type === "QUIZ").length,
    pollCount: rows.filter((r) => r.type === "POLL").length,
    validCount: rows.filter((r) => r.status === "valid").length,
    errorCount: rows.filter((r) => r.status === "error").length,
  };
}
