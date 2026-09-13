# MASTER_PLAN.md — RayCert

# Giai đoạn Thiết kế — UI/UX
Mục tiêu: chốt Product Flow, Sitemap, Design System, Wireframe, High-fidelity, Responsive Rules, Component Inventory và Developer Handoff trước khi backend.
Trạng thái: **ĐANG THỰC HIỆN**

# Giai đoạn 0 — Khởi tạo Frontend
- Next.js + TypeScript + Tailwind + shadcn/ui
- Design tokens + base components
- Home, Join, Waiting Room, Dashboard, My Quizzes, Quiz Builder shell, Host Lobby shell
- Mock data, chưa database
Tiêu chí: responsive, bám handoff, lint/typecheck/build pass.
Trạng thái: CHƯA BẮT ĐẦU

# Milestone 1 — Database
Bảng: profiles, quizzes, questions, answer_options, assessments, assessment_questions,
assessment_answer_options, assessment_attempts, assessment_answers, game_sessions, participants,
participant_answers.
question_type chỉ `QUIZ | POLL`.
QUIZ: 2–4 option, 1 đúng, base_points>0.
POLL: 2–6 option, không đúng, base_points=0.
Trạng thái: **Schema + RLS foundation xong (Phase 10A)**, Quiz/Assessment CRUD đã persist vào
Postgres thật (Phase 10C) — migration `supabase/migrations/20260910000000_initial_schema.sql` +
`20260911000000_public_assessment_read.sql` (participant-facing public read cho Assessment ACTIVE),
chi tiết `docs/backend/SUPABASE_SETUP.md`. Data access layer: `lib/data/quizzes.ts` +
`lib/data/assessments.ts`. Assessment questions dùng snapshot model (không reference Quiz Library)
— xem lý do trong migration + setup doc. Chưa làm: Live Game persistence/Realtime, AssessmentAttempt
persistence, Assessment Reports thật, Storage bucket thật cho banner/question image (vẫn local
upload UI, không lưu blob URL giả vào DB).

# Milestone 2 — Quiz Library & Builder
- List/Create/Edit/Archive quiz
- QUIZ editor
- POLL editor
- Validation đúng theo question type
Trạng thái: CHƯA BẮT ĐẦU

# Milestone 3 — Game Session & Lobby
Host: Quiz → Host → Session → PIN → Lobby.
Participant: Join → PIN → nickname → Waiting Room.
Realtime participant join/leave/lobby/game start.
Trạng thái: **Persistence thật xong (Phase 10D)** — Host → `/host/new?quizId=` tạo `game_sessions`
thật (PIN 6 số unique, `host_id` từ session), Lobby/Join/Waiting Room đọc/ghi participant thật.
`Realtime participant join/leave` ở milestone này **CHƯA làm** — dùng polling ~2.5s
(`hooks/use-live-poll.ts`) thay cho `postgres_changes`/Broadcast, để dành Phase 10E. Chi tiết
`docs/backend/SUPABASE_SETUP.md` §12.

# Milestone 4 — Live Question Engine
Dùng chung engine cho QUIZ/POLL.
Không leak correct answer.
Duplicate answer bị chặn.
Trạng thái: **Persistence thật xong (Phase 10D)** — `participant_answers` thật, `is_correct`/
`points_awarded` tính server-side (`lib/data/live-answers.ts`), không client nào nhận được
`isCorrect`/`correctOptionId` trước khi câu đóng (`toParticipantQuestion` strip ở type level).
Duplicate answer bị chặn ở cả app-layer lẫn DB unique constraint `(participant_id, question_id)` —
verified qua REST test thật. Chưa có: Realtime broadcast giữa participants (Phase 10E).

# Milestone 5 — Results & Scoring
QUIZ: đúng/sai, 1000 + speed bonus tối đa 300, distribution, leaderboard.
POLL: vote distribution, %, không score/rank/correct rate.
Trạng thái: **Scoring thật xong (Phase 10D)** — công thức CLAUDE.md §10 y hệt, tính từ
`current_question_started_at` thật (không tin timestamp client), `participants.score` cập nhật
thật. Leaderboard tính từ `participants.score` thật qua `getLeaderboard()`. Chưa production-grade
concurrency (read-modify-write cho score, chấp nhận race nhỏ — nằm ngoài scope phase này).

# Milestone 6 — Full Game Loop
Cho phép xen kẽ QUIZ → Result → Leaderboard → POLL → Poll Result → QUIZ...
Trạng thái: **Chạy trên dữ liệu thật (Phase 10D)** — Host điều khiển Start/Close/Next/End qua Server
Actions thật, session xen kẽ QUIZ/POLL đúng thứ tự câu hỏi thật của quiz. Participant KHÔNG còn có
sub-phase "Leaderboard" đồng bộ giữa mỗi câu (quyết định có chủ đích — xem `docs/backend/
SUPABASE_SETUP.md` §12: leaderboard giữa game của Host là UI-only, không có DB status riêng, nên
participant không có cách nào biết Host đang ở sub-phase đó nếu không có Realtime); participant chỉ
thấy leaderboard đầy đủ 1 lần ở FINISHED.

# Milestone 7 — Authentication & Ownership
Login/logout, protected dashboard, quiz ownership, host authorization.
Trạng thái: **Trainer auth thật xong (Phase 10B)** — `/login`, `/signup`, `/forgot-password`,
`/reset-password` dùng Supabase Auth thật (email/password); `proxy.ts` (Next.js 16 đổi tên từ
`middleware.ts`) bảo vệ `/dashboard`, `/quizzes`, `/assessments`, `/results`, `/host/*`, redirect
`/login` nếu chưa đăng nhập; participant routes (`/join`, `/play`, `/assessment/*` số ít) vẫn
public. Chi tiết `docs/backend/SUPABASE_SETUP.md` §8/§8b. **Quiz/Assessment ownership RLS đã áp
dụng vào query thật (Phase 10C)** — verified bằng test 2 tài khoản trainer thật qua REST API:
Trainer B không SELECT/UPDATE/DELETE được row của Trainer A (trả về rỗng/RLS-filtered), và không
spoof được `owner_id` khi INSERT (bị chặn bởi WITH CHECK, lỗi 42501). **Live Game host
authorization cũng đã thật (Phase 10D)** — `game_sessions` có RLS `host_id = auth.uid()` giống hệt
pattern `owner_id`; verified: trainer tự insert `game_sessions` qua JWT của mình trước khi migration
Phase 10D được áp dụng bị chặn 42501 (xác nhận gap có thật), và migration mới thêm policy
select/insert/update owner-scoped cho `game_sessions` + policy select-only cho host trên
`participants`/`participant_answers`.

# Milestone 8 — Reports & Training Analytics
Game Summary, Participant Analysis, QUIZ Analysis, POLL Analysis.
POLL không vào correct rate.
Sau đó mới cân nhắc Excel, Pre/Post-test, Training Course, Training Session, Knowledge Gap.
Trạng thái: CHƯA BẮT ĐẦU

# Milestone 9 — Production Hardening
RLS, rate limit, logging, reconnect, load/concurrency test, deployment, backup.
Trạng thái: CHƯA BẮT ĐẦU

# Phase 9 — Assessment / Post-test (Roadmap)
Activity mode thứ 2 bên cạnh Live Quiz hiện tại: participant tự làm bài theo tốc độ riêng,
không cần host điều khiển từng câu, không speed bonus, không leaderboard mặc định, điểm theo
% correct, có pass score/attempt/time limit toàn bài, có thể randomize question/answer, result
chỉ hiện sau submit. POLL vẫn không tính điểm. Data concept tương lai: `Assessment`,
`AssessmentAttempt`, `AssessmentAnswer` (chưa tạo schema). Chi tiết: xem `ROADMAP_ASSESSMENT.md`.
Ràng buộc: không đổi Live Quiz hiện tại; domain component dùng chung (`Question`, `AnswerOption`,
`Quiz`, `QuestionType`, `QuestionImage`) phải giữ tên trung tính, không phụ thuộc cứng vào game/live.
Trạng thái: CHƯA BẮT ĐẦU (roadmap/docs only — chưa có route, backend, database, hay field runtime nào)

# Không làm trước MVP
Loại câu hỏi thứ 3, multiple correct, open-ended, word cloud, matching, ordering, AI generator, LMS, payment, marketplace, team mode phức tạp, certificate.

# Hiện tại
**Giai đoạn Thiết kế — UI/UX**
