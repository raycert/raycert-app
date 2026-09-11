# SUPABASE_SETUP.md — RayCert Backend Foundation (Phase 10A + 10B)

Phase 10A scope: database schema + RLS foundation. Phase 10B scope: real
Trainer authentication (email/password via Supabase Auth) on top of that
schema — `/login`, `/signup`, `/forgot-password`, `/reset-password`,
protected trainer routes, session refresh, logout. Quiz/Assessment/Live
Quiz data itself still runs on mock/local state after Phase 10B too —
auth is real, the rest of the app's persistence is not yet (see §10 and
MASTER_PLAN.md's Phase 10A/10B entries).

---

## 1. Environment variables

Three variables, already the exact names this project's code expects
(`lib/supabase/client.ts`/`server.ts`/`admin.ts`):

| Variable | Where it's used | Exposure |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | safe to expose — it's just your project's API URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | client + server | safe to expose — RLS is what actually protects data, not hiding this key |
| `SUPABASE_SECRET_KEY` | server only (`lib/supabase/admin.ts`) | **never** expose — bypasses RLS entirely |

`.env.example` (committed, no real values) documents the three names.
`.env.local` (gitignored, real project values) is where you put your actual
project's URL/keys — see §2 for where to find them. `.gitignore` excludes
every `.env*` file except `.env.example` (`.env*` then `!.env.example`).

Never paste your `SUPABASE_SECRET_KEY` into a chat/PR/issue. If you ever
suspect it's leaked, rotate it from the Supabase Dashboard (Project
Settings → API).

---

## 2. Supabase project setup

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Pick an org, name (e.g. `raycert-dev`), a database password (save it
   somewhere — the Dashboard won't show it again; you generally won't need
   it directly, Supabase Auth/the API keys are what the app uses), and a
   region close to you.
3. Wait for provisioning (~2 minutes).
4. **Project Settings → API**:
   - Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`.
   - Copy the **publishable** key (labeled `anon` / `public` on older
     projects) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
   - Copy the **secret** key (labeled `service_role` on older projects) →
     `SUPABASE_SECRET_KEY`.
5. Save `.env.local`. Restart `pnpm dev` if it was already running (env
   vars are only read at process start).

---

## 3. Migration instructions

The schema lives in `supabase/migrations/20260910000000_initial_schema.sql`
— one file, run once, top to bottom.

**Via the Dashboard (no CLI needed):**
1. Open your project → **SQL Editor** → **New query**.
2. Paste the full contents of
   `supabase/migrations/20260910000000_initial_schema.sql`.
3. Run it. It should complete with no errors (enums, tables, indexes, RLS
   policies, and the two trigger functions all in one transaction-per-
   statement run).
4. Optionally also run `supabase/seed.sql` for demo data — read the
   comment at the top of that file first, it has one manual prerequisite
   (create a trainer user in Authentication → Users before seeding, since
   `profiles` rows only ever come from the `auth.users` trigger and there's
   no signup UI yet).

**Via the CLI**, if you have it installed and linked to your project:
```
supabase db push
```
(The CLI wasn't available in this build environment to run migrations
directly — see §10 for how you can verify the schema applied correctly
either way.)

**Do not** run a destructive reset (`supabase db reset`, dropping/
recreating the schema) against a project with real data without deciding
that's what you want first — this migration is additive/idempotent-safe to
run once on a fresh project, but is not written to be safely re-run after
you've made your own manual changes on top of it.

---

## 4. Table overview

| Table | Domain | Purpose |
|---|---|---|
| `profiles` | Auth/Trainer | One row per trainer, mirrors `auth.users` |
| `quizzes` | Quiz Library | A trainer's Live Quiz |
| `questions` | Quiz Library | QUIZ/POLL question, belongs to a quiz |
| `answer_options` | Quiz Library | An option on a question |
| `assessments` | Assessment | A trainer's Post-test |
| `assessment_questions` | Assessment | A question **snapshot** inside one Assessment (not a reference to `questions`) |
| `assessment_answer_options` | Assessment | An option on an `assessment_questions` row |
| `assessment_attempts` | Assessment | One learner's attempt at an Assessment |
| `assessment_answers` | Assessment | One answer within one attempt |
| `game_sessions` | Live Game | A hosted Live Quiz session (PIN, status, current question) |
| `participants` | Live Game | A joined participant in a session |
| `participant_answers` | Live Game | One participant's answer to one question |

---

## 5. Relationships

```
profiles (1) ──< quizzes (1) ──< questions (1) ──< answer_options
profiles (1) ──< assessments (1) ──< assessment_questions (1) ──< assessment_answer_options
assessments (1) ──< assessment_attempts (1) ──< assessment_answers >── assessment_questions
                                              assessment_answers >── assessment_answer_options (nullable, unanswered)
quizzes (1) ──< game_sessions >── profiles (host)
game_sessions (1) ──< participants (1) ──< participant_answers >── questions
                                          participant_answers >── answer_options
```

**Assessment questions are a snapshot, not a reference** (this was an
explicit architecture decision this phase had to make — see the long
comment block in the migration file above `create table
public.assessment_questions`, and re-read here): `assessment_questions`/
`assessment_answer_options` hold their own independent copy of question
text/options, never `references questions(id)`. Why: the frontend has
already committed to this shape (`ROADMAP_ASSESSMENT.md` §2 — "Assessment
giữ bản sao Question[] của riêng nó"), an Assessment's questions can be
authored directly or Excel-imported with no backing Quiz Library entry at
all, and — most importantly — a reference model would let editing a Quiz
Library question retroactively change an already-ACTIVE (or already-
attempted!) Assessment's content, which is exactly the risk Phase 10A's
spec asked to design against. The cost is duplicated *shape* (not data —
every Assessment gets its own physical rows) between `questions`/
`assessment_questions`; that's the deliberate price of assessment history
safety, documented rather than hidden.

A **past `assessment_attempts` row never changes** even if its
`assessment_questions` are edited afterward — `total_points`/
`earned_points`/`score_percent`/`passed`/the `*_count` columns are computed
once at submit time and stored, never recomputed. This mirrors a real bug
this same project's frontend hit and fixed in an earlier phase (see the
comment on `assessment_attempts_unique_number_per_learner` in the
migration): attempt numbering/history must be scoped per-learner
(`full_name` + `department`, since Post-test participants have no
account), never just per-Assessment — otherwise two different learners
sharing an untracked "session" could collide.

---

## 6. RLS strategy

**Enabled on every table in this migration** — including ones the phase
spec didn't explicitly require it for (`assessment_answer_options`,
`assessment_attempts`, `assessment_answers`, `game_sessions`,
`participants`, `participant_answers`). With RLS on and *zero* policies,
Postgres denies all access by default to every role except one with
`BYPASSRLS` — the `service_role` key behind `lib/supabase/admin.ts`. That's
this phase's safe default: nothing beyond the trainer-owned tables below is
anonymously readable or writable yet.

**Trainer-owned tables get real policies** (`profiles` own-row-only;
`quizzes`/`assessments` own-row CRUD; `questions`/`answer_options`/
`assessment_questions`/`assessment_answer_options` scoped by walking up to
the owning `quizzes`/`assessments` row's `owner_id = auth.uid()`). Trainer
A can never read/write Trainer B's rows.

**Participant-facing tables are RLS-on, policy-less for now** — documented
strategy for when a later phase adds real policies:

- **Live Quiz — join by PIN**: a participant has no account, so any policy
  here must authorize by *something the join flow itself proves*, not
  `auth.uid()`. Likely shape: a `SECURITY DEFINER` Postgres function
  (`join_game_session(pin text, nickname text)`) that validates the PIN,
  inserts the `participants` row, and returns its `participant_token` —
  called via `supabase.rpc(...)`, not a direct table insert — so RLS on
  `participants`/`game_sessions` can stay locked down to "authenticated
  host only" for direct table access, while the join *path* is a narrow,
  audited function.
- **Live Quiz — submit answer**: same shape — a function that takes
  `participant_token` + `answer_option_id`, verifies the token matches a
  participant in an active session/question, and inserts/updates
  `participant_answers` — never a raw `insert` policy keyed on something
  client-suppliable like "any row where `participant_id` matches a token I
  send," which would let one participant guess/submit as another.
- **Assessment — open start link / create attempt / submit answers**: same
  pattern — `full_name`/`department` are not secrets, so a plain "anyone
  can insert an `assessment_attempts` row" policy is the wrong shape (no
  rate limiting, no relation to the specific Assessment's `status =
  'ACTIVE'`, no `max_attempts` enforcement). Prefer a function
  (`start_assessment_attempt(assessment_id, full_name, department)`) that
  checks the Assessment is `ACTIVE`, computes the next `attempt_number`
  scoped per-learner (mirroring `assessment_attempts_unique_number_per_
  learner`), and only then inserts — with a per-attempt "submission token"
  returned to the client the same way `participant_token` works for Live
  Quiz, so `assessment_answers`/the final submit can be authorized without
  a Supabase Auth session.

None of this is implemented in Phase 10A (addendum: "chưa cần hoàn thiện
participant public policies") — it's written down so Phase 10B+ doesn't
have to re-derive it, and so nobody is tempted to reach for a wide-open
`using (true)` policy "just to get the frontend running."

**Known DB-level limitation, documented rather than silently assumed
covered**: "QUIZ has exactly one correct answer" and "QUIZ has 2-4 options,
POLL has 2-6" are cross-row constraints (they span multiple
`answer_options`/`assessment_answer_options` rows plus the parent
question's type) and are **not** enforced by a database CHECK constraint or
trigger in this migration — only same-row rules are (e.g.
`questions_base_points_by_type`). They're enforced in the app/service
layer today, the same way the frontend's own `lib/validation/question.ts`
already does. If this ever becomes a real gap (e.g. a script or a bug
writes bad data directly), the fix is a `SECURITY DEFINER` trigger with
`INITIALLY DEFERRED` semantics — deliberately not built now since the
phase spec explicitly allows deferring this rather than forcing a complex
trigger into the foundation migration.

---

## 7. Storage strategy

Two buckets, not yet created by migration (Storage buckets aren't part of
`supabase/migrations/*.sql` schema DDL the same way tables are — create
them once via the Dashboard, a one-time manual step, §9 checklist item):

| Bucket | Path convention | Public? |
|---|---|---|
| `question-images` | `{trainerId}/{questionId}/{filename}` | **Private** |
| `assessment-banners` | `{trainerId}/{assessmentId}/{filename}` | **Private** |

**Both private, not public** — a public bucket serves files to anyone with
the URL, forever, with no way to later restrict access without rotating
every URL already handed out. Since every image here belongs to a specific
trainer's specific quiz/assessment, the correct default is private +
signed URLs (`createSignedUrl`, short-lived) or, more simply for this
app's actual exposure needs (question images are shown to already-joined
participants, banners to anyone with a valid Start link — neither is
secret *content*, just not something to blanket-index), a Storage RLS
policy scoped by path prefix once buckets exist: `bucket_id =
'question-images' AND (storage.foldername(name))[1] = auth.uid()::text`
for trainer read/write, plus a narrow participant-read policy added
alongside the participant table policies in §6 once that's built.

Allowed types: JPG, JPEG, PNG, WebP. Max size: 5 MB — both already enforced
client-side today (`components/media/QuestionImageUpload.tsx`,
`components/assessment/AssessmentBannerUpload.tsx`); a real Storage bucket
should also set `file_size_limit`/`allowed_mime_types` at the bucket level
so the rule doesn't rely on client cooperation alone.

**Phase 10A does not migrate the local upload UI to Storage** (addendum
§21 — "Không cần migrate local image upload UI sang Supabase Storage ở
Phase 10A"). `QuestionImageUpload`/`AssessmentBannerUpload` keep using
local object URLs exactly as before; this section is groundwork for when
that migration happens.

**Manual bucket creation** (Dashboard → Storage → New bucket):
1. Create `question-images`, uncheck "Public bucket."
2. Create `assessment-banners`, uncheck "Public bucket."
3. (Optional, once needed) add the file-size/MIME restrictions in the
   bucket's settings, and RLS policies under Storage → Policies.

---

## 8. Auth — what Phase 10B built

- Routes: `/login`, `/signup`, `/forgot-password`, `/reset-password` (all
  under the `(auth)` route group — a shared centered-card shell, no
  NavBar/SidebarNav), plus `app/auth/confirm/route.ts` (a Route Handler,
  not a page — see §8b, it's the plumbing that makes email links actually
  establish a session).
- `profiles` is auto-populated by the `on_auth_user_created` trigger the
  moment `signUpAction` (`app/(auth)/actions.ts`) calls
  `supabase.auth.signUp({ email, password, options: { data: { first_name,
  last_name } } })`. If email confirmation is OFF, the same action also
  re-asserts `first_name`/`last_name` on the profile right after (defensive
  — the trigger should already be correct, this just guards against
  metadata-extraction drift) using the now-authenticated session; if
  confirmation is ON there's no session yet to do that update under RLS,
  so it's skipped there — the trigger's own data is trusted as sufficient
  in that branch. Never uses the admin/service-role client for this or
  anything else auth-related (Phase 10B §16).
- Route protection is `proxy.ts` (Next.js 16 renamed `middleware.ts` to
  `proxy.ts` — the old convention is deprecated and `pnpm build` fails
  loudly if both files exist at once) + `lib/supabase/proxy.ts`'s
  `updateSession`. It runs on every request (matcher excludes only static
  assets), refreshes the session cookie, and redirects: no session on
  `/dashboard`, `/quizzes`, `/assessments` (both the trainer list/editor
  AND `/assessments/[id]/present`, the Presenter screen, which lives
  outside the `(trainer)` layout folder but is still trainer-only),
  `/results`, or `/host/*` → `/login?redirectTo=<original path>`; a
  session on `/login`/`/signup` → `/dashboard`. Participant routes
  (`/join*`, `/play/*`, `/assessment/*` — **singular**, never confused with
  the protected plural `/assessments/*`) are never touched.
- `getCurrentUser()`/`getCurrentProfile()` (`lib/supabase/auth.ts`) use
  `supabase.auth.getUser()`, never `getSession()` — `getUser()` revalidates
  against Supabase Auth's server on every call, `getSession()` only trusts
  the cookie's face value. This is used consistently in the proxy, the
  `(trainer)` layout, and `/reset-password`'s session check.
- The Trainer shell's NavBar (`components/layout/NavBar.tsx`) receives
  `profile` from `(trainer)/layout.tsx` (a server-side fetch, not a client
  loading flash) and shows first/last name + email in a dropdown with a
  "Đăng xuất" action calling `signOutAction`. A `null` profile (signed in,
  no `profiles` row — e.g. a user created directly in the Dashboard before
  this migration existed) falls back to generic labels rather than
  crashing (Phase 10B §11).

---

## 8b. Required Supabase Dashboard settings for Auth (Phase 10B)

Unlike Phase 10A's checklist (schema only), these are **required** for
login/signup/password-reset to actually work correctly, not optional
verification steps:

1. **Authentication → URL Configuration**:
   - **Site URL**: set to your app's real origin (`http://localhost:3000`
     for local dev, your real domain in production). Supabase uses this to
     build absolute links in emails when `redirectTo` is relative.
   - **Redirect URLs**: add `http://localhost:3000/auth/confirm` (and your
     production equivalent, e.g. `https://yourapp.com/auth/confirm`) to
     the allow-list — Supabase rejects a `redirectTo` that isn't on this
     list, which would otherwise silently break both password reset and
     signup confirmation.
2. **Authentication → Email Templates** — **must be edited**, the default
   templates will NOT work with this app's `/auth/confirm` route as built:
   - **Confirm signup**: change the link to
     `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/dashboard`
     (replacing the default `{{ .ConfirmationURL }}`).
   - **Reset Password**: change the link to
     `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`.
   - Why: the default templates point at Supabase's own hosted verify
     endpoint, which redirects back with session tokens in a URL
     *fragment* (`#access_token=...`) — invisible to a server-side Route
     Handler. This app's `/auth/confirm` instead verifies the `token_hash`
     itself (`supabase.auth.verifyOtp`) and sets the session cookie
     directly, which needs the token in the query string, not a fragment.
     This is Supabase's own documented pattern for the Next.js App Router
     + `@supabase/ssr`, not a workaround specific to this app.
3. **Authentication → Providers → Email**:
   - **Confirm email** toggle — check whichever setting you want (Phase
     10B §5 handles both): ON means `signUpAction` returns
     `requiresEmailConfirmation` and the UI shows a "check your email"
     card; OFF means signup logs the user in immediately and redirects to
     `/dashboard`. Either is a supported, tested code path — this is a
     product decision for you to make, not something the code assumes.
   - **Minimum password length** — this app's client-side minimum is 8
     characters; if your project's setting is different, align one or the
     other so users don't see the client accept a password the server
     then rejects (or vice versa).
4. **Authentication → Rate Limits** — be aware these exist (e.g. email
   sending) if you're testing signup/reset repeatedly yourself in a short
   window; the app surfaces a friendly "thử lại sau ít phút" message when
   you hit one (`over_email_send_rate_limit`/`over_request_rate_limit` in
   `lib/supabase/auth-errors.ts`), it does not retry automatically.
5. **Create a test trainer** the normal way now — via `/signup` in the
   running app — rather than the Phase 10A seed's Dashboard-manual-user
   step, now that signup actually works. Confirm the matching `profiles`
   row appears (Table Editor → `profiles`) with the right
   `first_name`/`last_name`/`email`.
6. Optionally set `NEXT_PUBLIC_SITE_URL` in `.env.local` (not in
   `.env.example` — Phase 10A scoped that file to exactly 3 variables, so
   this stays undocumented-but-optional there) if you want
   `resetPasswordForEmail`'s redirect origin pinned explicitly rather than
   derived from the request's own `Host` header (`lib/supabase/base-url.ts`)
   — useful behind a proxy/CDN in a real deployment, not needed for local
   dev.

---

## 9. Realtime future plan

Not implemented in Phase 10A (addendum: "Không làm Supabase Realtime
gameplay đầy đủ"). When it is (a later phase), the natural shape given
this schema:

- Host and participants subscribe to `postgres_changes` on `game_sessions`
  (filtered to their `id`) for status/current-question transitions, and on
  `participant_answers`/`participants` (filtered to their
  `game_session_id`) for live response-count/leaderboard updates —
  replacing the frontend's current mock timers/simulated state
  (`hooks/use-host-gameplay.ts`, `hooks/use-participant-gameplay.ts`) with
  real subscriptions, without changing those hooks' external shape more
  than necessary.
- Realtime Broadcast (not `postgres_changes`) is a better fit for
  ephemeral, high-frequency events that don't need to be queried later
  (e.g. "someone just answered," before the authoritative DB write lands)
  — CLAUDE.md §7's event list (`answer:accepted`, `answer:count_updated`,
  etc.) maps more naturally to Broadcast channels than table subscriptions.
- Assessment/Post-test has **no realtime plan** — it's explicitly
  self-paced, no host-in-the-loop (CLAUDE.md's Post-test rules, this
  phase's own intro). The Presenter screen's countdown
  (`AssessmentCountdown`) stays a pure client-side derivation from
  `expires_at`, same as today.

---

## 10. How to verify schema

After running the migration (§3):

1. **Table Editor** → confirm all 12 tables from §4 exist under the
   `public` schema.
2. **Database → Enumerated Types** (or `select typname from pg_type where
   typtype = 'e';` in SQL Editor) → confirm 6 enums exist: `question_type`,
   `quiz_status`, `assessment_status`, `assessment_attempt_status`,
   `submission_reason`, `game_session_status`.
3. **Authentication → Policies** (or Table Editor → a table → RLS icon) →
   confirm RLS shows **Enabled** on all 12 tables, and that `quizzes`/
   `questions`/`answer_options`/`assessments`/`assessment_questions`/
   `assessment_answer_options`/`profiles` each show 2-4 policies (§6).
4. Run `select * from public.profiles;` — empty is fine (no signup UI
   yet); after creating one Dashboard test user (§3's seed prerequisite),
   this should show exactly one row.
5. Run the seed (§3) and confirm `select count(*) from public.quizzes;` /
   `assessments;` each return at least 1.
6. **Frontend regression** (Phase 10A addendum §28) — `pnpm build`
   succeeds, and a quick click-through of Dashboard/Quiz Editor/Assessment
   Editor/Live Quiz/Reports still all work exactly as before, still on mock
   data (Phase 10B only changes *whether you can reach them*, never what
   they do once you're in).
7. **Auth smoke test** (Phase 10B, after completing §8b's Dashboard steps):
   visit `/dashboard` while signed out → redirected to
   `/login?redirectTo=%2Fdashboard`; sign up a test trainer → either
   auto-redirected to `/dashboard` or shown the "check your email" card,
   matching whichever "Confirm email" setting you chose; sign in → redirect
   to `/dashboard`, NavBar shows the right name/email; refresh the page →
   still signed in; open the user menu → "Đăng xuất" → redirected to
   `/login`; visit `/dashboard` again → redirected to `/login` again (no
   stale session). Separately confirm `/join`, `/play/[id]`,
   `/assessment/[id]/start` all stay reachable with no session at all.
