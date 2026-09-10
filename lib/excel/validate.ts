import type { ActivityMode, AnswerOption, ImportPreviewRow, Question, QuestionType } from "@/types";
import { isQuestionComplete } from "@/lib/validation/question";
import type { RawExcelRow } from "./parse";

const LABELS = ["A", "B", "C", "D", "E", "F"];
// `Question.timerSeconds` is a required field on the shared model (LIVE_QUIZ needs it) but
// Post-test never displays or reads it anywhere (Assessment Editor's QuestionSettings renders
// with showTimer={false}; only `settings.timeLimitMinutes` — the overall assessment timer —
// matters for POST_TEST). This default only keeps the shared shape filled in, nothing more.
const POST_TEST_DEFAULT_TIMER_SECONDS = 20;

export interface ValidatedImportRow extends ImportPreviewRow {
  /** Only set when `status === "valid"` — ready to append to the Quiz/Assessment Editor. */
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
    order: 0, // reassigned when merged into the Quiz/Assessment Editor's question list
    isComplete: false,
  };
  return { ...question, isComplete: isQuestionComplete(question) };
}

/**
 * Validates one parsed Excel row against RayCert's rules — same column
 * layout for both activity modes (docs/design/README.md §12, CLAUDE.md §2),
 * but the accepted `Type`/`Points`/`Time` rules differ by `mode`
 * (Phase 9B §16): `LIVE_QUIZ` keeps every check byte-for-byte as before;
 * `POST_TEST` only accepts QUIZ rows, defaults blank Points to 1, requires
 * integer Points, and never fails on Time (parsed for template
 * compatibility only — Post-test has no per-question timer). Never
 * auto-corrects data beyond that one documented default.
 */
export function validateImportRow(
  raw: RawExcelRow,
  mode: ActivityMode = "LIVE_QUIZ"
): ValidatedImportRow {
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

  if (mode === "POST_TEST") {
    if (typeRaw !== "QUIZ") {
      return fail("Type", "Post-test chỉ hỗ trợ QUIZ");
    }
  } else if (typeRaw !== "QUIZ" && typeRaw !== "POLL") {
    return fail("Type", "Type phải là QUIZ hoặc POLL");
  }
  // POST_TEST already rejected anything but QUIZ above, so this is always safe.
  const resolvedType: QuestionType = mode === "POST_TEST" ? "QUIZ" : (typeRaw as QuestionType);

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
  const maxOptions = resolvedType === "QUIZ" ? 4 : 6;
  if (filledCount > maxOptions) {
    return fail(
      `Option ${LABELS[maxOptions]}`,
      mode === "POST_TEST"
        ? "Post-test chỉ hỗ trợ tối đa 4 đáp án"
        : `${resolvedType} chỉ được tối đa ${maxOptions} lựa chọn`
    );
  }

  if (resolvedType === "QUIZ") {
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

  let time: number;
  if (mode === "POST_TEST") {
    // Not required, not validated as an error — Post-test has no per-question
    // timer at runtime; parsed only so the shared Question shape stays filled.
    const parsedTime = Number(timeRaw);
    time = timeRaw && Number.isFinite(parsedTime) && parsedTime > 0
      ? parsedTime
      : POST_TEST_DEFAULT_TIMER_SECONDS;
  } else {
    const parsedTime = Number(timeRaw);
    if (!timeRaw || !Number.isFinite(parsedTime) || parsedTime <= 0) {
      return fail("Time", "Time không hợp lệ (phải là số giây dương)");
    }
    time = parsedTime;
  }

  let points: number | undefined;
  if (mode === "POST_TEST") {
    if (!pointsRaw) {
      points = 1; // blank -> default 1 (Phase 9A/9B rule), the one documented auto-correction
    } else {
      const parsedPoints = Number(pointsRaw);
      if (!Number.isFinite(parsedPoints)) {
        return fail("Points", "Điểm phải là số");
      }
      if (!Number.isInteger(parsedPoints)) {
        return fail("Points", "Điểm phải là số nguyên");
      }
      if (parsedPoints <= 0) {
        return fail("Points", "Điểm phải lớn hơn 0");
      }
      points = parsedPoints;
    }
  } else if (resolvedType === "QUIZ") {
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
    type: resolvedType,
    question,
    optionTexts: options.slice(0, filledCount),
    correctLabel: correctRaw,
    time,
    points,
  });

  return {
    row: raw.rowNumber,
    type: resolvedType,
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
  /** Sum of `points` across valid QUIZ rows — meaningful for POST_TEST imports. */
  totalPoints: number;
}

export function summarizeRows(rows: ValidatedImportRow[]): ImportSummary {
  return {
    total: rows.length,
    quizCount: rows.filter((r) => r.type === "QUIZ").length,
    pollCount: rows.filter((r) => r.type === "POLL").length,
    validCount: rows.filter((r) => r.status === "valid").length,
    errorCount: rows.filter((r) => r.status === "error").length,
    totalPoints: rows.reduce(
      (sum, r) => sum + (r.status === "valid" ? (r.builtQuestion?.points ?? 0) : 0),
      0
    ),
  };
}
