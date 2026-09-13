-- Phase 10D fix — game_sessions RLS.
--
-- Root cause of the reported bug (every INSERT into game_sessions failed
-- 42501 even with host_id/quiz ownership both verified correct): the prior
-- migration (20260912000000_live_game_host_rls.sql) had never actually been
-- applied to the database, so game_sessions had RLS enabled with zero
-- policies — deny-all by default. This migration both (a) supplies the
-- missing policies and (b) tightens the INSERT check beyond the original
-- draft: host_id = auth.uid() alone isn't enough — the row's quiz_id must
-- also reference a quiz owned by that same trainer, so RLS independently
-- enforces the same invariant lib/data/game-sessions.ts's createGameSession
-- already checks in application code (defense in depth, not a replacement
-- for that check).
--
-- Written as a NEW file rather than editing
-- 20260912000000_live_game_host_rls.sql in place, since that file may
-- already have been run in some environment — dropping first (IF EXISTS,
-- so safe either way) then recreating makes this migration correct to run
-- whether or not the original ever actually took effect.

drop policy if exists "game_sessions_insert_own" on public.game_sessions;
drop policy if exists "game_sessions_select_own" on public.game_sessions;
drop policy if exists "game_sessions_update_own" on public.game_sessions;
drop policy if exists "game_sessions_delete_own" on public.game_sessions;

-- INSERT — host_id must be the caller AND quiz_id must reference a quiz
-- owned by that same caller. A trainer can never create a session that
-- claims to host someone else's quiz, even if host_id is (correctly) their
-- own id.
create policy "game_sessions_insert_own" on public.game_sessions
  for insert with check (
    host_id = auth.uid()
    and exists (
      select 1 from public.quizzes q
      where q.id = game_sessions.quiz_id and q.owner_id = auth.uid()
    )
  );

-- SELECT — only the session's own host.
create policy "game_sessions_select_own" on public.game_sessions
  for select using (host_id = auth.uid());

-- UPDATE — only the session's own host (start/close/next/end game all go
-- through this). quiz_id is never changed by an update, so re-checking
-- quiz ownership here isn't needed the way it is for INSERT.
create policy "game_sessions_update_own" on public.game_sessions
  for update using (host_id = auth.uid()) with check (host_id = auth.uid());

-- DELETE — not currently used by the app (no deleteGameSession exists),
-- but added for the same reason quizzes/assessments both have a
-- delete_own policy: RLS should not silently default-deny-forever if a
-- delete path is ever added later, and an owner-scoped policy costs
-- nothing to have in place now.
create policy "game_sessions_delete_own" on public.game_sessions
  for delete using (host_id = auth.uid());
