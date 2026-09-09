# Handoff: RayCert — Developer Handoff V1

## Overview
RayCert is a realtime training-quiz platform. Trainers author quizzes (QUIZ or POLL questions only), host live sessions, participants join by PIN on mobile and answer in realtime, then trainers get reports. This package specifies the frontend for **Next.js App Router + React + TypeScript + Tailwind CSS + shadcn/ui**. No backend code — this is frontend spec only, buildable against mock data.

## About the Design Files
The `.dc.html` files bundled here (`Product Flow & Sitemap`, `Design System V1`, `Wireframe V1`, `High-Fidelity V1`) are **HTML design references** — they show layout, hierarchy, color, and copy, not code to copy directly. Recreate them in Next.js/React/Tailwind/shadcn using the tokens and specs in this README. High-Fidelity V1 is **high-fidelity**: pixel/color/type values below are final; recreate them precisely.

## Fidelity
**High-fidelity.** Colors, typography, spacing, radius, and shadow values below are final production values, taken directly from Design System V1 and applied in High-Fidelity V1.

---

## 1. Final Decisions (this round)

- **Participant Leaderboard**: shown only after QUIZ questions. Flow: `QUIZ Result (participant) → Participant Leaderboard → Next Question`. Participant Leaderboard is a **compact** variant (current rank, nearby ranks or Top 5, nickname, score) — visually distinct from Host Leaderboard, not a reused component 1:1. After POLL: no leaderboard shown, no rank change, straight to next question.
- **Excel Import v1** imports only: `type` (QUIZ/POLL), `question text`, `options`, `correct answer` (QUIZ only), `timer`, `points` (QUIZ only). **No image URL column** — images are always uploaded manually after import.
- **Image Upload**: accepts JPG, JPEG, PNG, WebP. Max 5MB. Max 1 image per question. No GIF/video/audio. No per-answer-option images.
- **Tablet**: no dedicated tablet hi-fi screens. Rule: scale the desktop layout down; Quiz Editor sidebar becomes a drawer (768–1023px); reduce spacing per §11; flow unchanged.
- **Participant interaction pattern**: **Select + Confirm**, for QUIZ and POLL alike (see §7).
- **Joining a session** (added): 3 entry paths — (1) scan the **QR Code** shown in Host Lobby, (2) open the **Join Link** a trainer shares, (3) open RayCert and type the **Game PIN** manually at `/join`. Paths 1–2 resolve the session from the URL and skip straight to Nickname Entry (`/join/[sessionCode]`); path 3 validates the PIN at `/join` first, then redirects to the same `/join/[sessionCode]` Nickname Entry — one shared destination regardless of entry path. No participant account is created in any case; a participant is still just `session + nickname`.

---

## 2. Route Map

**Public**
| Route | Page | Purpose |
|---|---|---|
| `/` | Home | Entry point, link to Join |
| `/join` | Join Game | Manual Game PIN entry (used when a participant opens RayCert directly, not via QR/link) |
| `/join/[sessionCode]` | Nickname Entry | Session already resolved from the URL — reached via QR Code scan, a shared Join Link, **or** a redirect from `/join` after a valid PIN. No PIN re-entry here. |
| `/play/[sessionId]` | Participant Session | Single route hosting Waiting Room → Question → Result → Leaderboard → Final Result as **UI states**, driven by realtime session state, not sub-routes |

**Trainer**
| Route | Page | Purpose |
|---|---|---|
| `/dashboard` | Trainer Dashboard | Quick actions, recent sessions |
| `/quizzes` | My Quizzes | List, search, Create Quiz |
| `/quizzes/new` | Quiz Editor (new) | Same component as edit, empty draft |
| `/quizzes/[quizId]` | Quiz Editor (edit) | Question list + editor. Add Question, QUIZ/POLL Editor, Import Excel are **modals/panels over this route**, not routes |
| `/quizzes/[quizId]/preview` | Quiz Preview | Read-only run-through |
| `/results` | Results Dashboard | Session history |
| `/results/[sessionId]` | Game Report | Overview + Participant Results + QUIZ/POLL Analysis |

**Host**
| Route | Page | Purpose |
|---|---|---|
| `/host/[sessionId]/lobby` | Host Lobby | QR Code + Game PIN (join focal point), Copy Join Link, participant count/names, Start Game |
| `/host/[sessionId]/live` | Host Live | Host Question → Result → Leaderboard → Final Results as **UI states** of one route, driven by session phase |

### ROUTE vs UI STATE
A route is a distinct URL/page. A UI state is a visual mode toggled by data (session phase, submission status) **within** a route, with no navigation event.

| UI State | Lives inside route |
|---|---|
| Submitted (participant answer locked) | `/play/[sessionId]` |
| Host Question / Result / Leaderboard / Final Results | `/host/[sessionId]/live` |
| Add Question modal, QUIZ/POLL Editor panel, Import Excel modal | `/quizzes/[quizId]` |
| Reconnecting / Reconnect failed overlay | any participant or host route |
| Empty / Loading / Error | any route with async data |

---

## 3. Screen Specification

Each screen: **ID · Name · Route · Role · Device priority · Layout · Components · Primary CTA · Secondary actions · States · Responsive · Data**.

**01 · Trainer Dashboard** — `/dashboard` · Trainer · Desktop.
Layout: top bar (logo, nav, Create Quiz) + 190px sidebar + main (Recent Sessions list, quick action cards).
Components: `NavBar`, `SidebarNav` (+ `TrainerSidebarDrawer` on tablet/mobile), `RecentSessionItem`, `EmptyState`, `Button`.
Primary CTA: Create Quiz. Secondary: Edit/Host on a session item.
States: loading, empty (no sessions yet — `EmptyState` + Create Quiz CTA).
Responsive: ≥1024px fixed sidebar; <1024px sidebar becomes a `Sheet` drawer opened from a menu button in `NavBar`. Not primary mobile use case, but not broken either.
Data: `recentSessions: RecentSessionSummary[]` (mock-only summary shape — see §16; last 3–5).

**02 · My Quizzes** — `/quizzes` · Trainer · Desktop.
Layout: search bar + Create Quiz button + list (Title, Questions, Mix, Updated, Status, Actions).
Components: `SearchInput`, `QuizList`, `QuizRow`, `QuizStatusBadge`, `EmptyState`, `Button`, `DropdownMenu` (shadcn, for the ··· menu).
Primary CTA: Create Quiz. Secondary: Edit, Host, More (··· menu: Duplicate/Delete — mock actions, toast feedback, no persistence).
States: loading, empty (`EmptyState` + Create Quiz CTA), search-no-result (inline message inside `QuizList`, no `EmptyState`/CTA — a bad query isn't fixed by creating a quiz).
Responsive: list scrolls horizontally inside a bounded container below ~820px rather than breaking the page layout.
Data: `quizzes: Quiz[]`.

**03 · Quiz Editor** — `/quizzes/new`, `/quizzes/[quizId]` · Trainer · Desktop.
Layout: top bar (inline-editable title, save status, Import Excel, Preview, Host) + 260px sidebar (`QuestionList`) + main (`QuizQuestionEditor` or `PollQuestionEditor`).
Components: `QuizEditorPage` (orchestrator: local state via `useQuizEditor`), `QuizEditorShell`, `QuestionList`, `QuestionListItem`, `QuestionTypeBadge`.
Primary CTA: Add Question. Secondary: Save (auto, debounced — "Chưa lưu" → "Đang lưu…" → "Đã lưu"), Preview, Host, Import Excel.
States: new (empty draft, title placeholder "Untitled Quiz"), existing (seeded from mock data), unsaved/saving/saved, incomplete question (⚠ + error tint on sidebar item), question selected, no question selected (empty-state prompt in main), Host disabled + inline warning banner when any question is incomplete or the quiz has zero questions.
Responsive: ≥1024px fixed 260px sidebar; <1024px sidebar becomes a `Sheet` drawer (menu button in top bar) — same mechanism as `TrainerSidebarDrawer`.
Data: `quiz: Quiz` (with `questions: Question[]`) — client/local state only, no persistence after reload.

**04 · Add Question Modal** — overlay on `/quizzes/[quizId]` (and `/quizzes/new`) · Trainer · Desktop.
Layout: centered modal, 2 large selectable cards (Trắc nghiệm / Bình chọn).
Components: `AddQuestionDialog` (self-contained: owns its own trigger button — the sidebar's dashed "+ Add Question" row — and the `Dialog`).
Primary CTA: click a card (creates the question, closes the modal, selects the new question, opens its editor — single click, no separate confirm step). Secondary: Cancel.
States: default only.

**05 · QUIZ Editor** (question-level, inside Quiz Editor main) — Trainer · Desktop.
Components: `QuizQuestionEditor`, `QuestionImageUpload`, `AnswerOptionEditor` (real `<input type="radio">` per question, visually custom-styled, for correct), `QuestionSettings` (Timer + Points selects), `ValidationMessage`.
Primary CTA: implicit save (debounced) on any change. Secondary: add/remove option (2–4), delete question (trash icon, `aria-label`).
States: validation error (no correct answer / <2 options / empty text — all shown live via `ValidationMessage`, driven by `lib/validation/question.ts`), incomplete (empty text).
Data: `question: Question` where `type: 'QUIZ'`. Correct-answer is authoring-only state in this editor — never sent to a participant-facing component.

**06 · POLL Editor** (question-level) — Trainer · Desktop.
Components: `PollQuestionEditor`, `QuestionImageUpload` (shared), `AnswerOptionEditor` (`showCorrectToggle={false}` — no radio rendered at all), `QuestionSettings` (Timer only, no Points).
Primary CTA: implicit save (debounced). Secondary: add/remove option (2–6), delete question.
States: incomplete (empty text or <2 options), via the same `ValidationMessage`. No correct-answer / points fields ever rendered — enforced by `QuestionSettings`'s `points`/`onPointsChange` props being optional and omitted entirely for POLL.

**07 · Import Excel Modal** — overlay on `/quizzes/[quizId]` (and `/quizzes/new`) · Trainer · Desktop.
**Fully implemented (Phase 4), client-side only** — `.xlsx` read via `exceljs` (dynamically imported, only loaded when the dialog opens/downloads), no upload to any backend, no macro/formula execution (exceljs reads formula cells' last computed result only). Components: `ExcelImportDialog` (orchestrator) + `ExcelDropzone` + `ExcelImportSummary` + `ExcelPreviewTable` + `ExcelValidationMessage`.
Primary CTA: `Import N câu hợp lệ` (disabled at 0 valid rows). Secondary: Upload lại file, Cancel, Download Template.
States: empty → selected → validating → preview → importing → success (toast, closes + resets on next open). Invalid rows are never auto-corrected — each gets exactly one `{errorColumn, errorMessage}` pair (docs in §5/§13). A wrong extension or unparseable file shows a friendly inline error and stays on `empty` for retry.

**08 · Host Lobby** — `/host/[sessionId]/lobby` · Trainer(Host) · Desktop, projector.
Layout: full-bleed navy panel, `GameQRCode` | `GamePin` side-by-side focal point (stacks vertically <640px), `JoinInstructions`, `CopyJoinLinkButton`, participant chips, Start Game.
Components: `HostShell` (no sidebar/nav), `GameQRCode`, `GamePin`, `JoinInstructions`, `CopyJoinLinkButton`, `ParticipantChip`.
Primary CTA: Start Game (disabled at 0 participants). Secondary: Copy Join Link (toast "Đã sao chép liên kết"), End session.
States: no-join-yet, joining, ready.
Data: `session: GameSession`, `participants: Participant[]` (realtime). Join URL is derived client-side from the page's own origin + the session code — never a hard-coded domain.

**09–10 · Host Question — QUIZ / POLL** — `/host/[sessionId]/live` (phase=`question`) · Desktop, projector.
Components: `HostShell`, `QuestionTypeBadge`, `Timer`, `ResponseCounter`, `QuestionImageDisplay`, `AnswerOptionPlayer` (host, non-interactive), `Button` (End Question/Poll).
Primary CTA: End Question / End Poll. Secondary: none (deliberately minimal while live).
States: timer running, timer ≤5s (amber ring), timeout auto-end.
Data: `question: Question`, `responseCount: number`, `totalParticipants: number`.

**11–12 · QUIZ / POLL Result — Host** — `/host/[sessionId]/live` (phase=`result`) · Desktop, projector.
Components: `HostShell`, `ResultBar` (QUIZ: success/brand mix; POLL: teal only), `Button` (Leaderboard/Next).
Primary CTA: Next. Secondary (QUIZ only): Leaderboard.
States: 0 responses.
Data: `result: QuestionResult | PollResult`.

**13 · Leaderboard — Host** — `/host/[sessionId]/live` (phase=`leaderboard`, QUIZ only) · Desktop, projector.
Components: `HostShell`, `Leaderboard`, `LeaderboardRow`, `Button` (Next Question).
States: tie score.
Data: `leaderboard: LeaderboardEntry[]`.

**14 · Host Final Results** — `/host/[sessionId]/live` (phase=`final`) · Desktop, projector.
Components: `HostShell`, `Leaderboard` (Top 3–5), `Button` (View Report, End Session).
States: all-POLL session (hide leaderboard block, show counts only).
Data: `session summary`, `leaderboard`.

**15 · Join Game** — `/join` · Participant · Mobile. **Implemented (Phase 5).**
Manual-entry path only — reached when a participant opens RayCert directly (not via QR/Join Link).
Components: `MobileShell`, `PinInput`, `Button`.
Primary CTA: Continue — disabled until the PIN is exactly 6 digits. On submit, an `idle → validating → invalid | success` state machine runs (mock ~500ms delay) before redirecting to `/join/[sessionCode]` (screen 16) — same destination as the QR/Link path.
States: idle, validating ("Đang kiểm tra…", input+button disabled), invalid ("PIN không hợp lệ", `role="alert"`, `aria-describedby`-linked), success ("Đang chuyển hướng…").

**16 · Nickname Entry** — `/join/[sessionCode]` · Participant · Mobile. **Implemented (Phase 5).**
Shared destination for all 3 join paths (QR Code scan, Join Link, or PIN redirect from screen 15) — the session is already resolved from the URL, so this screen never asks for a PIN. Now also shows the quiz title next to the PIN (`getSessionQuizTitle`).
Components: `MobileShell`, `Input` (labelled, sr-only `<label>`), `Button`, back link.
Primary CTA: Join Game — disabled until nickname is 2–20 trimmed characters. Submit runs `idle → joining → invalid | duplicate` (mock ~450ms delay), then navigates to `/play/[sessionId]?nickname=...` (nickname carried via the URL — this mock has no session persistence, so the query string *is* the state, which also makes a page refresh keep the participant in place).
States: nickname duplicate (`isNicknameTaken`, checked against the mock roster), invalid/expired session code (blocking message + link back to `/join`), joining (loading, disabled).

**17 · Waiting Room** — `/play/[sessionId]` · Participant · Mobile. **Implemented (Phase 5).**
Reads `nickname` from the URL query (set by screen 16); a bare visit with no `nickname` redirects to `/join/[sessionId]` rather than showing a broken/anonymous room.
Components: `MobileShell`, `AvatarChip`, status text.
Shows: quiz title, `AvatarChip` + nickname, "✓ Đã tham gia" badge, an `aria-live="polite"` pulsing waiting indicator + "Đang chờ người hướng dẫn bắt đầu...", mock participant count (`mockParticipants.length + 1`), mock connection status ("Đã kết nối"). No self-start control.
States: session not found (blocking message + link to `/join`). Reconnecting/disconnected mock states are **deferred** (no realtime yet).

**18–19 · Participant QUIZ/POLL Answer** — `/play/[sessionId]` (phase=`QUESTION_ACTIVE`) · Mobile. **Implemented (Phase 6).**
Components: `ParticipantGameShell` (phase switcher, owns `useParticipantGameplay`), `GameProgress`, `ParticipantTimer`, `ParticipantQuestion`, `ParticipantAnswerOption` (radiogroup), `SubmitAnswerButton`.
Primary CTA: Gửi câu trả lời — disabled until a selection is made. Select + Confirm: tapping an option only selects it (re-selectable); nothing is sent until Submit.
States: default, selected (pending confirm), submitted/locked (→ screen 20), timeout-no-answer (timer reaches 0 with nothing selected). Image (when present): question text → image (`object-fit: contain`, capped height, no crop) → options.
Data: `ParticipantQuestion` (`lib/game/participant-question.ts`) — **never carries `isCorrect`**, at the type level, not just hidden in the UI (§14 security boundary). The countdown reaching 0 is what closes the question (simulating the host), independent of this participant's own submit.

**20 · Submitted (state)** — `/play/[sessionId]`, same phase as 18/19 · Mobile. Not a route. **Implemented.**
Component: `AnswerSubmittedState` — replaces the options+submit area entirely (not a disabled option list). Shows a checkmark, the locked answer chip, and "Đang chờ người hướng dẫn kết thúc câu hỏi..." — never reveals correctness here.

**21 · QUIZ Result — Participant** — `/play/[sessionId]` (phase=`QUESTION_RESULTS`) · Mobile. **Implemented.**
Component: `QuizResult` (`components/game/`) — correct/incorrect/unanswered icon+text (never color-only), participant's own answer, the correct answer (shown whenever not correct), points earned (+ response time), running total score.
States: correct (success green), incorrect (error red, always names the correct answer), **no-answer/timeout is its own neutral state — never styled as incorrect** (`isCorrect: null`).

**22 · POLL Result — Participant** — `/play/[sessionId]` (phase=`QUESTION_RESULTS`) · Mobile. **Implemented.**
Components: `PollResult` + `PollResultBar` (`components/game/`) — teal-only distribution bars (label, %, count), the participant's own bar visually highlighted, total voter count. Never renders correct/incorrect/points/rank — those props don't exist on this component at all.

**22b · Participant Leaderboard** (QUIZ only) — `/play/[sessionId]` (phase=`LEADERBOARD`) · Mobile. **Implemented.**
Components: `ParticipantLeaderboard` + `ParticipantRankCard` (`components/leaderboard/`) — big "Bạn xếp thứ #N" card + a compact row list (top 5 if the participant is in it, else top 3 + rows nearby their own rank, own row highlighted). Never shown after POLL — POLL results advance straight to the next question.

**23 · Participant Final Result** — `/play/[sessionId]` (phase=`FINISHED`) · Mobile. **Implemented (minimal).**
Shows final rank + total score once the mock question sequence ends. The all-POLL-session variant (hide rank/score, participation summary only) is **deferred** — the Phase 6 mock sequence always includes QUIZ questions, so a scoreless session was never exercised.

**24 · Results Dashboard** — `/results` · Trainer · Desktop.
Components: `SessionTable`, `Button` (View Report).
States: empty.

**25 · Game Report** — `/results/[sessionId]` · Trainer · Desktop.
Components: `OverviewCard` ×5, `ParticipantResultsTable`, `QuizAnalysisRow`, `PollAnalysisRow`.
States: all-POLL or all-QUIZ session (hide the irrelevant analysis block); never merge POLL into correct-rate.

---

## 4. Component Architecture

```
components/
  layout/
    NavBar.tsx
    SidebarNav.tsx           # exports SidebarNavList too, reused by the drawer
    TrainerSidebarDrawer.tsx # Sheet-based sidebar for <1024px
    EmptyState.tsx
    SearchInput.tsx
    RecentSessionItem.tsx
    HostShell.tsx           # navy full-bleed, no nav, projector mode
    MobileShell.tsx         # 390 viewport shell, safe-area padding
  quiz/
    QuizEditorPage.tsx       # orchestrator: useQuizEditor + Shell + editors + dialogs
    QuizEditorShell.tsx
    QuestionList.tsx
    QuestionListItem.tsx
    QuestionTypeBadge.tsx    # size?: 'default' | 'sm'
    AddQuestionDialog.tsx    # trigger + Dialog in one (Trắc nghiệm / Bình chọn cards)
    QuizQuestionEditor.tsx
    PollQuestionEditor.tsx
    AnswerOptionEditor.tsx
    QuestionSettings.tsx     # Timer (+ Points for QUIZ) selects
    ValidationMessage.tsx
    QuizPreviewDialog.tsx
    QuizList.tsx             # My Quizzes list (exports QuizListHeader too)
    QuizRow.tsx
    QuizStatusBadge.tsx
  game/
    Timer.tsx               # Host-side — spec'd, not yet built (see ParticipantTimer for participant's)
    ResponseCounter.tsx     # Host-side — spec'd, not yet built
    ResultBar.tsx           # Host-side — spec'd, not yet built (see QuizResult/PollResult for participant's)
    AnswerOptionPlayer.tsx  # Host-side — spec'd, not yet built (see ParticipantAnswerOption)
    GameQRCode.tsx          # QR for a join URL passed via props — never hard-codes a domain
    GamePin.tsx             # replaces the earlier PinDisplay placeholder name
    JoinInstructions.tsx
    CopyJoinLinkButton.tsx
    HostLobbyPanel.tsx      # composes the 4 above + participant chips for Host Lobby
    QuizResult.tsx          # participant QUIZ result card (correct/incorrect/unanswered)
    PollResult.tsx          # participant POLL result (distribution)
    PollResultBar.tsx
  participant/
    PinInput.tsx
    AvatarChip.tsx
    ReconnectOverlay.tsx     # spec'd, not yet built — no realtime to reconnect to
    ParticipantGameShell.tsx # phase switcher: WAITING/ACTIVE/SUBMITTED/RESULTS/LEADERBOARD/FINISHED
    ParticipantQuestion.tsx
    ParticipantAnswerOption.tsx
    ParticipantTimer.tsx
    SubmitAnswerButton.tsx
    AnswerSubmittedState.tsx
    GameProgress.tsx
  leaderboard/
    Leaderboard.tsx          # Host-side — spec'd, not yet built (no Host Live controller)
    LeaderboardRow.tsx       # Host-side — spec'd, not yet built
    ParticipantLeaderboard.tsx
    ParticipantRankCard.tsx
  reports/
    OverviewCard.tsx
    ParticipantResultsTable.tsx
    QuizAnalysisRow.tsx
    PollAnalysisRow.tsx
    SessionTable.tsx
  import/
    ExcelImportDialog.tsx    # orchestrator: state machine + parse/validate/import wiring
    ExcelDropzone.tsx        # empty/drag-over — file picker + Download Template
    ExcelImportSummary.tsx   # file name + total/QUIZ/POLL/valid/error counts
    ExcelPreviewTable.tsx
    ExcelValidationMessage.tsx
  media/
    QuestionImageUpload.tsx
    QuestionImageDisplay.tsx
  ui/                        # shadcn primitives: button, input, dialog, progress, badge, toast, tabs...
```

Non-`components/` additions (Phase 3): `hooks/use-quiz-editor.ts` (all Quiz Editor local state — add/select/edit question, add/remove option, set correct answer, save-status simulation) and `lib/validation/question.ts` (Zod schemas + `isQuestionComplete`/`getQuestionValidationMessages`, backing both the sidebar's incomplete badge and each editor's `ValidationMessage`).

Non-`components/` additions (Phase 6): `hooks/use-participant-gameplay.ts` (the `WAITING → QUESTION_ACTIVE → ANSWER_SUBMITTED → QUESTION_RESULTS → LEADERBOARD → FINISHED` state machine — countdown, auto-advance timers simulating the host, per-question answers, cumulative score, live leaderboard); `lib/game/participant-question.ts` (`ParticipantQuestion`/`toParticipantQuestion` — the §14 security-boundary type, strips `isCorrect` before a question ever reaches participant-facing components); `lib/game/scoring.ts` (`calculateMockQuizPoints` — client mock only, illustrates the CLAUDE.md §10 formula, never authoritative).

### Key component specs

**`QuizEditorPage`** — Responsibility: page-level orchestrator for `/quizzes/new` and `/quizzes/[quizId]`. Owns all editor state via the `useQuizEditor(initialQuiz)` hook (`hooks/use-quiz-editor.ts`) and the Preview/Import dialogs' open state; wires everything into `QuizEditorShell`. Props: `initialQuiz: Quiz`. No persistence — state is local/client-only, reset on reload.

**`QuizEditorShell`** — Responsibility: top bar (inline-editable title input, save-status label, Import Excel/Preview/Host buttons, Host-disabled warning banner) + sidebar/drawer + main slot layout. Props: `quizTitle`, `onTitleChange`, `saveStatus: 'saved'|'saving'|'unsaved'`, `onImportExcel`, `onPreview`, `onHost`, `hostDisabled: boolean`, `sidebar: ReactNode`, `children` (main). State: drawer open (tablet, <1024px — same `Sheet` pattern as `TrainerSidebarDrawer`). Used in: `/quizzes/new`, `/quizzes/[quizId]` (via `QuizEditorPage`).

**`QuestionList` / `QuestionListItem`** — Props: `questions: Question[]`, `selectedId`, `onSelect`, `onMoveUp`/`onMoveDown` (reorder foundation — swaps with the neighboring question and renumbers; no drag-and-drop), `onCreateQuestion` (renders `AddQuestionDialog` after the list). Item shows order, `QuestionTypeBadge` (`size="sm"`), truncated text, incomplete-warning icon (⚠). Used in: Quiz Editor sidebar.

**`QuestionTypeBadge`** — Props: `type: 'QUIZ'|'POLL'`, `size?: 'default'|'sm'`. Variants: filled (brand-700, for QUIZ) / outlined (teal-500, for POLL). Used in: sidebar (`sm`), Add Question modal, Quiz Preview, all Result screens.

**`QuizQuestionEditor`** — Props: `question: Question` (type `'QUIZ'`), `order`, `validationMessages: string[]`, `onChangeText`, `onUploadImage`, `onRemoveImage`, `onAddOption`, `onRemoveOption`, `onChangeOptionText`, `onSetCorrect`, `onTimerChange`, `onPointsChange`, `onDelete`. Composed of `QuestionImageUpload` + `AnswerOptionEditor[]` + `QuestionSettings` (Timer + Points) + `ValidationMessage`. All callbacks pre-curried by the caller with the question's id — the component itself is id-agnostic. Used in: Quiz Editor main, QUIZ questions.

**`PollQuestionEditor`** — Same shape as `QuizQuestionEditor` minus `onSetCorrect`/`onPointsChange` (no correct-answer, no points) and `QuestionSettings` renders Timer only. Used in: Quiz Editor main, POLL questions.

**`AnswerOptionEditor`** — Props: `option: AnswerOption`, `questionId`, `showCorrectToggle: boolean` (false for POLL), `onChangeText`, `onSetCorrect?`, `onRemove`, `canRemove: boolean`. The correct-answer selector is a real `<input type="radio" name="correct-{questionId}">` (visually custom-styled via `peer-checked:`, not a fake div) — native keyboard/arrow-key/screen-reader semantics for free. Used in: QUIZ/POLL Editor.

**`QuestionSettings`** — Props: `timerSeconds`, `onTimerChange`, `points?`, `onPointsChange?`. Preset `Select` dropdowns (Timer: 10/15/20/30/45/60s; Points: 500/1000/1500/2000). Points UI is entirely omitted (not just disabled) when `points`/`onPointsChange` are absent — the POLL editor never passes them. Used in: `QuizQuestionEditor`, `PollQuestionEditor`.

**`ValidationMessage`** — Props: `messages: string[]`. Renders nothing when empty; otherwise an `error-100`-tinted `role="alert"` block, one line per message (⚠ icon + text). Messages come from `lib/validation/question.ts` (Zod schemas per §12 domain rules), recomputed on every render from the live draft — never stored, so they can't go stale. Used in: `QuizQuestionEditor`, `PollQuestionEditor`.

**`AddQuestionDialog`** — Props: `onCreateQuestion: (type: QuestionType) => void`. Self-contained: renders its own trigger (the sidebar's dashed "+ Add Question" row) and `Dialog`. Clicking a card calls `onCreateQuestion` and closes immediately — no separate confirm step. Used in: `QuestionList`.

**`QuizPreviewDialog`** — Props: `open`, `onOpenChange`, `quiz: Quiz`, `hasIncompleteQuestions: boolean`. Read-only run-through of every question (type, text, image, options; QUIZ's correct option marked ✓ — safe here since Preview is trainer-only, unlike participant-facing components which must never leak correctness early). Shows a warning banner when `hasIncompleteQuestions`. No gameplay. Used in: Quiz Editor ("Preview" button).

**`AnswerOptionPlayer`** — Responsibility: render one answer option in Host (read-only) or Participant (interactive) context, with the full state machine (§6). Props: `label: 'A'|'B'|'C'|'D'|'E'|'F'`, `text: string`, `state: AnswerOptionState`, `variant: 'quiz'|'poll'`, `interactive: boolean`, `onSelect?`. Used in: Host Question, Participant Answer.

**`QuestionImageUpload`** — Props: `imageUrl?: string`, `onUploaded: (url, fileName) => void`, `onRemove`. Internal phase state (`idle`/`drag-over`/`uploading`/`error`) is UI-only — `imageUrl` presence alone decides the persisted preview state. Validates type (JPG/JPEG/PNG/WebP) and size (≤5MB) client-side before accepting a file; on success, creates a local `URL.createObjectURL(file)` (revoked on replace/remove/unmount — no upload to any backend). Full spec in §12. Used in: QUIZ/POLL Editor.

**`QuestionImageDisplay`** — Props: `url: string`, `context: 'host'|'participant'`. Pure display, `object-fit: contain`, context-specific max-height (see §12). Used in: Host Question, Participant Answer.

**`Timer`** — Props: `secondsLeft: number`, `totalSeconds: number`, `size: 'lg'|'md'`. Renders a ring; `secondsLeft <= 5` → amber-600 stroke. Used in: Host Question, Participant Answer.

**`ResponseCounter`** — Props: `responded: number`, `total: number`. Used in: Host Question.

**`ResultBar`** — Props: `label: string`, `percent: number`, `count?: number`, `variant: 'quiz-correct'|'quiz-other'|'poll'`. Color per variant (success-600 / brand-500 / teal-500). Used in: QUIZ/POLL Result (host + participant).

**`Leaderboard` / `LeaderboardRow`** — Props: `entries: LeaderboardEntry[]`, `highlightId?`. Used in: Host Leaderboard, Host Final Results.

**`ParticipantLeaderboard`** — Props: `entries: LeaderboardEntry[]` (nearby ranks or top 5), `myRank: number`. Distinct compact styling from `Leaderboard`. Used in: `/play/[sessionId]` after QUIZ result.

**`ExcelImportDialog`** — Props: `open`, `onOpenChange`, `onImportQuestions: (questions: Question[]) => void`. Owns the `ImportState` state machine (`empty → selected → validating → preview → importing → success`), calls `parseExcelFile` (`lib/excel/parse.ts`) + `validateImportRow` (`lib/excel/validate.ts`) per row, and on confirm calls `onImportQuestions` with only the valid rows' pre-built `Question`s (in file order). Resets to `empty` whenever it closes. Used in: Quiz Editor ("Import Excel" button).

**`ExcelDropzone`** — Props: `onFileSelected: (file: File) => void`, `onDownloadTemplate: () => void`, `disabled?`. Drag-and-drop + Browse + Download Template (`lib/excel/template.ts`'s `generateTemplateBlob`, downloaded client-side, never sent anywhere). Used in: `ExcelImportDialog`, `empty` state.

**`ExcelImportSummary`** — Props: `fileName: string`, `summary: ImportSummary` (`{total, quizCount, pollCount, validCount, errorCount}`). Used in: `ExcelImportDialog`, `preview` state.

**`ExcelPreviewTable`** — Props: `rows: ValidatedImportRow[]` (an `ImportPreviewRow` plus an optional `builtQuestion`). Renders row/type/question/status/error columns; error rows get an error-100 background.

**`ExcelValidationMessage`** — Props: `errorColumn?: string`, `errorMessage?: string`. Renders `**{column}** · {message}` (e.g. "**Correct Answer** · POLL không được có Correct Answer") or nothing when there's no error. Used in: `ExcelPreviewTable`'s Error column.

**`ReconnectOverlay`** — Props: `status: 'reconnecting'|'failed'`, `onRetry?`, `onLeave?`. Semi-opaque overlay over current screen content (keeps context visible underneath). Used in: any participant/host live route.

**`GameQRCode`** — Props: `url: string`, `size?: number`. Renders a QR code for `url`; never constructs or hard-codes a URL/domain itself — the caller always resolves the join URL (client-side, from the page's own origin) and passes it in. Used in: Host Lobby.

**`GamePin`** — Props: `pin: string`. Large projector-scale PIN display. Used in: Host Lobby, alongside `GameQRCode` in a `QR | PIN` layout (stacks vertically <640px).

**`JoinInstructions`** — Props: `text?: string` (default "Quét QR hoặc nhập PIN để tham gia"). Used in: Host Lobby.

**`CopyJoinLinkButton`** — Props: `url: string`. Copies `url` to the clipboard and shows a toast ("Đã sao chép liên kết" / error fallback). Used in: Host Lobby.

**`HostLobbyPanel`** — Responsibility: composes `GameQRCode` + `GamePin` + `JoinInstructions` + `CopyJoinLinkButton` + participant chips + Start Game for `/host/[sessionId]/lobby`. Props: `sessionCode: string`, `pin: string`, `participants: Participant[]`. State: `joinUrl` — seeded with the relative path (`/join/[sessionCode]`) so server and first client render match, then upgraded to an absolute URL (`window.location.origin + ...`) after mount to avoid a hydration mismatch.

**`PinInput`** — Props: `value: string`, `onChange: (value: string) => void`, `error?: string`, `disabled?: boolean`. Numeric, 6-digit, large centered text; labelled (sr-only `<label for="game-pin">`), error linked via `aria-describedby`/`role="alert"`. Used in: Join Game (`/join`).

**`AvatarChip`** — Props: `nickname: string`, `size?: 'md'|'lg'`. Decorative (`aria-hidden`) initials circle — the adjacent visible nickname text is what's announced to assistive tech, not this chip. Used in: Waiting Room.

**`TrainerSidebarDrawer`** — Responsibility: menu-button + `Sheet` (`side="left"`) wrapping `SidebarNavList`, visible only `<1024px` (`SidebarNav`'s fixed `<aside>` takes over `≥1024px`). No props — reads the active route itself via `usePathname`. Closes on navigation. Used in: `NavBar`, every Trainer route.

**`EmptyState`** — Props: `title: string`, `description?: string`, `action?: ReactNode`. Generic empty-state block (dashed border, centered). Used in: My Quizzes (no quizzes), Trainer Dashboard (no recent sessions) — not used for "search, 0 results" (see `QuizList`).

**`SearchInput`** — Props: `id: string`, `label: string` (visually hidden, paired via `htmlFor`), `value: string`, `onChange: (value: string) => void`, `placeholder?: string`. Wraps `Input` (shadcn) with a leading search icon. Used in: My Quizzes.

**`RecentSessionItem`** — Props: `session: RecentSessionSummary` (mock-only shape — see §16). Renders `{quizTitle} · {relative hostedAt} · {participantCount} người tham gia` + Edit/Host actions. Used in: Trainer Dashboard.

**`QuizList`** — Props: `quizzes: Quiz[]` (already filtered by the caller). Renders `QuizListHeader` + one `QuizRow` per quiz, horizontally scrollable below ~820px; renders an inline "Không tìm thấy quiz phù hợp." message (no CTA) when the array is empty — distinct from the full-library `EmptyState`. Used in: My Quizzes.

**`QuizRow`** — Props: `quiz: Quiz`. One row: title, question count, mix (`"{n} QUIZ · {n} POLL"`, computed from `quiz.questions`), updated (relative time), `QuizStatusBadge`, actions (Edit → `/quizzes/[quizId]`, Host → `/host/[quizId]/lobby`, `DropdownMenu` "···" → Duplicate/Delete). Used in: My Quizzes.

**`QuizStatusBadge`** — Props: `status: Quiz['status']`. Pill; `published` = background/brand-500, `draft` = muted/muted-foreground. Used in: `QuizRow`.

---

## 5. TypeScript Domain Types

```ts
export type QuestionType = 'QUIZ' | 'POLL';

export interface AnswerOption {
  id: string;
  label: string;          // 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  text: string;
  isCorrect?: boolean;     // QUIZ only, undefined for POLL
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  imageUrl?: string;       // max 1 image, uploaded manually
  imageFileName?: string;  // local file name (a11y alt text) — no backend storage
  imageMimeType?: string;  // client-validated MIME type of the uploaded file
  options: AnswerOption[]; // QUIZ: 2-4, POLL: 2-6
  timerSeconds: number;
  points?: number;         // QUIZ only
  order: number;
  isComplete: boolean;
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  status: 'draft' | 'published';
  updatedAt: string;
}

export type SessionPhase = 'lobby' | 'question' | 'result' | 'leaderboard' | 'final';

export interface GameSession {
  id: string;
  quizId: string;
  pin: string;
  phase: SessionPhase;
  currentQuestionIndex: number;
  currentQuestion?: Question;
}

export interface Participant {
  id: string;
  nickname: string;
  connectionStatus: 'connected' | 'reconnecting' | 'disconnected';
  totalScore: number;
}

export interface ParticipantAnswer {
  participantId: string;
  questionId: string;
  optionId: string | null;  // null = timed out with no answer
  submittedAt: string;
  isCorrect?: boolean;      // QUIZ only
  pointsAwarded?: number;   // QUIZ only
}

export interface QuestionResult {                 // QUIZ
  questionId: string;
  correctOptionId: string;
  distribution: { optionId: string; count: number; percent: number }[];
  correctRate: number;
  responseCount: number;
}

export interface PollResult {                      // POLL — no correct/incorrect/score
  questionId: string;
  distribution: { optionId: string; count: number; percent: number }[];
  responseCount: number;
}

export interface LeaderboardEntry {
  rank: number;
  participantId: string;
  nickname: string;
  score: number;
}

export type ImportRowStatus = 'valid' | 'error';

export interface ImportPreviewRow {
  row: number;
  type: QuestionType;
  question: string;
  status: ImportRowStatus;
  errorColumn?: string;
  errorMessage?: string;
}

export type ImportState = 'empty' | 'selected' | 'validating' | 'preview' | 'importing' | 'success';

export type ImageUploadStatus = 'empty' | 'drag-over' | 'uploading' | 'preview' | 'error';

export interface ImageUploadState {
  status: ImageUploadStatus;
  url?: string;
  fileName?: string;
  errorMessage?: string;
}
```

> **Forward-compat note (roadmap, not implemented):** `Question`, `AnswerOption`, `Quiz`, and
> `QuestionType` are shared between the current Live Quiz mode and a possible future Post-test
> mode — keep them neutral (no `Live`-prefixed names, no hard dependency on `GameSession`/
> `SessionPhase`). Same for the image concept behind `imageUrl` /
> `QuestionImageUpload`/`QuestionImageDisplay`. See `ROADMAP_ASSESSMENT.md` at the repo root for
> the full future activity-mode / Assessment rules — nothing there is implemented yet.

---

## 6. QUIZ / POLL Component Rules

**Implemented as `ParticipantAnswerOption`** (`components/participant/`) — the participant-facing half of what this section originally called `AnswerOptionPlayer`; the Host-side read-only variant (`components/game/AnswerOptionPlayer.tsx`) is still spec'd but not built (no Host Live controller yet).

**QUIZ `ParticipantAnswerOption` states**: `default → selected (pending confirm)` during `QUESTION_ACTIVE`; then the options are **replaced by `AnswerSubmittedState`** once submitted (not rendered disabled-in-place) — so there's no `submitted`/`disabled` visual state on the option itself. `correct`/`incorrect` exist on the component's type but are only ever passed once a result is known, and only from a payload that already went through `lib/game/participant-question.ts`'s security boundary.

**POLL `ParticipantAnswerOption` states**: `default → selected` only. **Never** renders `correct`/`incorrect` — enforced as a discriminated union (`variant: 'poll'` props literally don't have a `state` value for them, a compile error, not just a visual convention) in `ParticipantAnswerOption`'s prop types.

---

## 7. Participant Answer Interaction — Select + Confirm

```
tap option → state: selected (option border = brand-700 for QUIZ / teal-500 for POLL)
  → participant may tap a different option (re-selects, no submit yet)
  → tap "Gửi câu trả lời" (disabled while nothing selected)
    → state: submitted, all options disabled/locked
    → CTA disabled, replaced by "Đã gửi câu trả lời"
    → wait for host to end question / timeout
```
Applies identically to QUIZ and POLL. After submit: answer is immutable client-side (no re-submit), CTA disabled, submitted confirmation UI shown (§ Screen 20).

---

## 8. Design Tokens — Colors

| Token | Hex | CSS var suggestion | Tailwind suggestion |
|---|---|---|---|
| brand-900 | `#07294f` | `--brand-900` | `bg-brand-900` |
| brand-700 | `#1d4371` | `--brand-700` | `bg-brand-700` (primary) |
| brand-500 | `#345f95` | `--brand-500` | `bg-brand-500` |
| brand-100 | `#e2ecf9` | `--brand-100` | `bg-brand-100` |
| teal-500 | `#2ca2a2` | `--teal-500` | `bg-teal-500` |
| teal-100 | `#d5f2f1` | `--teal-100` | `bg-teal-100` |
| amber-600 | `#d6810c` | `--amber-600` | `bg-amber-600` (warning) |
| amber-500 | `#e99b2a` | `--amber-500` | `bg-amber-500` |
| amber-100 | `#ffebd2` | `--amber-100` | `bg-amber-100` |
| success-600 | `#1e7729` | `--success-600` | `bg-success-600` |
| success-100 | `#d7f5d7` | `--success-100` | `bg-success-100` |
| error-600 | `#be222a` | `--error-600` | `bg-error-600` |
| error-100 | `#ffe5e1` | `--error-100` | `bg-error-100` |
| background | `#f2f6f9` | `--background` | `bg-background` |
| surface | `#ffffff` | `--surface` | `bg-surface` |
| border | `#dfe2e4` | `--border` | `border-border` |
| border-strong | `#cbced1` | `--border-strong` | `border-border-strong` |
| text-heading | `#181b1d` | `--text-heading` | `text-heading` |
| text-body | `#4a4e50` | `--text-body` | `text-body` |
| text-muted | `#7d8183` | `--text-muted` | `text-muted-foreground` |

Wire these as CSS variables in `globals.css` and extend `tailwind.config.ts` `theme.colors` to reference them (`brand: { 900: 'var(--brand-900)', 700: ..., ... }`), so shadcn's `--primary` etc. can alias to `brand-700`.

---

## 9. Typography Tokens

| Style | Font | Size | Weight | Line-height | Tailwind |
|---|---|---|---|---|---|
| Display | Manrope | 40px | 800 | 48px | `font-display text-[40px] font-extrabold leading-[48px]` |
| H1 | Manrope | 32px | 700 | 40px | `text-[32px] font-bold leading-[40px]` |
| H2 | Manrope | 24px | 700 | 32px | `text-2xl font-bold leading-[32px]` |
| H3 | Manrope | 19px | 600 | 28px | `text-[19px] font-semibold leading-[28px]` |
| Body Large | Inter | 17px | 500 | 26px | `text-[17px] font-medium leading-[26px]` |
| Body | Inter | 16px | 400 | 24px | `text-base leading-6` |
| Label | Inter | 13px | 600 | 18px | `text-[13px] font-semibold uppercase tracking-wide` |
| Caption | Inter | 12px | 400 | 16px | `text-xs leading-4` |
| Button | Inter | 14px | 600 | 20px | `text-sm font-semibold leading-5` |

Load both via `next/font/google`; set `--font-manrope` / `--font-inter` and map in `tailwind.config.ts` `fontFamily`. **Body text on any participant-facing screen must never render below 16px** — enforce via a lint rule or a shared `ParticipantText` wrapper that clamps `min` size.

---

## 10. Spacing / Radius / Shadow

- **Spacing scale (px)**: 4, 8, 12, 16, 24, 32, 48, 64 → Tailwind's default scale already covers these (`1, 2, 3, 4, 6, 8, 12, 16`); no custom scale needed, just use existing utilities consistently.
- **Radius**: `8px` (sm, default button/input) · `10px` (md, larger button/input) · `12px` (lg, card/modal) · `9999px` (pill, badge only). Add to `tailwind.config.ts` `borderRadius: { sm: '8px', md: '10px', lg: '12px' }` (pill already covered by `rounded-full`).
- **Shadow**: `sm: 0 1px 2px rgba(15,23,42,0.04)` (card default) · `md: 0 4px 12px rgba(15,23,42,0.06)` (card hover/dropdown) · `lg: 0 12px 32px rgba(15,23,42,0.10)` (modal/popover). Add as `boxShadow: { sm, md, lg }` in Tailwind config, overriding defaults.

---

## 11. Responsive Specification

**Desktop ≥1024px**: Trainer/Host primary. Full sidebar, multi-column tables, Host screens at large projector-scale type (question text ≥28px).

**Tablet 768–1023px**: Quiz Editor sidebar → drawer (slide-over triggered by a menu button in the top bar). Reduce horizontal padding (24px → 16px). Tables that don't fit scroll horizontally inside a bounded container (`overflow-x-auto`), never break page layout. No flow changes.

**Mobile <768px**: Participant primary, viewport reference 390×844.
- `QuestionImageDisplay` (participant): `object-fit: contain`, `max-height: 200px` (≈24% of an 844px viewport), never crops.
- `QuestionImageDisplay` (host/projector): `max-height: 30vh`, contain, positioned between question text and options so options stay visible.
- `AnswerOptionPlayer` (participant): `min-height: 56px` (comfortably exceeds the 44px touch minimum), full-width.
- Confirm CTA ("Gửi câu trả lời"): **sticky/fixed to the bottom** of the viewport (`position: sticky; bottom: 0`) with a solid background and top border/shadow so it never scrolls out of reach.
- POLL with 5–6 options: the options list becomes an internal scroll container (`max-height` capped, `overflow-y: auto`) sitting between the fixed header (timer/question/image) and the fixed-bottom confirm CTA — the CTA itself never scrolls.

---

## 12. Image Component Specification

**Implemented (Phase 3 foundation, Phase 4 completes real file selection).**

**`QuestionImageUpload`** (editor)
| State | Behavior |
|---|---|
| empty | Dashed dropzone, "kéo thả hoặc Browse" |
| drag-over | Dropzone border/background shifts to brand-100/brand-700 |
| uploading | ~650ms simulated progress bar + "Đang tải ảnh lên…" (not cancellable — too brief to warrant it) |
| preview | Shows image thumbnail + Replace / Remove actions |
| error | Inline error-600 message below dropzone (or below the retained preview, on a failed Replace), previous image (if any) retained |

Allowed types: `image/jpeg, image/png, image/webp`. Max size: 5MB. Max: 1 per question. Reject with inline error otherwise; never silently downscale or convert. Uses `URL.createObjectURL` (revoked on replace/remove/unmount) — never uploaded anywhere.

**`QuestionImageDisplay`** (read-only, host & participant) — spec in §11.

---

## 13. Excel Import Specification

**Implemented (Phase 4).** `ExcelImportDialog` states: `empty → selected → validating → preview → importing → success`.

- **empty**: Download Template (`lib/excel/template.ts`), `ExcelDropzone` (drag-and-drop or Browse, `.xlsx` only).
- **selected/validating**: filename + progress + "Đang kiểm tra dữ liệu…".
- **preview**: `ExcelImportSummary` (file name, total, QUIZ, POLL, valid, error counts) + `ExcelPreviewTable`. Every error row carries `errorColumn` + a human `errorMessage` when the offending column is known (row/type/question/status always shown regardless).
- **0 valid rows**: `Import N câu hợp lệ` CTA disabled (N=0) — only Upload lại file / Cancel remain usable.
- **importing**: brief loading state, then the valid rows' pre-built `Question`s are appended to the live Quiz Editor state (`useQuizEditor`'s `importQuestions`) in file order, and the first imported question is auto-selected.
- **success**: toast ("Đã import N câu hỏi"), dialog closes.

**Template columns** (`lib/excel/template.ts`, must match header names exactly — matching is case/whitespace-insensitive): `Type`, `Question`, `Option A`–`Option F`, `Correct Answer`, `Time`, `Points`. No image-URL column — images are always uploaded manually after import, never referenced from Excel.

**Validation rules** (`lib/excel/validate.ts`, one error per row — never auto-corrected):
`Type` must be `QUIZ`/`POLL` · `Question` required · `Option A`/`Option B` required · options must be filled contiguously from A (no gaps) · QUIZ ≤4 options, POLL ≤6 · QUIZ requires `Correct Answer` matching a filled option (A–D) · POLL must leave `Correct Answer` blank · `Time` must be a positive number · QUIZ `Points` must be a positive number · POLL `Points` must be 0 or blank.

Security: parsing never executes macros or formulas (only a formula's last computed result is read as text); a wrong extension or corrupt/non-.xlsx file is caught with a friendly inline message, never a crash; cell content is only ever rendered as plain React text (auto-escaped), never trusted as HTML/executable content.

---

## 14. Loading / Empty / Error States — Developer Behavior

| State | Behavior |
|---|---|
| Loading quizzes | Skeleton rows in `QuizTable` (3–5 placeholder rows) |
| Empty quizzes | Illustration/placeholder + "Chưa có quiz nào" + Create Quiz CTA |
| Empty results | "Chưa có session nào" in `Results Dashboard` |
| Invalid PIN | Inline error under `PinInput`, no navigation |
| Invalid/expired session code (QR or Join Link) | Blocking message on `/join/[sessionCode]` + link back to `/join` to enter a PIN instead |
| Duplicate nickname | Inline error under nickname `TextInput`, no navigation |
| Game already started | Blocking message on `/join`, no Waiting Room entry |
| Game ended | Blocking message on `/join` |
| Image upload error | Inline error in `QuestionImageUpload`, previous image retained |
| Excel validation error | Row-level errors in `ExcelPreviewTable`; "Import Valid Questions" still enabled if ≥1 valid row |
| Network disconnected | `ReconnectOverlay` (status=reconnecting) over current screen, input blocked |
| Reconnecting | Same overlay, spinner + "Đang kết nối lại…" |
| Reconnect failed | Overlay switches to status=failed: "Không thể kết nối" + Retry / Leave session |

---

## 15. Accessibility Handoff

- Text contrast: body text ≥4.5:1 against its background; headline-scale (H1/H2) ≥3:1. Never rely on brand-100/teal-100 tints alone under body text — pair with text-heading/text-body, not a lightened brand color.
- Focus visible: `2px solid brand-700` ring with `2px` offset on every interactive element, including `AnswerOptionPlayer` — implement via a shared Tailwind `focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2` utility class.
- Keyboard navigation: all editor and host controls reachable via Tab; `AnswerOptionPlayer` must be a real `<button>`/`role="radio"` (radiogroup for the option set), not a styled `<div>` with only an onClick.
- Touch targets: ≥44×44px on every participant-facing interactive element; `AnswerOptionPlayer` uses `min-height: 56px` (see §11).
- ARIA: options list as `role="radiogroup"` with `aria-label` = question text; Timer as `aria-live="polite"` announcing remaining seconds at intervals, not every tick; `ReconnectOverlay` as `role="alert"`.
- Never color-only: correct/incorrect always icon (✓/✗) + text ("Đúng"/"Sai"), never border-color alone. QUIZ/POLL badges carry text, not just color.
- Charts (`ResultBar`) always render the numeric `%`/count label next to the bar, never bar-length-only.

---

## 16. Mock Data Specification

Provide a `mocks/` module (e.g. `mocks/quizzes.ts`, `mocks/session.ts`) covering:
- **3 quizzes**: (1) `Onboarding Quiz` — 10 questions, mixed 8 QUIZ / 2 POLL, published; (2) `Compliance Refresher` — 6 questions, all QUIZ, published; (3) `Team Pulse Check` — 4 questions, all POLL, draft.
- **`participants: Participant[]`**: 12 entries with varied `connectionStatus` (mostly `connected`, 1 `reconnecting`).
- **Active QUIZ question** mock with 4 options, 1 correct, 20s timer, 1000 points, optional `imageUrl`.
- **Active POLL question** mock with 3 options, 15s timer, no correct/points.
- **`QuestionResult` mock** for the QUIZ question (distribution summing to 100%, correctRate 62%).
- **`PollResult` mock** for the POLL question (distribution summing to 100%, no correct field at all — omit the key, don't set it to null, to make its absence type-checkable).
- **`LeaderboardEntry[]`** mock (5 entries, descending score, one tie).
- **`Game Report` mock**: overview numbers + `ParticipantAnswer[]` for 1 full session + one QUIZ analysis row + one POLL analysis row.
- **`ImportPreviewRow[]`** mock: 4 rows, 2 valid, 2 with distinct error types (multiple correct answers; correct-answer column present on a POLL row) — matches the example already shown in High-Fidelity V1.
- **Join flow resolvers** (Phase 5, updated): `resolveSessionByPin(pin)` and `resolveSessionByCode(sessionCode)` in `mocks/session.ts`, both looking up the single mock `GameSession` — `id` (sessionCode) and `pin` are now the **same value, `"123456"`** (this mock has no concept of a separate opaque session code yet, so PIN entry and QR/Join Link resolve identically either way). Also: `getSessionQuizTitle(session)` (looks up the quiz title via `quizId`, for Nickname Entry / Waiting Room) and `isNicknameTaken(nickname)` (case-insensitive check against `mockParticipants`, backing the "duplicate nickname" mock state). Frontend-only stand-ins for what a real backend will resolve server-side.
- **Gameplay sequence** (Phase 6, added): `mockGameplayQuestions`/`mockGameplayResults`/`getGameplayResult` in `mocks/gameplay.ts` — 4 fixed questions covering every combination the manual tests need (QUIZ+image, QUIZ no image, POLL×4 options, POLL×6 options), reusing `mockActiveQuizQuestion`/`mockQuestionResult` from `mocks/session.ts` for question 1. Drives `/play/[sessionId]`'s entire gameplay loop.
- **`RecentSessionSummary[]`** mock (added): `mockRecentSessions` in `mocks/session.ts` — 3 entries referencing the 2 published quizzes, `hostedAt` computed as `Date.now() - offset` (not a fixed ISO string) so "2 giờ trước" stays accurate whenever the dashboard is viewed. Not a core domain type — `GameSession` alone has no quiz title or hosted-at timestamp.

---

## 17. Implementation Order

1. Design tokens (Tailwind config, CSS vars, fonts) + base `ui/` components (shadcn button/input/dialog/badge/progress/toast configured with tokens).
2. Trainer Dashboard + My Quizzes (routes, mock data, `NavBar`/`SidebarNav`).
3. Quiz Editor + QUIZ/POLL question editors (the largest single piece — build `QuestionList`, both editors, validation).
4. Image Upload UI + Excel Import UI (both are self-contained modals/panels, safe to build against mocks in isolation).
5. Participant Join + Nickname + Waiting Room.
6. Participant Question + Result (+ Participant Leaderboard) — implement Select + Confirm state machine once, reuse for QUIZ/POLL.
7. Host Lobby + Host Live (Question/Result/Leaderboard/Final) — reuse `AnswerOptionPlayer`/`Timer`/`ResultBar` built in phase 6.
8. Reporting (Results Dashboard + Game Report).
9. Responsive pass (tablet drawer, mobile sticky CTA/scroll) + accessibility pass (focus rings, ARIA, contrast check) + QA against this document.

No backend/realtime wiring in phases 1–9 unless separately requested — build entirely against `mocks/`.

---

## 18. Deliverables in this document
1. Route Map — §2
2. Screen Specification — §3
3. Component Inventory — §4 (tree)
4. Component Props Specification — §4 (per-component)
5. Frontend Domain Types — §5
6. Design Tokens — §8–10
7. Responsive Rules — §11
8. State Matrix — §6, §13, §14
9. Mock Data Specification — §16
10. Implementation Sequence — §17

## Files
Design references (same project):
- `RayCert - Product Flow & Sitemap.dc.html`
- `RayCert - Design System V1.dc.html`
- `RayCert - Wireframe V1.dc.html`
- `RayCert - High-Fidelity V1.dc.html`

Copies of these are included alongside this README for reference.
