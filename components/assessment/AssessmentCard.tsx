"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CopyIcon, MonitorPlayIcon, MoreHorizontalIcon } from "lucide-react";
import { toast } from "sonner";
import type { Assessment } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getEquivalentPassRate, getTotalPoints } from "@/lib/validation/assessment";
import { duplicateAssessmentAction } from "@/app/(trainer)/assessments/actions";
import { AssessmentStatusBadge } from "./AssessmentStatusBadge";
import { AssessmentPreviewDialog } from "./AssessmentPreviewDialog";

export function AssessmentCard({ assessment }: { assessment: Assessment }) {
  const router = useRouter();
  const [previewOpen, setPreviewOpen] = useState(false);
  const totalPoints = getTotalPoints(assessment.questions);
  const passRate = getEquivalentPassRate(assessment.settings.minimumPassingPoints, totalPoints);
  const companyName = assessment.companyName?.trim();

  async function handleCopyLink() {
    const url = `${window.location.origin}/assessment/${assessment.id}/start`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Đã sao chép liên kết làm bài");
    } catch {
      toast.error("Không thể sao chép liên kết");
    }
  }

  async function handleDuplicate() {
    const result = await duplicateAssessmentAction(assessment.id);
    if ("error" in result) {
      toast.error("Không thể sao chép Assessment");
      return;
    }
    toast.success(`Đã sao chép Assessment: "${result.title}"`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-heading">
            {assessment.title || "Untitled Post-test"}
          </p>
          {companyName ? (
            <p className="truncate text-[12.5px] font-semibold text-brand-700">{companyName}</p>
          ) : null}
          {assessment.description ? (
            <p className="text-[12.5px] text-muted-foreground">{assessment.description}</p>
          ) : null}
        </div>
        <AssessmentStatusBadge status={assessment.status} />
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-[12.5px] text-muted-foreground">
        <span>
          <span className="font-semibold text-heading">{assessment.questions.length}</span> câu hỏi
        </span>
        <span>
          Tổng điểm: <span className="font-semibold text-heading">{totalPoints}</span>
        </span>
        <span>
          Điểm đạt:{" "}
          <span className="font-semibold text-heading">{assessment.settings.minimumPassingPoints}</span>
        </span>
        <span>
          Tương đương:{" "}
          <span className="font-semibold text-heading">
            {passRate !== null ? `${passRate}%` : "—"}
          </span>
        </span>
        <span>
          Time limit:{" "}
          <span className="font-semibold text-heading">
            {assessment.settings.timeLimitMinutes !== null
              ? `${assessment.settings.timeLimitMinutes} phút`
              : "Không giới hạn"}
          </span>
        </span>
        <span>
          Attempts: <span className="font-semibold text-heading">{assessment.settings.maxAttempts}</span>
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" asChild>
          <Link href={`/assessments/${assessment.id}`}>Edit</Link>
        </Button>
        <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
          Preview
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopyLink}>
          <CopyIcon />
          Copy Link
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/assessments/${assessment.id}/present`} target="_blank" rel="noopener noreferrer">
            <MonitorPlayIcon />
            Present
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={`Thêm hành động cho ${assessment.title || "Untitled Post-test"}`}
            >
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDuplicate}>Duplicate</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AssessmentPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} assessment={assessment} />
    </div>
  );
}
