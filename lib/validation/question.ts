import { z } from "zod";
import type { Question } from "@/types";

const optionSchema = z.object({
  id: z.string(),
  label: z.string(),
  text: z.string().min(1, "Đáp án không được để trống"),
  isCorrect: z.boolean().optional(),
});

const quizOptionsSchema = z
  .array(optionSchema)
  .min(2, "Cần tối thiểu 2 lựa chọn")
  .max(4, "Tối đa 4 lựa chọn")
  .refine(
    (options) => options.filter((o) => o.isCorrect).length === 1,
    "Cần chọn đúng 1 đáp án đúng"
  );

const pollOptionsSchema = z
  .array(optionSchema)
  .min(2, "Cần tối thiểu 2 lựa chọn")
  .max(6, "Tối đa 6 lựa chọn");

const quizQuestionSchema = z.object({
  type: z.literal("QUIZ"),
  text: z.string().min(1, "Câu hỏi không được để trống"),
  options: quizOptionsSchema,
  points: z.number().int("Điểm phải là số nguyên").positive("Điểm phải lớn hơn 0"),
});

const pollQuestionSchema = z.object({
  type: z.literal("POLL"),
  text: z.string().min(1, "Câu hỏi không được để trống"),
  options: pollOptionsSchema,
});

const questionSchema = z.discriminatedUnion("type", [
  quizQuestionSchema,
  pollQuestionSchema,
]);

/** Human-readable validation messages, deduplicated. Empty array = complete. */
export function getQuestionValidationMessages(question: Question): string[] {
  const result = questionSchema.safeParse(question);
  if (result.success) return [];
  return Array.from(new Set(result.error.issues.map((issue) => issue.message)));
}

export function isQuestionComplete(question: Question): boolean {
  return getQuestionValidationMessages(question).length === 0;
}
