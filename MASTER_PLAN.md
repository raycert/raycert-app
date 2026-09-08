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
Bảng: users/profiles, quizzes, questions, answer_options, game_sessions, participants, participant_answers.
question_type chỉ `QUIZ | POLL`.
QUIZ: 2–4 option, 1 đúng, base_points>0.
POLL: 2–6 option, không đúng, base_points=0.
Trạng thái: CHƯA BẮT ĐẦU

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
Trạng thái: CHƯA BẮT ĐẦU

# Milestone 8 — Reports & Training Analytics
Game Summary, Participant Analysis, QUIZ Analysis, POLL Analysis.
POLL không vào correct rate.
Sau đó mới cân nhắc Excel, Pre/Post-test, Training Course, Training Session, Knowledge Gap.
Trạng thái: CHƯA BẮT ĐẦU

# Milestone 9 — Production Hardening
RLS, rate limit, logging, reconnect, load/concurrency test, deployment, backup.
Trạng thái: CHƯA BẮT ĐẦU

# Không làm trước MVP
Loại câu hỏi thứ 3, multiple correct, open-ended, word cloud, matching, ordering, AI generator, LMS, payment, marketplace, team mode phức tạp, certificate.

# Hiện tại
**Giai đoạn Thiết kế — UI/UX**
