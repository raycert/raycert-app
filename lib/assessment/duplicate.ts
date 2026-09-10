import type { AnswerOption, Assessment, Question } from "@/types";

const COPY_ID_SUFFIX = /-copy-\d+$/;
const COPY_TITLE_SUFFIX = /\s-\sCopy(?:\s\d+)?$/;

/** `baseId-copy-1`, `baseId-copy-2`, … — skips any id already taken so
 * duplicating a duplicate never collides (addendum §9, §12/TC23). */
function nextCopyId(baseId: string, existingIds: Set<string>): string {
  let n = 1;
  while (existingIds.has(`${baseId}-copy-${n}`)) n++;
  return `${baseId}-copy-${n}`;
}

function deepCopyOptions(options: AnswerOption[]): AnswerOption[] {
  return options.map((option) => ({ ...option, id: crypto.randomUUID() }));
}

/** New `id` per question/option so editing or deleting anything in the copy
 * can never reach back into the source `Assessment`'s arrays (addendum §8,
 * §12). `isCorrect` travels with its option object, not rebuilt by index, so
 * the correct-answer mapping can't drift when ids change. */
function deepCopyQuestions(questions: Question[]): Question[] {
  return questions.map((question) => ({
    ...question,
    id: crypto.randomUUID(),
    options: deepCopyOptions(question.options),
  }));
}

/**
 * Builds an independent copy of `source` — new id, `" - Copy"` / `" - Copy
 * N"` title, deep-copied questions/options, status forced to `"inactive"`
 * (no Draft status exists on `AssessmentStatus` yet — addendum §11). Never
 * copies attempts/results/runtime timing (there are none on `Assessment`
 * itself to begin with — those live on the separate `AssessmentAttempt`
 * model, so simply not touching that model here is enough to satisfy
 * addendum §8/§16).
 *
 * `bannerImageUrl`/`imageUrl` are carried over as plain string references
 * (spread), never re-uploaded — correct for the static `/mock/*.svg` paths
 * every seeded Assessment currently uses. A `blob:` object URL from a
 * live, unsaved upload would be a genuine limitation (its owning
 * `AssessmentBannerUpload`/`QuestionImageUpload` instance revokes the URL
 * on unmount, which would invalidate this copy's reference too) — not
 * reachable from this addendum's Duplicate entry point (list card, mock
 * data only), but noted per addendum §14 rather than silently assumed safe.
 *
 * Pure — does not touch `mockAssessments`; the caller decides where the
 * result gets stored (see `mocks/assessments.ts`'s `addMockAssessment`).
 */
export function duplicateAssessment(source: Assessment, existingIds: string[]): Assessment {
  const idSet = new Set(existingIds);
  const baseId = source.id.replace(COPY_ID_SUFFIX, "");
  const newId = nextCopyId(baseId, idSet);

  const baseTitle = source.title.replace(COPY_TITLE_SUFFIX, "").trim() || source.title;
  const copyNumber = Number(newId.slice(newId.lastIndexOf("-") + 1));
  const newTitle = copyNumber === 1 ? `${baseTitle} - Copy` : `${baseTitle} - Copy ${copyNumber}`;

  const now = new Date().toISOString();

  return {
    ...source,
    id: newId,
    title: newTitle,
    questions: deepCopyQuestions(source.questions),
    settings: { ...source.settings },
    status: "inactive",
    createdAt: now,
    updatedAt: now,
  };
}
