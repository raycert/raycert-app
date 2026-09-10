"use client";

import { useEffect, useMemo, useState } from "react";
import type { Assessment } from "@/types";
import { Button } from "@/components/ui/button";
import { GameQRCode } from "@/components/game/GameQRCode";
import { CopyJoinLinkButton } from "@/components/game/CopyJoinLinkButton";
import { HostShell } from "@/components/layout/HostShell";
import { useAssessmentTimer } from "@/hooks/use-assessment-timer";
import { AssessmentCountdown } from "./AssessmentCountdown";
import { AssessmentBanner } from "./AssessmentBanner";
import { getEquivalentPassRate, getScoredQuestions, getTotalPoints } from "@/lib/validation/assessment";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg bg-white/10 px-3 py-2.5 text-center">
      <p className="font-heading text-xl font-extrabold text-white">{value}</p>
      <p className="text-[11.5px] text-white/70">{label}</p>
    </div>
  );
}

/**
 * `/assessments/[assessmentId]/present` (Presenter Screen addendum) —
 * trainer-facing projector screen, reusing `HostShell`/`GameQRCode`/
 * `CopyJoinLinkButton` from Live Quiz's Host Lobby (all mode-agnostic —
 * plain props, no Live Quiz-specific logic inside them) rather than building
 * a second QR/shell architecture. Deliberately at `/assessments/...`
 * (trainer namespace, matching `/assessments/[assessmentId]` edit), never
 * `/assessment/...` (the participant take-flow namespace) — see the route
 * file for why this still gets a full-bleed layout despite living under the
 * same URL prefix as the trainer's `(trainer)` group.
 *
 * Layout is QR-beside-content (mirrors `HostLobbyPanel`'s side-by-side
 * pattern) specifically to fit 1366×768 without vertical scrolling — a
 * fully stacked layout doesn't fit that viewport height.
 *
 * Timing (§9): there is no backend shared-session timing yet, so this mocks
 * "session start" as a local, presenter-initiated timestamp (`Bắt đầu đếm
 * giờ`) rather than faking API polling. `expiresAt` is derived exactly the
 * way `useAssessmentAttempt` derives it for participants (`startedAt +
 * timeLimitMinutes`), then fed into the same `useAssessmentTimer` hook — so
 * swapping this local timestamp for a real backend-provided `expiresAt`
 * later is a one-line change, not an architecture change (§10).
 */
export function AssessmentPresent({ assessment }: { assessment: Assessment }) {
  const [assessmentUrl, setAssessmentUrl] = useState(`/assessment/${assessment.id}/start`);
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null);

  useEffect(() => {
    // window.location.origin only exists after mount (no window during SSR).
    // Seeding state with the relative path keeps the first client render
    // identical to the server-rendered HTML, avoiding a hydration mismatch
    // (same pattern as HostLobbyPanel).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAssessmentUrl(`${window.location.origin}/assessment/${assessment.id}/start`);
  }, [assessment.id]);

  const hasTimeLimit = assessment.settings.timeLimitMinutes !== null;

  const expiresAt = useMemo(() => {
    if (!sessionStartedAt || assessment.settings.timeLimitMinutes === null) return null;
    return new Date(
      new Date(sessionStartedAt).getTime() + assessment.settings.timeLimitMinutes * 60_000
    ).toISOString();
  }, [sessionStartedAt, assessment.settings.timeLimitMinutes]);

  const timer = useAssessmentTimer(expiresAt);

  const companyName = assessment.companyName?.trim();
  const scoredCount = getScoredQuestions(assessment.questions).length;
  const totalPoints = getTotalPoints(assessment.questions);
  const passRate = getEquivalentPassRate(assessment.settings.minimumPassingPoints, totalPoints);

  return (
    <HostShell>
      <div className="flex flex-1 flex-col gap-6">
        <p className="text-center font-heading text-base font-bold text-white">RayCert</p>

        <div className="flex flex-1 flex-col items-center justify-center gap-10 sm:flex-row sm:gap-16">
          <div className="flex flex-col items-center gap-2.5">
            <GameQRCode
              url={assessmentUrl}
              size={240}
              title={`Mã QR để bắt đầu làm bài ${assessment.title || "Post-test"}`}
            />
            <p className="text-[15px] font-medium text-white/80">Quét mã QR để bắt đầu làm bài</p>
            <p className="max-w-64 truncate text-[11px] text-white/50">{assessmentUrl}</p>
            <CopyJoinLinkButton url={assessmentUrl} label="Copy Link" />
          </div>

          <div className="flex max-w-md flex-col items-center gap-3.5 text-center">
            {assessment.bannerImageUrl ? (
              <div className="w-full max-w-56">
                <AssessmentBanner
                  imageUrl={assessment.bannerImageUrl}
                  imageAlt={assessment.bannerFileName}
                />
              </div>
            ) : null}

            <h1 className="font-heading text-[26px] font-bold text-white">
              {assessment.title || "Untitled Post-test"}
            </h1>
            {companyName ? <p className="text-base font-semibold text-white/80">{companyName}</p> : null}

            <div className="grid w-full grid-cols-2 gap-2.5">
              <StatCard label="Câu hỏi" value={scoredCount} />
              <StatCard label="Tổng điểm" value={totalPoints} />
              <StatCard
                label={`Điểm đạt${passRate !== null ? ` (${passRate}%)` : ""}`}
                value={assessment.settings.minimumPassingPoints}
              />
              <StatCard
                label="Thời gian làm bài"
                value={hasTimeLimit ? `${assessment.settings.timeLimitMinutes} phút` : "Không giới hạn"}
              />
            </div>

            {hasTimeLimit ? <AssessmentCountdown timer={timer} mode="presenter" /> : null}

            {hasTimeLimit && !sessionStartedAt ? (
              <Button size="lg" onClick={() => setSessionStartedAt(new Date().toISOString())}>
                Bắt đầu đếm giờ
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </HostShell>
  );
}
