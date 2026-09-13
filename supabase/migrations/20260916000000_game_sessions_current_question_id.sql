-- Fix — game_sessions.current_question_id (stable current-question reference).
--
-- Root cause of "participant answers, Host sees 0 responses": Live Quiz's
-- notion of "the current question" was purely positional —
-- `game_sessions.current_question_index` combined with a fresh
-- `SELECT ... FROM questions WHERE quiz_id = ... ORDER BY display_order`
-- every time anyone needed to know what that question actually is. That's
-- fine as long as the question set never changes mid-game, but a trainer
-- editing the same Quiz between/around live test sessions (adding,
-- removing, or reordering questions — normal, expected use of the Quiz
-- Editor) changes what "index N" resolves to. Verified live: a quiz
-- originally had a POLL question at display_order 2; after the trainer
-- deleted it via the Quiz Editor, every later question's display_order
-- shifted down by one — so a `game_sessions` row still pointing at
-- `current_question_index = 1` from before that edit now resolves to a
-- completely different question than the one participants actually saw
-- and answered. Every answer-count/results query filters by
-- `question_id`, so it correctly finds zero rows for the (wrong) question
-- it's now looking at — the query logic was never wrong, the identity it
-- was given was.
--
-- Fix: track the actual question row directly, set once when a question
-- starts (Start Game / Next Question) and never re-derived by position
-- afterward. `current_question_index` is kept (still useful for "how far
-- into the quiz are we" / computing the next index) but no longer used to
-- look up question CONTENT — that's what was unsafe.
--
-- ON DELETE SET NULL, not RESTRICT: a trainer must still be able to delete
-- the "current" question of a past (non-live) session's quiz without a
-- foreign key blocking them — app code treats a null current_question_id
-- as "this session's current question is no longer available" rather than
-- erroring.

alter table public.game_sessions
  add column current_question_id uuid references public.questions (id) on delete set null;

comment on column public.game_sessions.current_question_id is
  'Stable reference to the actual current question row, set once when that question starts (Start Game / Next Question). Never re-derive "the current question" by indexing into a live questions query — display_order can shift if the quiz is edited after the game started. current_question_index is retained for position bookkeeping only (e.g. computing the next index), not for content lookup.';
