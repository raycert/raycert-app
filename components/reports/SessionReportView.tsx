"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ReportSummary } from "@/components/reports/ReportSummary";
import { KnowledgeGapSection } from "@/components/reports/KnowledgeGapSection";
import { QuizQuestionAnalytics } from "@/components/reports/QuizQuestionAnalytics";
import { PollQuestionAnalytics } from "@/components/reports/PollQuestionAnalytics";
import { ParticipantResultsTable } from "@/components/reports/ParticipantResultsTable";
import { ParticipantDetailDialog } from "@/components/reports/ParticipantDetailDialog";
import { ExportReportButton } from "@/components/reports/ExportReportButton";
import type { SessionReport } from "@/mocks/reports";

/** Orchestrator for `/results/[sessionId]` — owns the Participant Detail
 * dialog's open/selected state, everything else is presentational. */
export function SessionReportView({ report }: { report: SessionReport }) {
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);

  const quizAnalytics = report.questionAnalytics.filter((q) => q.type === "QUIZ");
  const pollAnalytics = report.questionAnalytics.filter((q) => q.type === "POLL");
  const selectedDetail = selectedParticipantId
    ? (report.participantDetails[selectedParticipantId] ?? null)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/results">← Quay lại Results</Link>
        </Button>
        <ExportReportButton report={report} />
      </div>

      <Card>
        <CardContent>
          <ReportSummary overview={report.overview} />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <KnowledgeGapSection gaps={report.knowledgeGaps} />
        </CardContent>
      </Card>

      {quizAnalytics.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col gap-3">
            <h2 className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
              QUIZ Analysis
            </h2>
            <div className="flex flex-col gap-3">
              {quizAnalytics.map((analytics) => (
                <QuizQuestionAnalytics key={analytics.questionId} analytics={analytics} />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {pollAnalytics.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col gap-3">
            <h2 className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
              POLL Analysis
            </h2>
            <div className="flex flex-col gap-3">
              {pollAnalytics.map((analytics) => (
                <PollQuestionAnalytics key={analytics.questionId} analytics={analytics} />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="flex flex-col gap-3">
          <h2 className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
            Participant Results
          </h2>
          <ParticipantResultsTable
            rows={report.participantResults}
            hasQuiz={report.overview.quizCount > 0}
            onSelectParticipant={setSelectedParticipantId}
          />
        </CardContent>
      </Card>

      <ParticipantDetailDialog
        detail={selectedDetail}
        open={selectedParticipantId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedParticipantId(null);
        }}
      />
    </div>
  );
}
