-- RayCert — Phase 10C addendum: public read for ACTIVE assessments.
--
-- Why this migration exists: Phase 10A's RLS only let the owning trainer
-- SELECT `assessments`/`assessment_questions`/`assessment_answer_options`
-- (documented there as "participant-facing policies deferred"). Phase 10C
-- now has the participant Start/Take/Result screens and the Presenter
-- screen reading a *real* assessment by id — without this, an anonymous
-- participant (no Supabase Auth account, per CLAUDE.md §3) would get zero
-- rows back for an assessment they have a valid Start link to, since RLS
-- denies by default.
--
-- Scope is deliberately narrow: read-only, and only rows where
-- `status = 'ACTIVE'` — a DRAFT/INACTIVE assessment is never exposed to a
-- non-owner this way. This does not touch INSERT/UPDATE/DELETE (still
-- owner-only) and does not touch `assessment_attempts`/`assessment_answers`
-- (still no policy at all — AssessmneAttempt persistence stays out of scope
-- for this phase, per addendum "Không làm: AssessmentAttempt persistence").
-- No `SUPABASE_SECRET_KEY`/admin client is used for any of this — a real,
-- narrow RLS policy was preferred over bypassing RLS (addendum §15).

create policy "assessments_select_public_active" on public.assessments
  for select using (status = 'ACTIVE');

create policy "assessment_questions_select_public_active" on public.assessment_questions
  for select using (
    exists (
      select 1 from public.assessments a
      where a.id = assessment_questions.assessment_id and a.status = 'ACTIVE'
    )
  );

create policy "assessment_answer_options_select_public_active" on public.assessment_answer_options
  for select using (
    exists (
      select 1 from public.assessment_questions aq
      join public.assessments a on a.id = aq.assessment_id
      where aq.id = assessment_answer_options.assessment_question_id and a.status = 'ACTIVE'
    )
  );
