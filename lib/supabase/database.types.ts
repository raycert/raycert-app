/**
 * PARTIAL PLACEHOLDER — not the real generated types yet (Phase 10A §22).
 *
 * Hand-typed tables below (matching
 * `supabase/migrations/20260910000000_initial_schema.sql` exactly) because
 * real code needs to query them and a fully-empty placeholder (`Tables:
 * Record<string, never>`) makes every table resolve to `never`, which
 * doesn't compile. `profiles` was added in Phase 10B; `quizzes`/`questions`/
 * `answer_options`/`assessments`/`assessment_questions`/
 * `assessment_answer_options` added in Phase 10C for `lib/data/quizzes.ts`/
 * `lib/data/assessments.ts`. Every other table (`assessment_attempts`,
 * `assessment_answers`, `game_sessions`, `participants`,
 * `participant_answers`) is still the empty placeholder — add more by hand
 * here ONLY if/when real code needs to query them, and keep each one in
 * sync with its migration by hand until the CLI is available.
 *
 * To generate the real, complete file (replacing every hand-typed table
 * here):
 *
 *   pnpm db:types
 *
 * (defined in package.json as `supabase gen types typescript --project-id
 * <your-project-ref> > lib/supabase/database.types.ts` — requires the
 * Supabase CLI; see docs/backend/SUPABASE_SETUP.md for the project-id and
 * a login step).
 *
 * Database types are intentionally kept separate from the frontend/domain
 * types in `types/index.ts` (Phase 10A §22) — column names are snake_case
 * and enum values differ in a few places (documented in
 * `lib/supabase/mappers/`). Nothing in `types/index.ts` imports from here,
 * and nothing here imports from there.
 */

// `type` object literals, not `interface` — the real `supabase gen types`
// output uses inline object literals, and `interface` here is not just a
// style deviation: it breaks `.update()`'s generic inference deep inside
// `@supabase/postgrest-js`'s conditional types (confirmed empirically —
// switching these three from `interface` to `type` was the fix in Phase
// 10B). Keep this as `type` if you ever hand-add another table here.
type ProfilesRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: string;
  created_at: string;
  updated_at: string;
};

type ProfilesInsert = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  role?: string;
  created_at?: string;
  updated_at?: string;
};

type ProfilesUpdate = Partial<ProfilesInsert>;

type QuizStatusEnum = "DRAFT" | "PUBLISHED";

type QuizzesRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  status: QuizStatusEnum;
  created_at: string;
  updated_at: string;
};

type QuizzesInsert = {
  id?: string;
  owner_id: string;
  title: string;
  description?: string | null;
  status?: QuizStatusEnum;
  created_at?: string;
  updated_at?: string;
};

type QuizzesUpdate = Partial<QuizzesInsert>;

type QuestionTypeEnum = "QUIZ" | "POLL";

type QuestionsRow = {
  id: string;
  quiz_id: string;
  question_type: QuestionTypeEnum;
  question_text: string;
  image_url: string | null;
  time_limit_seconds: number | null;
  base_points: number;
  display_order: number;
  created_at: string;
  updated_at: string;
};

type QuestionsInsert = {
  id?: string;
  quiz_id: string;
  question_type: QuestionTypeEnum;
  question_text: string;
  image_url?: string | null;
  time_limit_seconds?: number | null;
  base_points?: number;
  display_order: number;
  created_at?: string;
  updated_at?: string;
};

type QuestionsUpdate = Partial<QuestionsInsert>;

type AnswerOptionsRow = {
  id: string;
  question_id: string;
  option_text: string;
  display_order: number;
  is_correct: boolean;
  created_at: string;
};

type AnswerOptionsInsert = {
  id?: string;
  question_id: string;
  option_text: string;
  display_order: number;
  is_correct?: boolean;
  created_at?: string;
};

type AnswerOptionsUpdate = Partial<AnswerOptionsInsert>;

type AssessmentStatusEnum = "DRAFT" | "ACTIVE" | "INACTIVE";

type AssessmentsRow = {
  id: string;
  owner_id: string;
  title: string;
  company_name: string | null;
  description: string | null;
  banner_image_url: string | null;
  minimum_passing_points: number;
  max_attempts: number;
  time_limit_minutes: number | null;
  randomize_questions: boolean;
  randomize_answers: boolean;
  show_correct_answers_after_submit: boolean;
  status: AssessmentStatusEnum;
  created_at: string;
  updated_at: string;
};

type AssessmentsInsert = {
  id?: string;
  owner_id: string;
  title: string;
  company_name?: string | null;
  description?: string | null;
  banner_image_url?: string | null;
  minimum_passing_points: number;
  max_attempts?: number;
  time_limit_minutes?: number | null;
  randomize_questions?: boolean;
  randomize_answers?: boolean;
  show_correct_answers_after_submit?: boolean;
  status?: AssessmentStatusEnum;
  created_at?: string;
  updated_at?: string;
};

type AssessmentsUpdate = Partial<AssessmentsInsert>;

type AssessmentQuestionsRow = {
  id: string;
  assessment_id: string;
  question_type: QuestionTypeEnum;
  question_text: string;
  image_url: string | null;
  points: number;
  display_order: number;
  created_at: string;
};

type AssessmentQuestionsInsert = {
  id?: string;
  assessment_id: string;
  question_type: QuestionTypeEnum;
  question_text: string;
  image_url?: string | null;
  points?: number;
  display_order: number;
  created_at?: string;
};

type AssessmentQuestionsUpdate = Partial<AssessmentQuestionsInsert>;

type AssessmentAnswerOptionsRow = {
  id: string;
  assessment_question_id: string;
  option_text: string;
  display_order: number;
  is_correct: boolean;
  created_at: string;
};

type AssessmentAnswerOptionsInsert = {
  id?: string;
  assessment_question_id: string;
  option_text: string;
  display_order: number;
  is_correct?: boolean;
  created_at?: string;
};

type AssessmentAnswerOptionsUpdate = Partial<AssessmentAnswerOptionsInsert>;

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      profiles: {
        Row: ProfilesRow;
        Insert: ProfilesInsert;
        Update: ProfilesUpdate;
        Relationships: [];
      };
      quizzes: {
        Row: QuizzesRow;
        Insert: QuizzesInsert;
        Update: QuizzesUpdate;
        Relationships: [];
      };
      questions: {
        Row: QuestionsRow;
        Insert: QuestionsInsert;
        Update: QuestionsUpdate;
        Relationships: [];
      };
      answer_options: {
        Row: AnswerOptionsRow;
        Insert: AnswerOptionsInsert;
        Update: AnswerOptionsUpdate;
        Relationships: [];
      };
      assessments: {
        Row: AssessmentsRow;
        Insert: AssessmentsInsert;
        Update: AssessmentsUpdate;
        Relationships: [];
      };
      assessment_questions: {
        Row: AssessmentQuestionsRow;
        Insert: AssessmentQuestionsInsert;
        Update: AssessmentQuestionsUpdate;
        Relationships: [];
      };
      assessment_answer_options: {
        Row: AssessmentAnswerOptionsRow;
        Insert: AssessmentAnswerOptionsInsert;
        Update: AssessmentAnswerOptionsUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
