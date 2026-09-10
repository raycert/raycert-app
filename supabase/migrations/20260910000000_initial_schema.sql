-- RayCert — Phase 10A: Supabase Backend Foundation + Database Schema
-- Run this once, in full, via the Supabase Dashboard SQL Editor (or `supabase
-- db push` if you have the CLI set up locally) — see docs/backend/SUPABASE_SETUP.md.
--
-- Scope: schema + RLS foundation only. No data migration from the frontend
-- mocks happens here or is triggered by this file — the app keeps running on
-- mock/local state until a later phase wires up real reads/writes
-- (addendum §27).

-- ============================================================================
-- 0. Extensions
-- ============================================================================

-- gen_random_uuid() — Supabase projects have this available by default, but
-- `if not exists` keeps this migration safe to run against a bare Postgres.
create extension if not exists pgcrypto;

-- ============================================================================
-- 1. Enums
-- ============================================================================
-- UPPER_SNAKE_CASE throughout, matching CLAUDE.md's existing game_sessions
-- vocabulary and this phase's own spec text. The current frontend mock uses
-- a different casing/value set in a few places (types/index.ts is NOT
-- changed by this migration) — see lib/supabase/mappers/status.ts for the
-- documented DB <-> frontend mapping, used once a later phase reads real
-- rows.

create type question_type as enum ('QUIZ', 'POLL');

-- Only 'DRAFT'/'PUBLISHED' — the frontend Quiz.status has never had an
-- 'ARCHIVED' state, so this enum doesn't invent one either (addendum §6).
create type quiz_status as enum ('DRAFT', 'PUBLISHED');

-- Includes 'DRAFT' even though the frontend mock's AssessmentStatus only
-- ever reaches active/inactive today (no Draft concept in the Editor UI
-- yet) — addendum §10 lists DRAFT as part of the minimum set, forward-
-- looking for when the Editor gains a real "not yet published" state.
create type assessment_status as enum ('DRAFT', 'ACTIVE', 'INACTIVE');

-- Deliberately NOT 4 values. The frontend's AttemptStatus folds "submitted
-- because the timer expired" into the status itself (a 4th value,
-- "TIMEOUT") — this schema keeps status normalized to these 3 and puts
-- "why" on the separate submission_reason column below (addendum §13's own
-- example list already only shows IN_PROGRESS/SUBMITTED). See
-- lib/supabase/mappers/status.ts for the exact recombination logic.
create type assessment_attempt_status as enum ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED');

create type submission_reason as enum ('MANUAL', 'TIMEOUT');

-- Matches CLAUDE.md §6/§7 exactly. "leaderboard" (a UI phase in the
-- frontend's SessionPhase) is NOT a separate value here — it is a
-- client-side view layered on top of QUESTION_RESULTS, never its own
-- persisted session state (addendum §15's "không over-model" — see
-- docs/backend/SUPABASE_SETUP.md for the full reasoning).
create type game_session_status as enum ('WAITING', 'ACTIVE', 'QUESTION_ACTIVE', 'QUESTION_RESULTS', 'FINISHED');

-- ============================================================================
-- 2. Shared trigger functions
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'BEFORE UPDATE trigger — stamps updated_at = now() so application code never has to remember to.';

-- ============================================================================
-- 3. profiles (AUTH / TRAINER — addendum §5)
-- ============================================================================
-- One row per auth.users row, created by the handle_new_user trigger in
-- §12 below. V1 role is always 'TRAINER' — the check constraint (not an
-- enum) makes it cheap to widen later (e.g. ALTER TABLE ... DROP/ADD
-- CONSTRAINT) without an enum-value migration. Never stores a password —
-- Supabase Auth (auth.users) owns credentials entirely.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name text,
  email text,
  role text not null default 'TRAINER' check (role in ('TRAINER')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'One row per trainer (auth.users row) — created by the on_auth_user_created trigger, never written to directly by the app in Phase 10A (no signup UI yet).';

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 4. QUIZ LIBRARY — quizzes / questions / answer_options (addendum §6-§8)
-- ============================================================================

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  status quiz_status not null default 'DRAFT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_quizzes_updated_at
  before update on public.quizzes
  for each row execute function public.set_updated_at();

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  question_type question_type not null,
  question_text text not null,
  image_url text,
  -- Nullable per addendum §7's field list; the current frontend mock always
  -- sets a value (Question.timerSeconds is non-optional there), but the DB
  -- permits null for a question with no configured timer.
  time_limit_seconds integer,
  base_points integer not null default 0,
  display_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint questions_base_points_by_type check (
    (question_type = 'QUIZ' and base_points > 0) or
    (question_type = 'POLL' and base_points = 0)
  )
);

comment on constraint questions_base_points_by_type on public.questions is
  'CLAUDE.md §2: QUIZ base_points > 0, POLL base_points = 0. "Exactly one correct answer_option for QUIZ" is NOT enforceable with a same-row CHECK (it is a cross-row aggregate over answer_options) and is deliberately left to service/domain-layer validation — see the answer_options table comment and docs/backend/SUPABASE_SETUP.md §6 for why, rather than pretending a DB constraint covers it when it does not (addendum §8).';

create trigger set_questions_updated_at
  before update on public.questions
  for each row execute function public.set_updated_at();

create table public.answer_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  option_text text not null,
  display_order integer not null,
  is_correct boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.answer_options is
  'QUIZ: 2-4 rows per question, exactly 1 with is_correct = true. POLL: 2-6 rows, is_correct always false. Neither "2-4 vs 2-6 option count" nor "exactly one correct for QUIZ" is DB-enforced (both are cross-row constraints spanning this table + the parent question_type) — enforced in the app/service layer today (mirrors the frontend''s existing lib/validation/question.ts), documented here rather than silently assumed (addendum §8).';

-- ============================================================================
-- 5. ASSESSMENT — assessments / assessment_questions / assessment_answer_options
--    (addendum §9-§12)
-- ============================================================================
-- Architecture decision (addendum §11): SNAPSHOT model, not a reference to
-- `questions`. assessment_questions/assessment_answer_options are their own
-- independent tables with their own content — NOT a join table pointing at
-- `questions.id`. Rationale:
--
--   1. The frontend has already committed to this shape: ROADMAP_ASSESSMENT.md
--      §2 states "Assessment giữ bản sao Question[] của riêng nó" (Assessment
--      keeps its own copy of Question[]) — not a reference to a shared Quiz.
--      An Assessment's questions can also be authored directly or imported
--      from Excel with no backing Quiz Library entry at all (Phase 9B), so a
--      NOT NULL `question_id -> questions(id)` FK would not even always have
--      something to point at.
--   2. Safety: if a trainer edits a Quiz Library question after an
--      Assessment (built from it) has gone ACTIVE — or worse, after learners
--      have already attempted it — a reference model would silently change
--      the Assessment's content and could retroactively invalidate scored
--      attempts. A snapshot model makes that structurally impossible: once a
--      row exists in assessment_questions, nothing about editing the
--      original `questions` row can reach it.
--
-- Trade-off, documented rather than hidden: assessment_questions/
-- assessment_answer_options duplicate the shape of questions/answer_options
-- (not the data — every Assessment gets its own physical rows). This is the
-- deliberate cost of assessment history safety, not an oversight. A future
-- phase MAY add an optional `source_question_id uuid references
-- questions(id) on delete set null` purely for "was this imported from the
-- Quiz Library" provenance/UI convenience — not added now since nothing
-- reads it yet (no over-engineering).

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  company_name text,
  description text,
  banner_image_url text,
  minimum_passing_points integer not null check (minimum_passing_points > 0),
  max_attempts integer not null default 1 check (max_attempts >= 1),
  time_limit_minutes integer check (time_limit_minutes is null or time_limit_minutes > 0),
  randomize_questions boolean not null default false,
  randomize_answers boolean not null default false,
  show_correct_answers_after_submit boolean not null default true,
  status assessment_status not null default 'DRAFT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.assessments is
  'A Post-test. Independent runtime from Live Quiz (game_sessions) by design — addendum §9. company_name/description/banner_image_url are all optional, matching the frontend Assessment type.';

create trigger set_assessments_updated_at
  before update on public.assessments
  for each row execute function public.set_updated_at();

create table public.assessment_questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  question_type question_type not null,
  question_text text not null,
  image_url text,
  -- Assessment/Post-test never uses a question-level timer at runtime
  -- (addendum intro, Phase 9C/9D frontend precedent) — there is
  -- deliberately no time_limit_seconds column here, unlike `questions`.
  -- Only QUIZ questions are ever scored (POLL may still appear and is
  -- simply excluded from scoring, same rule as Live Quiz — CLAUDE.md §2).
  points integer not null default 1 check (points > 0),
  display_order integer not null,
  created_at timestamptz not null default now()
);

comment on table public.assessment_questions is
  'Snapshot copy, NOT a reference to questions(id) — see the architecture note above this section. points defaults to 1 (addendum §11/§12 "blank points defaults to 1"); POLL rows never contribute to scoring but points still defaults sanely rather than being nullable.';

create table public.assessment_answer_options (
  id uuid primary key default gen_random_uuid(),
  assessment_question_id uuid not null references public.assessment_questions (id) on delete cascade,
  option_text text not null,
  display_order integer not null,
  is_correct boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.assessment_answer_options is
  'Mirrors answer_options'' shape and the same documented limitation: "2-4/2-6 options" and "exactly one correct for QUIZ" are enforced in the app/service layer, not by a DB constraint (addendum §8''s reasoning applies here too). Added beyond addendum §19''s literal RLS table list because it is a direct consequence of the snapshot-model decision above — see the RLS section.';

-- ============================================================================
-- 6. assessment_attempts / assessment_answers (addendum §13-§14)
-- ============================================================================

create table public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete restrict,
  -- Participant Post-test V1 has no Supabase Auth account (addendum §13) —
  -- full_name/department are the only identity this app has. company_name
  -- is intentionally NOT duplicated here — it lives on assessments and is
  -- read via assessment_id (addendum §13 "Không lưu companyName tại attempt
  -- nếu có thể lấy từ Assessment metadata").
  full_name text not null,
  department text not null,
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  submitted_at timestamptz,
  attempt_number integer not null check (attempt_number >= 1),
  status assessment_attempt_status not null default 'IN_PROGRESS',
  submission_reason submission_reason,
  correct_count integer not null default 0,
  incorrect_count integer not null default 0,
  unanswered_count integer not null default 0,
  earned_points integer not null default 0,
  total_points integer not null,
  score_percent numeric not null default 0,
  passed boolean not null default false,
  created_at timestamptz not null default now(),
  -- Frontend bug-fix precedent (this same conversation, pre-Phase-10A): an
  -- earlier version of the sessionStorage-based attempt-limit check counted
  -- every attempt for an Assessment regardless of who made it, so a second
  -- different person could get silently bounced into the first person's
  -- Result. attempt_number is scoped per-learner the same way here.
  constraint assessment_attempts_unique_number_per_learner
    unique (assessment_id, full_name, department, attempt_number)
);

comment on table public.assessment_attempts is
  'submission_reason is null while IN_PROGRESS, set only once SUBMITTED. total_points/score_percent/passed/*_count are computed once at submit time and never recomputed afterward, even if the Assessment''s assessment_questions later change (addendum §12/§16 — a past attempt''s result must stay immutable).';

comment on constraint assessment_attempts_unique_number_per_learner on public.assessment_attempts is
  'Prevents two concurrent/duplicate attempt rows claiming the same attempt_number for the same learner on the same Assessment — see the frontend bug this mirrors, documented in docs/backend/SUPABASE_SETUP.md.';

create table public.assessment_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.assessment_attempts (id) on delete cascade,
  question_id uuid not null references public.assessment_questions (id) on delete restrict,
  selected_option_id uuid references public.assessment_answer_options (id) on delete restrict,
  answered_at timestamptz,
  -- Null while the attempt is IN_PROGRESS — never revealed to the client
  -- for an active attempt (addendum §14, enforced by RLS/service layer
  -- once attempt-taking is wired to the database, not by this column
  -- alone). Populated once, at submit time, alongside the parent attempt's
  -- own *_count/earned_points.
  is_correct boolean,
  points_earned integer not null default 0,
  unique (attempt_id, question_id)
);

comment on table public.assessment_answers is
  'Unanswered strategy (addendum §14, chosen and documented): ONE row per (attempt, assessment_question) always exists from attempt creation, with selected_option_id = null meaning unanswered — never "no row" — matching the frontend''s useAssessmentAttempt, which pre-creates one AssessmentAnswer per scored question at attempt start. A missing row is therefore never a valid "unanswered" representation and should be treated as a data bug if seen.';

-- ============================================================================
-- 7. LIVE GAME — game_sessions / participants / participant_answers
--    (addendum §15-§17, matches CLAUDE.md §6)
-- ============================================================================

create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete restrict,
  host_id uuid not null references public.profiles (id) on delete cascade,
  game_pin text not null unique,
  status game_session_status not null default 'WAITING',
  current_question_index integer not null default 0,
  current_question_started_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  constraint game_sessions_pin_is_6_digits check (game_pin ~ '^[0-9]{6}$')
);

comment on table public.game_sessions is
  'status has no separate LEADERBOARD value — see the game_session_status enum comment. quiz_id is ON DELETE RESTRICT (not CASCADE) so a Quiz with session/report history cannot be silently deleted out from under past Reports.';

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  game_session_id uuid not null references public.game_sessions (id) on delete cascade,
  nickname text not null,
  participant_token text not null default gen_random_uuid()::text unique,
  score integer not null default 0,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz,
  unique (game_session_id, nickname)
);

comment on table public.participants is
  'No Supabase Auth account (CLAUDE.md §3). participant_token is a random UUID string, globally unique, used to re-identify this participant''s browser within the session (e.g. on reconnect) — it carries no server secret and is safe to hold client-side.';

create table public.participant_answers (
  id uuid primary key default gen_random_uuid(),
  game_session_id uuid not null references public.game_sessions (id) on delete cascade,
  participant_id uuid not null references public.participants (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete restrict,
  answer_option_id uuid not null references public.answer_options (id) on delete restrict,
  submitted_at timestamptz not null default now(),
  response_ms integer,
  is_correct boolean,
  points_awarded integer not null default 0,
  unique (participant_id, question_id)
);

comment on table public.participant_answers is
  'Strategy (addendum §17, documented): QUIZ — is_correct/points_awarded are authoritative only once computed server-side (future realtime phase); is_correct starts null until scored. POLL — is_correct is always null (there is no correct answer to be right or wrong about) and points_awarded stays 0. question_id/answer_option_id are ON DELETE RESTRICT so a played Quiz''s questions cannot be deleted out from under historical report data — see questions_base_points_by_type''s sibling reasoning.';

-- ============================================================================
-- 8. Indexes (addendum §18 — only where a real query pattern needs one)
-- ============================================================================

create index quizzes_owner_id_idx on public.quizzes (owner_id);
create index questions_quiz_id_idx on public.questions (quiz_id);
create index answer_options_question_id_idx on public.answer_options (question_id);

create index assessments_owner_id_idx on public.assessments (owner_id);
create index assessment_questions_assessment_id_idx on public.assessment_questions (assessment_id);
create index assessment_answer_options_assessment_question_id_idx on public.assessment_answer_options (assessment_question_id);
create index assessment_attempts_assessment_id_idx on public.assessment_attempts (assessment_id);
-- Backs the Retake/attempt-limit lookup ("this learner's own attempts for
-- this Assessment") — the exact query the frontend bug fix above needed.
create index assessment_attempts_assessment_identity_idx
  on public.assessment_attempts (assessment_id, full_name, department);
create index assessment_answers_attempt_id_idx on public.assessment_answers (attempt_id);

create unique index game_sessions_game_pin_idx on public.game_sessions (game_pin);
create index game_sessions_host_id_idx on public.game_sessions (host_id);
create index participants_game_session_id_idx on public.participants (game_session_id);
create index participant_answers_participant_id_idx on public.participant_answers (participant_id);
create index participant_answers_game_session_id_idx on public.participant_answers (game_session_id);

-- ============================================================================
-- 9. Row Level Security (addendum §19)
-- ============================================================================
-- Enabled on every table in this migration, including the ones addendum
-- §19 doesn't explicitly list (assessment_answer_options,
-- assessment_attempts, assessment_answers, game_sessions, participants,
-- participant_answers) — with RLS on and zero policies, Postgres denies ALL
-- access by default to every role except one with BYPASSRLS (the
-- service_role key used by lib/supabase/admin.ts). That is the safe
-- default this phase ships: nothing is anonymously readable/writable yet.
-- Real trainer-scoped policies below cover the 6 explicitly-listed tables
-- plus assessment_answer_options (a direct consequence of the snapshot
-- model — see §5). Participant-facing policies (PIN join, attempt
-- creation/submission) are intentionally NOT added yet — see
-- docs/backend/SUPABASE_SETUP.md §6 for the documented future strategy.

alter table public.profiles enable row level security;
alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.answer_options enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.assessment_answer_options enable row level security;
alter table public.assessment_attempts enable row level security;
alter table public.assessment_answers enable row level security;
alter table public.game_sessions enable row level security;
alter table public.participants enable row level security;
alter table public.participant_answers enable row level security;

-- profiles — read/update own row only.
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- quizzes — full CRUD, own rows only.
create policy "quizzes_select_own" on public.quizzes
  for select using (owner_id = auth.uid());
create policy "quizzes_insert_own" on public.quizzes
  for insert with check (owner_id = auth.uid());
create policy "quizzes_update_own" on public.quizzes
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "quizzes_delete_own" on public.quizzes
  for delete using (owner_id = auth.uid());

-- questions — scoped via the parent quiz's owner_id (questions has no
-- owner_id column of its own).
create policy "questions_select_own" on public.questions
  for select using (
    exists (select 1 from public.quizzes q where q.id = questions.quiz_id and q.owner_id = auth.uid())
  );
create policy "questions_insert_own" on public.questions
  for insert with check (
    exists (select 1 from public.quizzes q where q.id = questions.quiz_id and q.owner_id = auth.uid())
  );
create policy "questions_update_own" on public.questions
  for update using (
    exists (select 1 from public.quizzes q where q.id = questions.quiz_id and q.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.quizzes q where q.id = questions.quiz_id and q.owner_id = auth.uid())
  );
create policy "questions_delete_own" on public.questions
  for delete using (
    exists (select 1 from public.quizzes q where q.id = questions.quiz_id and q.owner_id = auth.uid())
  );

-- answer_options — scoped via question -> quiz owner_id.
create policy "answer_options_select_own" on public.answer_options
  for select using (
    exists (
      select 1 from public.questions q
      join public.quizzes qz on qz.id = q.quiz_id
      where q.id = answer_options.question_id and qz.owner_id = auth.uid()
    )
  );
create policy "answer_options_insert_own" on public.answer_options
  for insert with check (
    exists (
      select 1 from public.questions q
      join public.quizzes qz on qz.id = q.quiz_id
      where q.id = answer_options.question_id and qz.owner_id = auth.uid()
    )
  );
create policy "answer_options_update_own" on public.answer_options
  for update using (
    exists (
      select 1 from public.questions q
      join public.quizzes qz on qz.id = q.quiz_id
      where q.id = answer_options.question_id and qz.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.questions q
      join public.quizzes qz on qz.id = q.quiz_id
      where q.id = answer_options.question_id and qz.owner_id = auth.uid()
    )
  );
create policy "answer_options_delete_own" on public.answer_options
  for delete using (
    exists (
      select 1 from public.questions q
      join public.quizzes qz on qz.id = q.quiz_id
      where q.id = answer_options.question_id and qz.owner_id = auth.uid()
    )
  );

-- assessments — full CRUD, own rows only (same shape as quizzes).
create policy "assessments_select_own" on public.assessments
  for select using (owner_id = auth.uid());
create policy "assessments_insert_own" on public.assessments
  for insert with check (owner_id = auth.uid());
create policy "assessments_update_own" on public.assessments
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "assessments_delete_own" on public.assessments
  for delete using (owner_id = auth.uid());

-- assessment_questions — scoped via the parent assessment's owner_id.
create policy "assessment_questions_select_own" on public.assessment_questions
  for select using (
    exists (select 1 from public.assessments a where a.id = assessment_questions.assessment_id and a.owner_id = auth.uid())
  );
create policy "assessment_questions_insert_own" on public.assessment_questions
  for insert with check (
    exists (select 1 from public.assessments a where a.id = assessment_questions.assessment_id and a.owner_id = auth.uid())
  );
create policy "assessment_questions_update_own" on public.assessment_questions
  for update using (
    exists (select 1 from public.assessments a where a.id = assessment_questions.assessment_id and a.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.assessments a where a.id = assessment_questions.assessment_id and a.owner_id = auth.uid())
  );
create policy "assessment_questions_delete_own" on public.assessment_questions
  for delete using (
    exists (select 1 from public.assessments a where a.id = assessment_questions.assessment_id and a.owner_id = auth.uid())
  );

-- assessment_answer_options — scoped via assessment_question -> assessment owner_id.
create policy "assessment_answer_options_select_own" on public.assessment_answer_options
  for select using (
    exists (
      select 1 from public.assessment_questions aq
      join public.assessments a on a.id = aq.assessment_id
      where aq.id = assessment_answer_options.assessment_question_id and a.owner_id = auth.uid()
    )
  );
create policy "assessment_answer_options_insert_own" on public.assessment_answer_options
  for insert with check (
    exists (
      select 1 from public.assessment_questions aq
      join public.assessments a on a.id = aq.assessment_id
      where aq.id = assessment_answer_options.assessment_question_id and a.owner_id = auth.uid()
    )
  );
create policy "assessment_answer_options_update_own" on public.assessment_answer_options
  for update using (
    exists (
      select 1 from public.assessment_questions aq
      join public.assessments a on a.id = aq.assessment_id
      where aq.id = assessment_answer_options.assessment_question_id and a.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.assessment_questions aq
      join public.assessments a on a.id = aq.assessment_id
      where aq.id = assessment_answer_options.assessment_question_id and a.owner_id = auth.uid()
    )
  );
create policy "assessment_answer_options_delete_own" on public.assessment_answer_options
  for delete using (
    exists (
      select 1 from public.assessment_questions aq
      join public.assessments a on a.id = aq.assessment_id
      where aq.id = assessment_answer_options.assessment_question_id and a.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 10. auth.users -> profiles bootstrap trigger (addendum §20)
-- ============================================================================
-- security definer + a pinned search_path is the standard safe pattern for
-- a trigger function that needs to write to public.profiles as a result of
-- an insert into auth.users (which the calling role does not itself have
-- insert rights on public.profiles for, pre-RLS-policy). Idempotent via
-- ON CONFLICT DO NOTHING. Never touches auth.users.encrypted_password or
-- any credential — only new.email and new.raw_user_meta_data (expected to
-- carry first_name/last_name once Phase 10B's signup form sends them via
-- supabase.auth.signUp({ options: { data: { first_name, last_name } } })).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    'TRAINER'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Fires after auth.users insert (Supabase Auth signup). Creates the matching profiles row. Phase 10A ships no signup UI (addendum: "Không làm UI Login/Signup đầy đủ") — this trigger is dormant until Phase 10B adds one, but is safe to install now.';

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
