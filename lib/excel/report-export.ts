import type { SessionReport } from "@/mocks/reports";

/**
 * Client-side Excel export for the Game Report (Phase 8) — mirrors the
 * exceljs pattern in `lib/excel/template.ts`. Frontend-only: no backend
 * generation, just a workbook built from the mock report already in memory.
 */

export function reportExportFilename(report: SessionReport): string {
  const safeTitle = report.overview.quizTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return `raycert-report-${safeTitle}-${report.overview.sessionId}.xlsx`;
}

export async function generateReportExportBlob(report: SessionReport): Promise<Blob> {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();

  const overviewSheet = workbook.addWorksheet("Overview");
  overviewSheet.columns = [
    { header: "Metric", key: "metric", width: 28 },
    { header: "Value", key: "value", width: 24 },
  ];
  overviewSheet.getRow(1).font = { bold: true };
  const o = report.overview;
  [
    ["Quiz", o.quizTitle],
    ["Session date", new Date(o.hostedAt).toLocaleString("vi-VN")],
    ["Host", o.hostName],
    ["Participants", o.totalParticipants],
    ["Total questions", o.totalQuestions],
    ["QUIZ questions", o.quizCount],
    ["POLL questions", o.pollCount],
    ["Average score (QUIZ only)", o.averageScore ?? "—"],
    ["Average correct rate (QUIZ only)", o.averageCorrectRate !== null ? `${o.averageCorrectRate}%` : "—"],
    ["Highest score", o.highestScore ?? "—"],
    ["Lowest score", o.lowestScore ?? "—"],
    ["Average response time (ms)", o.averageResponseMs ?? "—"],
  ].forEach(([metric, value]) => overviewSheet.addRow({ metric, value }));

  const participantsSheet = workbook.addWorksheet("Participant Results");
  participantsSheet.columns = [
    { header: "Rank", key: "rank", width: 8 },
    { header: "Nickname", key: "nickname", width: 22 },
    { header: "Total Score", key: "score", width: 14 },
    { header: "Correct", key: "correct", width: 10 },
    { header: "Incorrect", key: "incorrect", width: 10 },
    { header: "Unanswered", key: "unanswered", width: 12 },
    { header: "Avg Response (ms)", key: "avgResponse", width: 18 },
  ];
  participantsSheet.getRow(1).font = { bold: true };
  report.participantResults.forEach((p) => {
    participantsSheet.addRow({
      rank: p.rank ?? "—",
      nickname: p.nickname,
      score: p.totalScore ?? "—",
      correct: p.correctCount,
      incorrect: p.incorrectCount,
      unanswered: p.unansweredCount,
      avgResponse: p.averageResponseMs ?? "—",
    });
  });

  const questionsSheet = workbook.addWorksheet("Question Analytics");
  questionsSheet.columns = [
    { header: "#", key: "order", width: 6 },
    { header: "Type", key: "type", width: 8 },
    { header: "Question", key: "question", width: 42 },
    { header: "Correct Answer", key: "correctAnswer", width: 16 },
    { header: "Correct %", key: "correctPercent", width: 12 },
    { header: "Response Count", key: "responseCount", width: 16 },
    { header: "Unanswered", key: "unanswered", width: 12 },
    { header: "Avg Response (ms)", key: "avgResponse", width: 18 },
    { header: "Knowledge Gap", key: "gap", width: 14 },
    { header: "Option Distribution", key: "distribution", width: 60 },
  ];
  questionsSheet.getRow(1).font = { bold: true };
  report.questionAnalytics.forEach((q) => {
    const distribution = q.distribution
      .map((d) => `${d.label}) ${d.text}: ${d.count} (${d.percent}%)`)
      .join(" | ");
    if (q.type === "QUIZ") {
      questionsSheet.addRow({
        order: q.order,
        type: q.type,
        question: q.questionText,
        correctAnswer: `${q.correctOptionLabel}) ${q.correctOptionText}`,
        correctPercent: `${q.correctPercent}%`,
        responseCount: q.responseCount,
        unanswered: q.unansweredCount,
        avgResponse: q.averageResponseMs,
        gap: q.isKnowledgeGap ? "Yes" : "No",
        distribution,
      });
    } else {
      questionsSheet.addRow({
        order: q.order,
        type: q.type,
        question: q.questionText,
        correctAnswer: "—",
        correctPercent: "—",
        responseCount: q.responseCount,
        unanswered: "—",
        avgResponse: "—",
        gap: "—",
        distribution,
      });
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
