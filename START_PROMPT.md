# START_PROMPT.md — Claude Code

Hãy đọc:
- CLAUDE.md
- MASTER_PLAN.md
- FRONTEND_SCOPE.md
- tài liệu handoff từ Claude Design nếu đã có

Project: **RayCert**
Tagline: **Train. Engage. Certify.**

Chỉ làm **Giai đoạn 0 — Khởi tạo Frontend**.

Không:
- kết nối database thật nếu chưa được yêu cầu
- realtime
- scoring backend
- auth backend
- reports backend
- thêm question type khác QUIZ/POLL

## Công nghệ
Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui, Zod, pnpm.

## Trước khi code
1. Kiểm tra repository.
2. Đọc handoff.
3. Nêu file/component sẽ tạo/sửa.
4. Không tự đổi visual direction.

## Dựng
- design tokens
- base UI components
- Home
- Join Game
- Participant Waiting Room
- Dashboard
- My Quizzes
- Quiz Builder shell
- Host Lobby shell

Dùng mock data.

Khóa domain:
`type QuestionType = "QUIZ" | "POLL"`

## Quality gates
- formatter/lint
- TypeScript typecheck
- production build
- responsive check

Chỉ đổi trạng thái Giai đoạn 0 thành HOÀN THÀNH nếu tất cả đạt.
Sau đó DỪNG.
