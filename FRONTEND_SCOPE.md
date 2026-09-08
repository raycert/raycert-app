# FRONTEND_SCOPE.md — RayCert

## Branding
Tên: **RayCert**
Tagline: **Train. Engage. Certify.**

## Khu vực
### Public
Home, Join Game (nhập PIN thủ công), Nickname Entry (`/join/[sessionCode]` — dùng chung cho QR Code, Join Link, và redirect sau khi nhập PIN hợp lệ).

### Cách tham gia session (participant)
1. Quét QR Code từ Host Lobby.
2. Bấm Join Link được trainer chia sẻ.
3. Mở RayCert, vào Join Game, nhập Game PIN thủ công.

Cách 1–2 vào thẳng Nickname Entry (session đã resolve từ URL, không hỏi lại PIN). Cách 3 nhập PIN ở `/join`, hợp lệ thì redirect sang cùng Nickname Entry. Không tạo account — participant vẫn chỉ là session + nickname.

### Participant
Waiting Room, QUIZ Answer, POLL Answer, Submitted State, QUIZ Result, POLL Result, Leaderboard/Rank, Final Result.

### Trainer
Dashboard, My Quizzes, Quiz Detail, Quiz Builder, Host Lobby, Host Question, QUIZ Result, POLL Result, Leaderboard, Results, Game Report.

## Responsive
Host: desktop-first + projector-friendly.
Participant: mobile-first + one-hand friendly.

## QUIZ UI
2–4 options, 1 đúng, score, leaderboard.

## POLL UI
2–6 options, no correct answer, no score, no rank change.

## Visual
Modern, clean, professional, corporate training, interactive, playful nhẹ.
Không clone Kahoot.
