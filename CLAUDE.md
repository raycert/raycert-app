# CLAUDE.md — RayCert

## 1. Sản phẩm
**RayCert** là nền tảng quiz đào tạo realtime cho đào tạo doanh nghiệp.
Tagline tạm thời: **Train. Engage. Certify.**

RayCert lấy cảm hứng từ cơ chế chơi của các nền tảng live quiz, nhưng phải có thương hiệu, giao diện, dữ liệu và trải nghiệm riêng. Không sao chép logo, màu sắc đặc trưng, asset, âm thanh, animation hay bố cục chính xác của Kahoot.

## 2. Scope câu hỏi
Chỉ có 2 loại:

### QUIZ
- Trắc nghiệm chọn 1 đáp án đúng.
- 2–4 lựa chọn.
- Chính xác 1 đáp án đúng.
- Có đúng/sai.
- Có điểm.
- Có thể có thưởng tốc độ.
- Có leaderboard.

### POLL
- Bình chọn.
- 2–6 lựa chọn.
- Không đáp án đúng.
- Không đúng/sai.
- Không điểm.
- Không thay đổi leaderboard.
- Chỉ hiển thị phân bố bình chọn.

Không tự thêm loại câu hỏi thứ 3.

## 3. Vai trò
### Host / Giảng viên
- Đăng nhập.
- Tạo/sửa quiz.
- Thêm QUIZ/POLL.
- Host game.
- Sinh PIN 6 số.
- Xem lobby.
- Start/end câu hỏi.
- Xem response count, result, leaderboard, report.

### Participant
- Không cần permanent account trong MVP.
- Nhập PIN + nickname.
- Vào waiting room.
- Trả lời realtime.
- QUIZ: xem đúng/sai và điểm sau khi câu đóng.
- POLL: xem phân bố bình chọn sau khi câu đóng.

## 4. Stack
- Next.js App Router
- React + TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase PostgreSQL
- Supabase Realtime Broadcast
- Supabase Auth cho Host
- Zod
- pnpm

Không tự thêm Prisma, Drizzle, Firebase, Socket.IO, Redis, GraphQL, Kafka, microservices.

## 5. Nguyên tắc
- PostgreSQL là persistent source of truth.
- Realtime chỉ dùng đồng bộ/broadcast.
- Server quyết định score, đúng/sai, timer, game state, quyền.
- Không tin score/timestamp do client tự tính.
- Không gửi correctOptionId/isCorrect của QUIZ trước khi câu đóng.
- SUPABASE_SERVICE_ROLE_KEY chỉ server-side.

## 6. Data model
### quizzes
id, owner_id, title, description, status, created_at, updated_at

### questions
id, quiz_id, question_type, question_text, time_limit_seconds, base_points, display_order, created_at, updated_at

question_type chỉ: `QUIZ | POLL`
- QUIZ: base_points > 0
- POLL: base_points = 0

### answer_options
id, question_id, option_text, display_order, is_correct
- QUIZ: 2–4 option, đúng 1 is_correct=true
- POLL: 2–6 option, tất cả is_correct=false

### game_sessions
id, quiz_id, host_id, game_pin, status, current_question_index, current_question_started_at, started_at, ended_at, created_at

Status: WAITING, ACTIVE, QUESTION_ACTIVE, QUESTION_RESULTS, FINISHED

### participants
id, game_session_id, nickname, participant_token, score, joined_at, last_seen_at
Nickname duy nhất trong một game session.

### participant_answers
id, game_session_id, participant_id, question_id, answer_option_id, submitted_at, response_ms, is_correct, points_awarded
- 1 participant chỉ trả lời 1 lần mỗi câu.
- QUIZ: is_correct true/false.
- POLL: is_correct null, points_awarded=0.

## 7. Realtime events
- participant:joined
- participant:left
- lobby:updated
- game:started
- game:ended
- question:started
- answer:accepted
- answer:count_updated
- question:ended
- question:results
- leaderboard:updated

Dùng chung engine cho QUIZ/POLL. Payload question:started phải có questionType.

## 8. QUIZ flow
Start → Answer → Server validate → đúng/sai → tính điểm → lưu → End → correct answer + distribution → leaderboard.

## 9. POLL flow
Start → Vote → Server validate → lưu → points=0 → End → poll distribution → next question. Không đổi score/rank.

## 10. Scoring
Chỉ QUIZ:
- đúng: 1000 + speed bonus 0–300
- sai: 0

Ví dụ:
speedRatio = max(0, remainingTimeMs / totalTimeMs)
speedBonus = round(speedRatio * 300)
score = 1000 + speedBonus

Server tính điểm.

## 11. Frontend
### Host
Desktop-first, projector-friendly: PIN lớn, timer rõ, response count rõ, action chính rõ, leaderboard đọc được từ xa.

### Participant
Mobile-first: nút lớn, ít chữ, dễ bấm bằng 1 tay, submitted state rõ, không submit lần hai.

### Branding
Tên: **RayCert**
Tagline: **Train. Engage. Certify.**
Phong cách: modern, clean, professional, training-oriented, interactive, playful nhẹ.

## 12. Quiz Builder
Chỉ cho Add Question:
- Trắc nghiệm
- Bình chọn

QUIZ Editor: question + 2–4 option + correct answer + timer + points.
POLL Editor: question + 2–6 option + timer; không correct answer/points.

## 13. Analytics
QUIZ: correct rate, incorrect rate, score, response time, rank, knowledge gap.
POLL: vote count, %, participation rate.
Không đưa POLL vào average correct rate/average score.

## 14. Code structure
app/
components/{quiz,poll,game,leaderboard,reports,ui}/
lib/{supabase,game,validation,scoring,realtime,analytics}/
types/
supabase/migrations/

## 15. Workflow
Chỉ làm từng milestone.
Trước khi code: đọc CLAUDE.md + MASTER_PLAN.md, nêu kế hoạch, file sẽ sửa/tạo.
Sau khi code: formatter/lint, typecheck, build, sửa lỗi, hướng dẫn test.
Không tự mở rộng scope.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
