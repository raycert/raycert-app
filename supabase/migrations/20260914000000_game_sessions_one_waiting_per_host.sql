-- Phase 10D fix — prevent duplicate WAITING game_sessions.
--
-- Root cause of the reported bug (same Quiz+Host ending up with two
-- WAITING sessions, e.g. PIN 200801 and PIN 083933): `createGameSession`
-- (lib/data/game-sessions.ts) unconditionally inserted a new row on every
-- call, with no check for an already-existing WAITING session for the same
-- quiz+host. `/host/new?quizId=...` runs that insert on every visit — a
-- second click on "Host" for the same quiz, a back-then-forward navigation,
-- or a route re-render all called it again, each producing a brand new
-- session/PIN. The application-layer fix (querying for an existing WAITING
-- session before inserting) is in the same commit as this migration, but
-- app-layer alone still has a TOCTOU race window between "check" and
-- "insert" if the route is hit twice nearly simultaneously (double-click,
-- two tabs) — this partial unique index is the real backstop, the same
-- reason `game_pin`'s uniqueness is enforced at the DB level and not just
-- checked in application code.
--
-- Partial (WHERE status = 'WAITING'), not a plain unique(quiz_id, host_id):
-- a trainer must be able to host the same quiz again in a later, separate
-- training session — the constraint only ever needs to rule out two
-- *simultaneous open lobbies* for the same quiz+host, never two lifetime
-- sessions. Once a session leaves WAITING (QUESTION_ACTIVE onward), it no
-- longer participates in this index at all, so hosting the same quiz again
-- later is unaffected.

create unique index game_sessions_one_waiting_per_quiz_host_idx
  on public.game_sessions (quiz_id, host_id)
  where status = 'WAITING';
