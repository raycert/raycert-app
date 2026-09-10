import type { Assessment, Question } from "@/types";
import { mockQuizzes } from "./quizzes";

/**
 * Post-test mocks (Phase 9A, points-per-question addendum) — cloned from the
 * `Question[]` already seeded for Live Quiz (mocks/quizzes.ts) so Assessment
 * and Quiz share question text/options (ROADMAP_ASSESSMENT.md §2), but each
 * clone gets its own low-integer `points` value on the Post-test scale, not
 * Live Quiz's 1000-point base (CLAUDE.md §10 vs. this addendum §11). Genuine
 * clones, not shared references — editing one mode's mock data can never
 * mutate the other's.
 */

const complianceQuiz = mockQuizzes.find((q) => q.id === "quiz-compliance")!; // 6 QUIZ, no POLL
const onboardingQuiz = mockQuizzes.find((q) => q.id === "quiz-onboarding")!; // 8 QUIZ + 2 POLL

/** Assigns `pointsByScoredIndex[i]` to the i-th QUIZ question in `questions`
 * (in existing order); POLL questions are cloned unchanged (no points field). */
function withAssessmentPoints(questions: Question[], pointsByScoredIndex: number[]): Question[] {
  let scoredIndex = 0;
  return questions.map((q) => {
    if (q.type !== "QUIZ") return { ...q };
    const points = pointsByScoredIndex[scoredIndex] ?? 1;
    scoredIndex++;
    return { ...q, points };
  });
}

/** First QUIZ question gets a sample image — exercises the take-flow's
 * Question text → Image → Answer options layout (Phase 9C §14); every other
 * mock question stays image-free to exercise the no-image layout too. */
function withSampleImage(questions: Question[]): Question[] {
  let patched = false;
  return questions.map((q) => {
    if (patched || q.type !== "QUIZ") return q;
    patched = true;
    return { ...q, imageUrl: "/mock/sample-question.svg", imageFileName: "sample-question.svg" };
  });
}

function buildSeedAssessments(): Assessment[] {
  return [
    {
      id: "assessment-compliance-cert",
      title: "Compliance Certification Test",
      // Deliberately padded with whitespace — exercises the trim-at-render
      // rule (Company Name addendum §1) end-to-end on List/Presenter/Start.
      // assessment-onboarding-check has no companyName, exercising the
      // "absent -> no row at all" rule.
      companyName: "  Công ty TNHH ABC  ",
      description: "Bài kiểm tra bắt buộc sau khi hoàn thành khoá Compliance Refresher.",
      questions: withSampleImage(withAssessmentPoints(complianceQuiz.questions, [2, 2, 3, 3, 4, 6])), // totalPoints = 20
      settings: {
        minimumPassingPoints: 14, // 70%
        maxAttempts: 2,
        timeLimitMinutes: 15,
        randomizeQuestions: true,
        randomizeAnswers: false,
        showCorrectAnswersAfterSubmit: true,
      },
      status: "active",
      createdAt: "2026-08-26T03:00:00.000Z",
      updatedAt: "2026-08-26T03:00:00.000Z",
      // Exercises "start screen uses the configured banner" end-to-end (the
      // fallback path is exercised separately — any bannerless assessment, or
      // a fresh /assessments/new draft, hits the same AssessmentBanner code).
      bannerImageUrl: "/mock/sample-question.svg",
      bannerFileName: "compliance-cert-banner.svg",
    },
    {
      id: "assessment-onboarding-check",
      title: "Onboarding Knowledge Check",
      description:
        "Kiểm tra kiến thức sau buổi onboarding — bộ câu hỏi có cả câu khảo sát (POLL), không tính điểm.",
      questions: withAssessmentPoints(onboardingQuiz.questions, [1, 2, 2, 3, 3, 4, 4, 6]), // totalPoints = 25
      settings: {
        minimumPassingPoints: 18, // 72%
        maxAttempts: 1,
        timeLimitMinutes: null,
        randomizeQuestions: false,
        randomizeAnswers: true,
        showCorrectAnswersAfterSubmit: false,
      },
      status: "inactive",
      createdAt: "2026-09-03T08:00:00.000Z",
      updatedAt: "2026-09-04T10:30:00.000Z",
    },
  ];
}

// Next.js compiles Server Components and Server Actions into separate
// module graphs ("layers") — a plain `export const mockAssessments = [...]`
// ends up as two independent array instances, so a mutation made inside a
// Server Action (Duplicate, addendum §7-16) would be invisible to the
// Server Component rendering `/assessments`, even though both run in the
// same Node process (verified empirically: each layer logged a different
// `mockAssessments.length` after a duplicate). Stashing the array on
// `globalThis` sidesteps this — `globalThis` is one real shared object for
// the whole process, so every layer's copy of this module resolves to the
// same array reference.
declare global {
  var __raycertMockAssessments: Assessment[] | undefined;
}

function getAssessmentsStore(): Assessment[] {
  globalThis.__raycertMockAssessments ??= buildSeedAssessments();
  return globalThis.__raycertMockAssessments;
}

export const mockAssessments: Assessment[] = getAssessmentsStore();

export function getAssessment(assessmentId: string): Assessment | undefined {
  return mockAssessments.find((a) => a.id === assessmentId);
}

/**
 * Inserts a new Assessment into the shared mock store (Duplicate, Company
 * Name + Duplicate addendum §7-16) so `getAssessment`/`mockAssessments`
 * reflect it immediately — including for the trainer's next navigation to
 * `/assessments/[id]` or `/assessments/[id]/present`. Only ever called from
 * a Server Action (`app/(trainer)/assessments/actions.ts`), never from
 * client code — a "use client" bundle runs in the browser and never shares
 * memory with the server's copy of this module. Not real persistence — a
 * server restart resets it, matching every other mock write in this app
 * (e.g. the Assessment Editor's "Save & Close" never persists at all).
 */
export function addMockAssessment(assessment: Assessment): void {
  mockAssessments.unshift(assessment);
}
