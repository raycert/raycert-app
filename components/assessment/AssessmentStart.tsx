"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Assessment } from "@/types";
import { Button } from "@/components/ui/button";
import { getEquivalentPassRate, getScoredQuestions, getTotalPoints } from "@/lib/validation/assessment";
import { StudentInformationForm } from "./StudentInformationForm";
import { AssessmentBanner } from "./AssessmentBanner";
import { AssessmentHeader } from "./AssessmentHeader";

const MAX_FIELD_LENGTH = 100;

/** `/assessment/[assessmentId]/start` (Phase 9C §2/§3) — Student Information
 * + assessment overview, gated Start CTA. Navigates to `/take` with
 * `fullName`/`department` as search params (mirrors Live Quiz's `?nickname=`
 * handoff pattern, `app/join/[sessionCode]/page.tsx`). */
export function AssessmentStart({ assessment }: { assessment: Assessment }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [touched, setTouched] = useState(false);

  const trimmedName = fullName.trim();
  const trimmedDept = department.trim();

  const nameError = !touched
    ? undefined
    : trimmedName.length === 0
      ? "Vui lòng nhập họ tên"
      : trimmedName.length > MAX_FIELD_LENGTH
        ? `Họ tên tối đa ${MAX_FIELD_LENGTH} ký tự`
        : undefined;
  const deptError = !touched
    ? undefined
    : trimmedDept.length === 0
      ? "Vui lòng nhập bộ phận"
      : trimmedDept.length > MAX_FIELD_LENGTH
        ? `Bộ phận tối đa ${MAX_FIELD_LENGTH} ký tự`
        : undefined;

  const isValid =
    trimmedName.length > 0 &&
    trimmedName.length <= MAX_FIELD_LENGTH &&
    trimmedDept.length > 0 &&
    trimmedDept.length <= MAX_FIELD_LENGTH;

  const scoredCount = getScoredQuestions(assessment.questions).length;
  const totalPoints = getTotalPoints(assessment.questions);
  const passRate = getEquivalentPassRate(assessment.settings.minimumPassingPoints, totalPoints);

  function handleStart() {
    setTouched(true);
    if (!isValid) return;
    const params = new URLSearchParams({ fullName: trimmedName, department: trimmedDept });
    router.push(`/assessment/${assessment.id}/take?${params.toString()}`);
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-5 py-6">
      <div className="flex flex-col gap-4">
        <AssessmentBanner imageUrl={assessment.bannerImageUrl} imageAlt={assessment.bannerFileName} />
        <AssessmentHeader
          title={assessment.title || "Untitled Post-test"}
          companyName={assessment.companyName}
          description={assessment.description}
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5 rounded-lg bg-surface p-4 text-center">
        <div>
          <p className="font-heading text-lg font-extrabold text-brand-700">{scoredCount}</p>
          <p className="text-[11px] text-muted-foreground">Câu hỏi</p>
        </div>
        <div>
          <p className="font-heading text-lg font-extrabold text-brand-700">{totalPoints}</p>
          <p className="text-[11px] text-muted-foreground">Tổng điểm</p>
        </div>
        <div>
          <p className="font-heading text-lg font-extrabold text-brand-700">
            {assessment.settings.minimumPassingPoints}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Điểm đạt{passRate !== null ? ` (${passRate}%)` : ""}
          </p>
        </div>
        <div>
          <p className="font-heading text-lg font-extrabold text-brand-700">
            {assessment.settings.timeLimitMinutes !== null
              ? `${assessment.settings.timeLimitMinutes} phút`
              : "Không giới hạn"}
          </p>
          <p className="text-[11px] text-muted-foreground">Thời gian làm bài</p>
        </div>
      </div>

      <p className="text-center text-[12.5px] text-muted-foreground">
        Số lần làm cho phép: <span className="font-semibold text-heading">{assessment.settings.maxAttempts}</span>
      </p>

      <StudentInformationForm
        fullName={fullName}
        department={department}
        onFullNameChange={(v) => setFullName(v)}
        onDepartmentChange={(v) => setDepartment(v)}
        errors={{ fullName: nameError, department: deptError }}
      />

      <div className="mt-auto flex flex-col gap-3">
        <p className="text-center text-[11.5px] text-muted-foreground">
          Bài làm tự chấm giờ theo tổng thời gian, không tính giờ theo từng câu. Vui lòng không
          tắt trình duyệt trong khi làm bài.
        </p>
        <Button type="button" size="touch" className="w-full" onClick={handleStart}>
          Bắt đầu làm bài
        </Button>
      </div>
    </div>
  );
}
