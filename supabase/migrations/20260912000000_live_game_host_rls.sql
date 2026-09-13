-- Phase 10D — Live Game host-owner RLS policies.
--
-- game_sessions/participants/participant_answers were left RLS-enabled but
-- policy-less by the Phase 10A migration (deny-all except the service-role
-- admin client) — see docs/backend/SUPABASE_SETUP.md §6's documented future
-- strategy. This migration fills in the HOST half of that: a trainer can
-- create/read/update only their own game_sessions (host_id = auth.uid(),
-- exactly mirroring quizzes/assessments' owner_id pattern), and can read
-- (never write) the participants/participant_answers that belong to a
-- session they own — for the Host Lobby's live participant list and the
-- Host Live view's response counts/results.
--
-- Deliberately NOT added here: any policy letting participants themselves
-- read/write game_sessions/participants/participant_answers. Participants
-- have no Supabase Auth session at all, so RLS (which is entirely
-- auth.uid()-based) cannot express "this is the same browser that joined."
-- Per Phase 10D §20, participant reads/writes instead go through
-- server-side-validated Server Actions using the admin client
-- (lib/data/participants.ts, lib/data/live-answers.ts) — never a client-side
-- admin key, and never a wide-open `using (true)` policy. Every such
-- function re-validates the participant's token, the session's status, and
-- (for answers) that the question is still the active one before writing
-- anything. This keeps the "no anonymous RLS bypass for normal CRUD"
-- principle intact: the admin client here is reached for only because RLS
-- genuinely cannot express a no-account identity, exactly the documented
-- exception in lib/supabase/admin.ts's own doc comment.

create policy "game_sessions_select_own" on public.game_sessions
  for select using (host_id = auth.uid());

create policy "game_sessions_insert_own" on public.game_sessions
  for insert with check (host_id = auth.uid());

create policy "game_sessions_update_own" on public.game_sessions
  for update using (host_id = auth.uid()) with check (host_id = auth.uid());

create policy "participants_select_by_host" on public.participants
  for select using (
    exists (
      select 1 from public.game_sessions gs
      where gs.id = participants.game_session_id and gs.host_id = auth.uid()
    )
  );

create policy "participant_answers_select_by_host" on public.participant_answers
  for select using (
    exists (
      select 1 from public.game_sessions gs
      where gs.id = participant_answers.game_session_id and gs.host_id = auth.uid()
    )
  );
