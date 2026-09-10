"use server";

import { refresh, revalidatePath } from "next/cache";
import { addMockAssessment, getAssessment, mockAssessments } from "@/mocks";
import { duplicateAssessment } from "@/lib/assessment/duplicate";

/**
 * Mock-backend mutation boundary for Duplicate (Company Name + Duplicate
 * addendum §7-16). There is no real database in this phase, so this is the
 * one place that mutates the shared mock store — a client component can't
 * do that directly, since a "use client" bundle runs in the browser and
 * never shares memory with the server. Running the mutation as a Server
 * Action keeps it on the server (where `getAssessment`/`mockAssessments` for
 * every other trainer route already read from — see `mocks/assessments.ts`'s
 * `globalThis` singleton, needed because Next.js gives Server Actions and
 * Server Components separate module instances of the same file), so the new
 * assessment is immediately reachable at `/assessments/[newId]` and
 * `/assessments/[newId]/present`, not just visible in the revalidated list.
 * `refresh()` (from `next/cache`) is what actually gets the client to show
 * the new card — `revalidatePath` alone marks the cache stale but wasn't
 * observed to force a re-fetch for an event-handler-invoked action here;
 * the caller (`AssessmentCard`) also calls `router.refresh()` as a second,
 * client-side belt-and-suspenders trigger.
 */
export async function duplicateAssessmentAction(
  assessmentId: string
): Promise<{ id: string; title: string } | { error: string }> {
  const source = getAssessment(assessmentId);
  if (!source) return { error: "not-found" };

  const copy = duplicateAssessment(
    source,
    mockAssessments.map((a) => a.id)
  );
  addMockAssessment(copy);
  revalidatePath("/assessments");
  refresh();

  return { id: copy.id, title: copy.title };
}
