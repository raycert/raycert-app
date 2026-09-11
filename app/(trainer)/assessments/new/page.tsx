import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createBlankAssessment } from "@/lib/data/assessments";

/** Visiting /new is the "first save" (Phase 10C §4/§8) — it inserts a
 * blank row right away and redirects to the real edit URL, rather than
 * generating a client-side draft id and deferring the insert to the first
 * autosave. From here on, editing a brand new Assessment and editing an
 * existing one are exactly the same code path (AssessmentEditor always
 * receives a real, already-persisted Assessment). */
export default async function NewAssessmentPage() {
  const result = await createBlankAssessment();

  if ("error" in result) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
        <h1 className="font-heading text-[24px] font-bold leading-8 text-heading">
          Không thể tạo Post-test mới
        </h1>
        <p className="max-w-md text-base text-muted-foreground">{result.error}</p>
        <Button variant="secondary" asChild>
          <Link href="/assessments">← Quay lại Assessments</Link>
        </Button>
      </div>
    );
  }

  redirect(`/assessments/${result.id}`);
}
