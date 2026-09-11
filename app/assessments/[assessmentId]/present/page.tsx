import { AssessmentPresent } from "@/components/assessment/AssessmentPresent";
import { getAssessmentById } from "@/lib/data/assessments";

/**
 * Deliberately NOT nested inside `app/(trainer)/assessments/[assessmentId]/`
 * even though it shares the same URL prefix — this route needs a full-bleed
 * projector layout (`HostShell`, no NavBar/SidebarNav), and a route group
 * cannot be "escaped" by a deeper segment once a layout wraps it. Verified
 * this split doesn't collide with `(trainer)`'s `/assessments/[assessmentId]`
 * route — different leaf paths, same prefix, both build and render cleanly.
 *
 * Reads via `getAssessmentById` (Phase 10C) — served by the owner-RLS policy
 * for the trainer opening this from their own dashboard, or by the public
 * "status = ACTIVE" policy if this link is ever opened without a trainer
 * session; either way it's the same real Supabase row.
 */
export const dynamic = "force-dynamic";

export default async function AssessmentPresentPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  const assessment = await getAssessmentById(assessmentId);

  if (!assessment) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-brand-900 px-6 text-center text-white">
        <h1 className="font-heading text-[24px] font-bold">Không tìm thấy bài kiểm tra</h1>
        <p className="text-white/70">
          Bài Post-test &quot;{assessmentId}&quot; không tồn tại hoặc đã bị gỡ.
        </p>
      </div>
    );
  }

  return <AssessmentPresent assessment={assessment} />;
}
