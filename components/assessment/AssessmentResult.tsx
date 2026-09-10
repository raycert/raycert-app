"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Assessment, AssessmentAttempt } from "@/types";
import { Button } from "@/components/ui/button";
import { buildQuestionReviews } from "@/lib/assessment/scoring";
import { getAttemptById, getAttemptHistoryForIdentity } from "@/lib/assessment/attempt-store";
import { AssessmentHeader } from "./AssessmentHeader";
import { PassFailBadge } from "./PassFailBadge";
import { AssessmentScoreCard } from "./AssessmentScoreCard";
import { AssessmentResultSummary } from "./AssessmentResultSummary";
import { RetakeAssessmentButton } from "./RetakeAssessmentButton";
import { AssessmentReview } from "./AssessmentReview";
import { AttemptHistory } from "./AttemptHistory";

/**
 * `/assessment/[assessmentId]/result` (Phase 9C §11/§16 placeholder, real
 * Result screen built Phase 9D). The attempt lives in `sessionStorage`
 * (`lib/assessment/attempt-store.ts`), unavailable during SSR — state starts
 * `null`/`not loaded` and is populated in a mount-only effect (same
 * hydration-safe pattern as `AssessmentPresent`'s `sessionStartedAt`),
 * rather than read directly in the render body. No banner here (§15
 * explicitly deprioritizes it in favor of a clear result summary — the
 * recommended §20 layout doesn't call for one either).
 *
 * Always looks the attempt up by the exact `attemptId` in the URL — never
 * "whichever attempt happened to be saved last" — and scopes Attempt
 * History to that attempt's own `fullName`+`department`. Both matter
 * because `sessionStorage` is tab-scoped, not learner-scoped: without this,
 * a second person testing the same Assessment in the same tab could end up
 * looking at (or being counted against the attempt limit of) the first
 * person's data.
 */
export function AssessmentResult({
  assessment,
  attemptId,
}: {
  assessment: Assessment;
  attemptId?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [history, setHistory] = useState<AssessmentAttempt[]>([]);

  useEffect(() => {
    // `attemptId` is required — there is no safe way to guess "the" attempt
    // otherwise. A previous version fell back to "the last attempt for this
    // Assessment" when `attemptId` was missing, which could silently show a
    // completely different learner's result (bug fix): two different people
    // testing the same Assessment in one tab would see each other's name/
    // department instead of their own. §5 — an unknown attempt shows a
    // clear not-found state, never a guessed one.
    const found = attemptId ? getAttemptById(assessment.id, attemptId) : null;
    // Scoped to the resolved attempt's OWN identity, never every attempt
    // for the Assessment — otherwise this list could include another
    // learner's attempts too.
    const ownHistory = found ? getAttemptHistoryForIdentity(assessment.id, found.fullName, found.department) : [];

    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration of sessionStorage-backed attempt data, unavailable during SSR
    setAttempt(found);
    setHistory(ownHistory);
    setLoaded(true);
  }, [assessment.id, attemptId]);

  if (!loaded) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
        Đang tải kết quả…
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="font-heading text-[20px] font-bold text-heading">Không tìm thấy kết quả</h1>
        <p className="text-sm text-muted-foreground">
          Không tìm thấy kết quả bài làm này trong phiên trình duyệt hiện tại — có thể do mở liên
          kết ở một tab/thiết bị khác, hoặc phiên đã hết hạn.
        </p>
        <Button variant="secondary" asChild>
          <Link href={`/assessment/${assessment.id}/start`}>Quay lại trang bắt đầu</Link>
        </Button>
      </div>
    );
  }

  const isTimeout = attempt.submissionReason === "TIMEOUT";
  const reviews = assessment.settings.showCorrectAnswersAfterSubmit
    ? buildQuestionReviews(assessment.questions, attempt)
    : [];

  return (
    <div className="flex flex-1 flex-col gap-5 px-5 py-6">
      <AssessmentHeader title={assessment.title || "Untitled Post-test"} companyName={assessment.companyName} />

      <PassFailBadge passed={attempt.passed} />

      {isTimeout ? (
        <p className="rounded-lg bg-amber-100 px-3.5 py-2.5 text-center text-[12.5px] text-amber-600">
          Bài làm đã được nộp tự động khi hết thời gian.
        </p>
      ) : null}

      <AssessmentScoreCard
        earnedPoints={attempt.earnedPoints}
        totalPoints={attempt.totalPoints}
        scorePercent={attempt.scorePercent}
        minimumPassingPoints={assessment.settings.minimumPassingPoints}
      />

      <AssessmentResultSummary
        correctCount={attempt.correctCount}
        incorrectCount={attempt.incorrectCount}
        unansweredCount={attempt.unansweredCount}
      />

      <div className="flex flex-col gap-0.5 text-center">
        <p className="text-sm font-semibold text-heading">{attempt.fullName}</p>
        <p className="text-[12.5px] text-muted-foreground">Bộ phận: {attempt.department}</p>
      </div>

      <p className="text-center text-[12px] text-muted-foreground">
        Lần {attempt.attemptNumber} / {assessment.settings.maxAttempts}
      </p>

      <div className="flex items-center gap-2.5">
        <RetakeAssessmentButton
          assessmentId={assessment.id}
          fullName={attempt.fullName}
          department={attempt.department}
          attemptNumber={attempt.attemptNumber}
          maxAttempts={assessment.settings.maxAttempts}
        />
        <Button type="button" variant="outline" size="touch" className="flex-1" asChild>
          <Link href={`/assessment/${assessment.id}/start`}>Hoàn thành</Link>
        </Button>
      </div>

      <AssessmentReview reviews={reviews} />

      <AttemptHistory attempts={history} />
    </div>
  );
}
