import type { Question, QuestionType } from "@/types";
import { mockQuizzes } from "./quizzes";
import { mockParticipants } from "./session";
import { calculateMockQuizPoints } from "@/lib/game/scoring";

/**
 * Report-only shapes (not part of the frozen domain types, §5 of the
 * handoff) — these back the Results Dashboard + Game Report screens
 * (Milestone 8 / Phase 8). `mockParticipants` is already sorted best→worst
 * by `totalScore` (Phase 1) — reused directly below as a stable "skill
 * order" so higher performers land in the "correct" bucket more often
 * without any Math.random() (keeps this hydration-safe).
 */

export interface QuestionOptionStat {
  optionId: string;
  label: string;
  text: string;
  count: number;
  percent: number;
  isCorrect?: boolean; // QUIZ only
}

export interface QuizQuestionAnalytics {
  questionId: string;
  type: "QUIZ";
  order: number;
  questionText: string;
  correctOptionLabel: string;
  correctOptionText: string;
  responseCount: number;
  unansweredCount: number;
  correctPercent: number;
  incorrectPercent: number;
  distribution: QuestionOptionStat[];
  averageResponseMs: number;
  isKnowledgeGap: boolean; // correctPercent < 70
}

export interface PollQuestionAnalytics {
  questionId: string;
  type: "POLL";
  order: number;
  questionText: string;
  responseCount: number;
  totalVoters: number;
  distribution: QuestionOptionStat[];
}

export type QuestionAnalytics = QuizQuestionAnalytics | PollQuestionAnalytics;

export interface ParticipantResultRow {
  participantId: string;
  nickname: string;
  rank: number | null; // null when the session has no QUIZ questions at all
  totalScore: number | null;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  averageResponseMs: number | null;
}

export interface ParticipantQuestionResponse {
  questionId: string;
  order: number;
  questionText: string;
  type: QuestionType;
  selectedOptionLabel: string | null; // null = unanswered
  selectedOptionText: string | null;
  isCorrect: boolean | null; // QUIZ only — null for POLL or unanswered
  pointsAwarded: number | null; // QUIZ only
  responseMs: number | null;
}

export interface ParticipantDetail {
  participantId: string;
  nickname: string;
  rank: number | null;
  totalScore: number | null;
  responses: ParticipantQuestionResponse[];
}

export interface SessionReportOverview {
  sessionId: string;
  quizTitle: string;
  hostedAt: string; // ISO
  hostName: string;
  totalParticipants: number;
  totalQuestions: number;
  quizCount: number;
  pollCount: number;
  // QUIZ-only — never blended with POLL. null when the session is all-POLL.
  averageScore: number | null;
  averageCorrectRate: number | null;
  highestScore: number | null;
  lowestScore: number | null;
  averageResponseMs: number | null;
}

export interface CompletedSessionSummary {
  sessionId: string;
  quizTitle: string;
  hostedAt: string;
  participantCount: number;
  questionCount: number;
  quizCount: number;
  pollCount: number;
  completionStatus: "completed";
}

export interface SessionReport {
  overview: SessionReportOverview;
  questionAnalytics: QuestionAnalytics[];
  participantResults: ParticipantResultRow[];
  participantDetails: Record<string, ParticipantDetail>;
  knowledgeGaps: QuizQuestionAnalytics[];
}

// --- deterministic generation helpers -------------------------------------

const ROSTER = mockParticipants; // index 0 = best skill (highest totalScore) .. 11 = worst

/** Deterministic "who did well on this particular question" score — mostly
 * skill-driven, with a small per-question jitter so the same top performer
 * doesn't ace literally every single question. */
function combinedScore(participantIndex: number, questionSeed: number): number {
  const skill = 1 - participantIndex / (ROSTER.length - 1); // 1 (best) .. 0 (worst)
  const jitter = ((participantIndex * 7 + questionSeed * 13) % ROSTER.length) / ROSTER.length;
  return skill * 0.75 + jitter * 0.25;
}

function responseMsFor(participantIndex: number, questionSeed: number, timerSeconds: number): number {
  const ceiling = Math.max(4000, timerSeconds * 1000 - 1500);
  return 1200 + ((participantIndex * 260 + questionSeed * 173) % ceiling);
}

interface QuizAnswerPlan {
  participantId: string;
  optionId: string;
  isCorrect: boolean;
  responseMs: number | null;
}

function planQuizAnswers(
  question: Question,
  order: number,
  correctCount: number,
  unansweredCount: number
): QuizAnswerPlan[] {
  const correctOption = question.options.find((o) => o.isCorrect)!;
  const wrongOptions = question.options.filter((o) => o.id !== correctOption.id);

  const byScore = ROSTER.map((p, i) => ({ participant: p, score: combinedScore(i, order), index: i })).sort(
    (a, b) => b.score - a.score
  );

  const correctIds = new Set(byScore.slice(0, correctCount).map((r) => r.participant.id));
  const unansweredIds = new Set(
    byScore
      .slice(byScore.length - unansweredCount)
      .map((r) => r.participant.id)
  );

  return byScore.map(({ participant, index }) => {
    if (unansweredIds.has(participant.id)) {
      return { participantId: participant.id, optionId: "", isCorrect: false, responseMs: null };
    }
    if (correctIds.has(participant.id)) {
      return {
        participantId: participant.id,
        optionId: correctOption.id,
        isCorrect: true,
        responseMs: responseMsFor(index, order, question.timerSeconds),
      };
    }
    const wrong = wrongOptions[index % wrongOptions.length];
    return {
      participantId: participant.id,
      optionId: wrong.id,
      isCorrect: false,
      responseMs: responseMsFor(index, order, question.timerSeconds),
    };
  });
}

interface PollAnswerPlan {
  participantId: string;
  optionId: string | null; // null = did not vote
}

/** `voteCounts` must sum to <= roster length; the remainder didn't vote. */
function planPollAnswers(question: Question, order: number, voteCounts: number[]): PollAnswerPlan[] {
  const byScore = ROSTER.map((p, i) => ({ participant: p, score: combinedScore(i, order + 100) })).sort(
    (a, b) => b.score - a.score
  );

  const plan: PollAnswerPlan[] = [];
  let cursor = 0;
  question.options.forEach((option, i) => {
    const count = voteCounts[i] ?? 0;
    for (let n = 0; n < count; n++) {
      plan.push({ participantId: byScore[cursor].participant.id, optionId: option.id });
      cursor++;
    }
  });
  while (cursor < byScore.length) {
    plan.push({ participantId: byScore[cursor].participant.id, optionId: null });
    cursor++;
  }
  return plan;
}

function round(n: number): number {
  return Math.round(n);
}

// --- session builder --------------------------------------------------------

interface QuizPlanInput {
  correctCount: number;
  unansweredCount: number;
}

function buildSessionReport(params: {
  sessionId: string;
  quizId: string;
  hostedAt: string;
  hostName: string;
  quizAnswerPlans: Record<string, QuizPlanInput>; // keyed by question id
  pollVoteCounts: Record<string, number[]>; // keyed by question id
}): SessionReport {
  const quiz = mockQuizzes.find((q) => q.id === params.quizId)!;
  const sorted = [...quiz.questions].sort((a, b) => a.order - b.order);

  const questionAnalytics: QuestionAnalytics[] = [];
  // participantId -> per-question responses, built up as we go
  const responsesByParticipant: Record<string, ParticipantQuestionResponse[]> = {};
  for (const p of mockParticipants) responsesByParticipant[p.id] = [];

  const scoreByParticipant: Record<string, number> = {};
  const correctByParticipant: Record<string, number> = {};
  const incorrectByParticipant: Record<string, number> = {};
  const unansweredByParticipant: Record<string, number> = {};
  const responseMsListByParticipant: Record<string, number[]> = {};
  for (const p of mockParticipants) {
    scoreByParticipant[p.id] = 0;
    correctByParticipant[p.id] = 0;
    incorrectByParticipant[p.id] = 0;
    unansweredByParticipant[p.id] = 0;
    responseMsListByParticipant[p.id] = [];
  }

  for (const question of sorted) {
    if (question.type === "QUIZ") {
      const plan = params.quizAnswerPlans[question.id];
      const answers = planQuizAnswers(question, question.order, plan.correctCount, plan.unansweredCount);
      const correctOption = question.options.find((o) => o.isCorrect)!;

      const counts = new Map<string, number>(question.options.map((o) => [o.id, 0]));
      let unansweredCount = 0;
      let responseMsSum = 0;
      let responseMsCount = 0;

      for (const answer of answers) {
        const isUnanswered = answer.optionId === "";
        if (isUnanswered) {
          unansweredCount++;
          unansweredByParticipant[answer.participantId]++;
          responsesByParticipant[answer.participantId].push({
            questionId: question.id,
            order: question.order,
            questionText: question.text,
            type: "QUIZ",
            selectedOptionLabel: null,
            selectedOptionText: null,
            isCorrect: null,
            pointsAwarded: 0,
            responseMs: null,
          });
          continue;
        }

        counts.set(answer.optionId, (counts.get(answer.optionId) ?? 0) + 1);
        const option = question.options.find((o) => o.id === answer.optionId)!;
        const points = answer.isCorrect
          ? calculateMockQuizPoints({
              isCorrect: true,
              basePoints: question.points ?? 1000,
              remainingMs: Math.max(0, question.timerSeconds * 1000 - (answer.responseMs ?? 0)),
              totalMs: question.timerSeconds * 1000,
            })
          : 0;

        scoreByParticipant[answer.participantId] += points;
        if (answer.isCorrect) correctByParticipant[answer.participantId]++;
        else incorrectByParticipant[answer.participantId]++;
        if (answer.responseMs !== null) {
          responseMsSum += answer.responseMs;
          responseMsCount++;
          responseMsListByParticipant[answer.participantId].push(answer.responseMs);
        }

        responsesByParticipant[answer.participantId].push({
          questionId: question.id,
          order: question.order,
          questionText: question.text,
          type: "QUIZ",
          selectedOptionLabel: option.label,
          selectedOptionText: option.text,
          isCorrect: answer.isCorrect,
          pointsAwarded: points,
          responseMs: answer.responseMs,
        });
      }

      const responseCount = mockParticipants.length - unansweredCount;
      const correctCount = counts.get(correctOption.id) ?? 0;
      const correctPercent = responseCount > 0 ? round((correctCount / responseCount) * 100) : 0;

      questionAnalytics.push({
        questionId: question.id,
        type: "QUIZ",
        order: question.order,
        questionText: question.text,
        correctOptionLabel: correctOption.label,
        correctOptionText: correctOption.text,
        responseCount,
        unansweredCount,
        correctPercent,
        incorrectPercent: 100 - correctPercent,
        averageResponseMs: responseMsCount > 0 ? round(responseMsSum / responseMsCount) : 0,
        isKnowledgeGap: correctPercent < 70,
        distribution: question.options.map((o) => ({
          optionId: o.id,
          label: o.label,
          text: o.text,
          count: counts.get(o.id) ?? 0,
          percent: responseCount > 0 ? round(((counts.get(o.id) ?? 0) / responseCount) * 100) : 0,
          isCorrect: o.id === correctOption.id,
        })),
      });
    } else {
      const voteCounts = params.pollVoteCounts[question.id] ?? question.options.map(() => 0);
      const plan = planPollAnswers(question, question.order, voteCounts);
      const counts = new Map<string, number>(question.options.map((o) => [o.id, 0]));

      for (const answer of plan) {
        if (answer.optionId === null) {
          responsesByParticipant[answer.participantId].push({
            questionId: question.id,
            order: question.order,
            questionText: question.text,
            type: "POLL",
            selectedOptionLabel: null,
            selectedOptionText: null,
            isCorrect: null,
            pointsAwarded: null,
            responseMs: null,
          });
          continue;
        }
        counts.set(answer.optionId, (counts.get(answer.optionId) ?? 0) + 1);
        const option = question.options.find((o) => o.id === answer.optionId)!;
        responsesByParticipant[answer.participantId].push({
          questionId: question.id,
          order: question.order,
          questionText: question.text,
          type: "POLL",
          selectedOptionLabel: option.label,
          selectedOptionText: option.text,
          isCorrect: null,
          pointsAwarded: null,
          responseMs: null,
        });
      }

      const responseCount = plan.filter((a) => a.optionId !== null).length;
      questionAnalytics.push({
        questionId: question.id,
        type: "POLL",
        order: question.order,
        questionText: question.text,
        responseCount,
        totalVoters: responseCount,
        distribution: question.options.map((o) => ({
          optionId: o.id,
          label: o.label,
          text: o.text,
          count: counts.get(o.id) ?? 0,
          percent: responseCount > 0 ? round(((counts.get(o.id) ?? 0) / responseCount) * 100) : 0,
        })),
      });
    }
  }

  const quizQuestionCount = sorted.filter((q) => q.type === "QUIZ").length;
  const hasQuiz = quizQuestionCount > 0;

  const unrankedRows = mockParticipants.map((p) => ({
    participantId: p.id,
    nickname: p.nickname,
    totalScore: hasQuiz ? scoreByParticipant[p.id] : null,
    correctCount: correctByParticipant[p.id],
    incorrectCount: incorrectByParticipant[p.id],
    unansweredCount: unansweredByParticipant[p.id],
    averageResponseMs:
      responseMsListByParticipant[p.id].length > 0
        ? round(
            responseMsListByParticipant[p.id].reduce((a, b) => a + b, 0) /
              responseMsListByParticipant[p.id].length
          )
        : null,
  }));

  const ranked = hasQuiz
    ? [...unrankedRows].sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0))
    : unrankedRows;

  const participantResults: ParticipantResultRow[] = ranked.map((row, i) => ({
    ...row,
    rank: hasQuiz ? i + 1 : null,
  }));

  const participantDetails: Record<string, ParticipantDetail> = {};
  for (const row of participantResults) {
    participantDetails[row.participantId] = {
      participantId: row.participantId,
      nickname: row.nickname,
      rank: row.rank,
      totalScore: row.totalScore,
      responses: responsesByParticipant[row.participantId].sort((a, b) => a.order - b.order),
    };
  }

  const quizScores = participantResults.map((r) => r.totalScore).filter((s): s is number => s !== null);
  const quizAnalytics = questionAnalytics.filter((q): q is QuizQuestionAnalytics => q.type === "QUIZ");
  const overallResponseMs = quizAnalytics.length > 0
    ? round(quizAnalytics.reduce((a, q) => a + q.averageResponseMs, 0) / quizAnalytics.length)
    : null;

  const overview: SessionReportOverview = {
    sessionId: params.sessionId,
    quizTitle: quiz.title,
    hostedAt: params.hostedAt,
    hostName: params.hostName,
    totalParticipants: mockParticipants.length,
    totalQuestions: sorted.length,
    quizCount: quizQuestionCount,
    pollCount: sorted.length - quizQuestionCount,
    averageScore: hasQuiz && quizScores.length > 0 ? round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length) : null,
    averageCorrectRate:
      hasQuiz && quizAnalytics.length > 0
        ? round(quizAnalytics.reduce((a, q) => a + q.correctPercent, 0) / quizAnalytics.length)
        : null,
    highestScore: hasQuiz && quizScores.length > 0 ? Math.max(...quizScores) : null,
    lowestScore: hasQuiz && quizScores.length > 0 ? Math.min(...quizScores) : null,
    averageResponseMs: overallResponseMs,
  };

  return {
    overview,
    questionAnalytics,
    participantResults,
    participantDetails,
    knowledgeGaps: quizAnalytics.filter((q) => q.isKnowledgeGap),
  };
}

// --- the 3 mock completed sessions ------------------------------------------

const complianceQuiz = mockQuizzes.find((q) => q.id === "quiz-compliance")!; // QUIZ-only, 6 questions
const teamPulseQuiz = mockQuizzes.find((q) => q.id === "quiz-team-pulse")!; // POLL-only, 4 questions
const onboardingQuiz = mockQuizzes.find((q) => q.id === "quiz-onboarding")!; // mixed, 10 questions

const complianceCorrectCounts = [10, 9, 7, 11, 6, 8]; // one clear knowledge gap (Q5, 50%) + two borderline (<70%)
const reportSessionCompliance = buildSessionReport({
  sessionId: "report-compliance",
  quizId: complianceQuiz.id,
  hostedAt: "2026-08-27T02:00:00.000Z",
  hostName: "Ray Nguyen",
  quizAnswerPlans: Object.fromEntries(
    complianceQuiz.questions
      .sort((a, b) => a.order - b.order)
      .map((q, i) => [
        q.id,
        { correctCount: complianceCorrectCounts[i], unansweredCount: i === 2 || i === 4 ? 1 : 0 },
      ])
  ),
  pollVoteCounts: {},
});

const teamPulseVoteCounts: Record<string, number[]> = {
  "tpc-q1": [5, 5, 2],
  "tpc-q2": [4, 5, 2, 1],
  "tpc-q3": [3, 2, 4, 2, 1],
  "tpc-q4": [7, 2, 2],
};
const reportSessionTeamPulse = buildSessionReport({
  sessionId: "report-team-pulse",
  quizId: teamPulseQuiz.id,
  hostedAt: "2026-09-02T07:30:00.000Z",
  hostName: "Ray Nguyen",
  quizAnswerPlans: {},
  pollVoteCounts: teamPulseVoteCounts,
});

const onboardingCorrectCounts: Record<string, number> = {
  "onb-q1": 9,
  "onb-q2": 8, // gap
  "onb-q3": 11,
  "onb-q5": 5, // gap — clearly difficult
  "onb-q6": 10,
  "onb-q7": 7, // gap
  "onb-q9": 9,
  "onb-q10": 12,
};
const onboardingUnanswered: Record<string, number> = {
  "onb-q3": 1,
  "onb-q7": 2,
};
const onboardingPollVotes: Record<string, number[]> = {
  "onb-q4": [5, 4, 3],
  "onb-q8": [3, 4, 3, 2],
};
const reportSessionOnboarding = buildSessionReport({
  sessionId: "report-onboarding",
  quizId: onboardingQuiz.id,
  hostedAt: "2026-09-05T01:00:00.000Z",
  hostName: "Ray Nguyen",
  quizAnswerPlans: Object.fromEntries(
    Object.keys(onboardingCorrectCounts).map((id) => [
      id,
      { correctCount: onboardingCorrectCounts[id], unansweredCount: onboardingUnanswered[id] ?? 0 },
    ])
  ),
  pollVoteCounts: onboardingPollVotes,
});

export const mockSessionReports: Record<string, SessionReport> = {
  [reportSessionCompliance.overview.sessionId]: reportSessionCompliance,
  [reportSessionTeamPulse.overview.sessionId]: reportSessionTeamPulse,
  [reportSessionOnboarding.overview.sessionId]: reportSessionOnboarding,
};

export const mockCompletedSessions: CompletedSessionSummary[] = [
  reportSessionOnboarding,
  reportSessionCompliance,
  reportSessionTeamPulse,
].map((r) => ({
  sessionId: r.overview.sessionId,
  quizTitle: r.overview.quizTitle,
  hostedAt: r.overview.hostedAt,
  participantCount: r.overview.totalParticipants,
  questionCount: r.overview.totalQuestions,
  quizCount: r.overview.quizCount,
  pollCount: r.overview.pollCount,
  completionStatus: "completed",
}));

export function getSessionReport(sessionId: string): SessionReport | undefined {
  return mockSessionReports[sessionId];
}
