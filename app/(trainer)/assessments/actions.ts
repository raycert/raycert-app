"use server";

import { revalidatePath } from "next/cache";
import type { Assessment } from "@/types";
import { duplicateAssessment, saveAssessment } from "@/lib/data/assessments";

/**
 * Assessment Server Actions (Phase 10C) — thin wrappers around
 * `lib/data/assessments.ts`: verify nothing extra here (ownership is
 * enforced by RLS inside the data layer itself), just call through and
 * revalidate the routes that show this data. Real Postgres rows now, not
 * the old sessionStorage/`globalThis` mock array from the Company Name +
 * Duplicate addendum — every Server Action and every Server Component
 * already talks to the same actual Supabase project, so there's no
 * separate-module-instance problem to route around anymore.
 */

export async function saveAssessmentAction(assessment: Assessment): Promise<{ error?: string }> {
  const result = await saveAssessment(assessment);
  revalidatePath(`/assessments/${assessment.id}`);
  revalidatePath("/assessments");
  return result;
}

export async function duplicateAssessmentAction(
  assessmentId: string
): Promise<{ id: string } | { error: string }> {
  const result = await duplicateAssessment(assessmentId);
  revalidatePath("/assessments");
  return result;
}
