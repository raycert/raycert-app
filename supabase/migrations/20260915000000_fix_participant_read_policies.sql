-- Phase 10D fix — participants/participant_answers host-read policies.
--
-- Root cause: 20260912000000_live_game_host_rls.sql's very first statement
-- (`create policy "game_sessions_select_own" ...`) fails with 42710
-- ("policy already exists") on any database where
-- 20260913000000_fix_game_sessions_rls.sql was already applied first (that
-- migration creates a policy of the same name on game_sessions). The SQL
-- Editor stops at the first error, so none of 20260912000000's LATER
-- statements ever ran on such a database — including the two policies
-- below, which no other migration recreates. 20260912000000 can no longer
-- be run successfully as a whole on a database in this state, which is why
-- this is a new file rather than a retry of that one.
--
-- Verified live against the project: with a real participant row seeded
-- into a session, the owning trainer's own JWT reading `participants` for
-- that session returned an empty array, not the row — proof the policy is
-- missing (RLS silently filtering everything out), not that no
-- participants exist. This is why Host Lobby/Live can still show 0
-- participants even after the duplicate-session fix
-- (20260914000000_game_sessions_one_waiting_per_host.sql): game_sessions
-- itself already reads fine (policies came from 20260913000000), but the
-- participant LIST query was the thing silently returning empty.
--
-- Idempotent (drop-then-create) so it's safe to run regardless of whatever
-- partial state 20260912000000 left behind.

drop policy if exists "participants_select_by_host" on public.participants;
drop policy if exists "participant_answers_select_by_host" on public.participant_answers;

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
