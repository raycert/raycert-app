"use server";

import { revalidatePath } from "next/cache";
import type { Quiz } from "@/types";
import { deleteQuiz, duplicateQuiz, saveQuiz } from "@/lib/data/quizzes";

/**
 * Quiz Server Actions (Phase 10C) — thin wrappers around `lib/data/quizzes.ts`:
 * ownership is enforced by RLS inside the data layer itself, this just calls
 * through and revalidates the routes that show this data.
 */

export async function saveQuizAction(quiz: Quiz): Promise<{ error?: string }> {
  const result = await saveQuiz(quiz);
  revalidatePath(`/quizzes/${quiz.id}`);
  revalidatePath("/quizzes");
  return result;
}

export async function duplicateQuizAction(
  quizId: string
): Promise<{ id: string } | { error: string }> {
  const result = await duplicateQuiz(quizId);
  revalidatePath("/quizzes");
  return result;
}

export async function deleteQuizAction(quizId: string): Promise<{ error?: string }> {
  const result = await deleteQuiz(quizId);
  revalidatePath("/quizzes");
  return result;
}
