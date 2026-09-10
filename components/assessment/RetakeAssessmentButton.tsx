"use client";

import { useRouter } from "next/navigation";
import { RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * "Làm lại" (Phase 9D §10/§11) — navigates straight to `/take` with the same
 * `fullName`/`department` already known from this attempt (§10 "giữ fullName
 * và department local"), skipping `/start`'s form entirely. `useAssessmentAttempt`'s
 * mount effect does the rest: computes the next `attemptNumber` from
 * attempt history, a fresh shuffle/timer/blank answers, all "reset" behavior
 * is just what a brand new attempt already does.
 *
 * Gated on `attemptNumber < maxAttempts` — once exhausted, renders the exact
 * required message instead of a button (§11), never a disabled button with
 * no explanation.
 */
export function RetakeAssessmentButton({
  assessmentId,
  fullName,
  department,
  attemptNumber,
  maxAttempts,
}: {
  assessmentId: string;
  fullName: string;
  department: string;
  attemptNumber: number;
  maxAttempts: number;
}) {
  const router = useRouter();

  if (attemptNumber >= maxAttempts) {
    return (
      <p className="flex-1 text-center text-[12.5px] text-muted-foreground">
        Bạn đã sử dụng hết số lần làm bài.
      </p>
    );
  }

  function handleRetake() {
    const params = new URLSearchParams({ fullName, department });
    router.push(`/assessment/${assessmentId}/take?${params.toString()}`);
  }

  return (
    <Button type="button" size="touch" className="flex-1" onClick={handleRetake}>
      <RotateCcwIcon />
      Làm lại
    </Button>
  );
}
