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
Trạng thái: **Schema + RLS foundation xong (Phase 10A)** — migration
`supabase/migrations/20260910000000_initial_schema.sql`, chi tiết
`docs/backend/SUPABASE_SETUP.md`. Assessment questions dùng snapshot model (không reference
Quiz Library) — xem lý do trong migration + setup doc. Chưa làm: migrate frontend sang dùng
database thật (vẫn mock/local — Phase 10A §27), participant-facing RLS policies đầy đủ, Realtime,
Storage bucket thật (chỉ mới document strategy). Auth (Phase 10B) build trên nền này.

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
Trạng thái: CHƯA BẮT ĐẦU

# Milestone 4 — Live Question Engine
Dùng chung engine cho QUIZ/POLL.
Không leak correct answer.
Duplicate answer bị chặn.
Trạng thái: CHƯA BẮT ĐẦU

# Milestone 5 — Results & Scoring
QUIZ: đúng/sai, 1000 + speed bonus tối đa 300, distribution, leaderboard.
POLL: vote distribution, %, không score/rank/correct rate.
Trạng thái: CHƯA BẮT ĐẦU

# Milestone 6 — Full Game Loop
Cho phép xen kẽ QUIZ → Result → Leaderboard → POLL → Poll Result → QUIZ...
Trạng thái: CHƯA BẮT ĐẦU

# Milestone 7 — Authentication & Ownership
Login/logout, protected dashboard, quiz ownership, host authorization.
Trạng thái: **Trainer auth thật xong (Phase 10B)** — `/login`, `/signup`, `/forgot-password`,
`/reset-password` dùng Supabase Auth thật (email/password); `proxy.ts` (Next.js 16 đổi tên từ
`middleware.ts`) bảo vệ `/dashboard`, `/quizzes`, `/assessments`, `/results`, `/host/*`, redirect
`/login` nếu chưa đăng nhập; participant routes (`/join`, `/play`, `/assessment/*` số ít) vẫn
public. Chi tiết `docs/backend/SUPABASE_SETUP.md` §8/§8b. Quiz ownership/host authorization ở mức
RLS (Phase 10A) đã sẵn sàng nhưng CHƯA áp dụng vào query thật (frontend vẫn mock/local — Phase
10C+ mới migrate persistence).

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
