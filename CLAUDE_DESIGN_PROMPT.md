# CLAUDE_DESIGN_PROMPT.md — RayCert

Thiết kế toàn bộ UI/UX cho nền tảng quiz đào tạo realtime tên **RayCert**.
Tagline tạm thời: **Train. Engage. Certify.**

RayCert dành cho đào tạo doanh nghiệp: trainer tạo quiz, host phiên realtime, participant join bằng PIN trên điện thoại, trả lời, xem kết quả và báo cáo.

Không sao chép logo, màu sắc đặc trưng, asset, animation hay bố cục chính xác của Kahoot.

## 1. Chỉ có 2 loại câu hỏi
### QUIZ
- 2–4 lựa chọn
- 1 đáp án đúng
- đúng/sai
- có điểm
- có leaderboard

### POLL
- 2–6 lựa chọn
- không đáp án đúng
- không đúng/sai
- không điểm
- không đổi leaderboard
- chỉ distribution

Không thiết kế loại câu hỏi thứ 3.

## 2. Trainer Flow
Dashboard → My Quizzes → Create/Edit Quiz → Add Question → QUIZ/POLL → Save → Preview → Host → Lobby → Start → Questions → Results → Final Result → Report.

## 3. Participant Flow
Join → PIN → Nickname → Waiting Room → Question → Submit → Waiting/Submitted → Result → Next Question → Final Result.

## 4. QUIZ Flow
Host: Start → question + timer + response count → End/timeout → correct answer + distribution → leaderboard → next.
Participant: answer → locked → sau khi đóng mới thấy đúng/sai + điểm.

## 5. POLL Flow
Host: Start Poll → timer + vote count → End/timeout → distribution → next.
Participant: vote → locked → xem distribution.
Không correct/incorrect, score, rank.

## 6. Screens
1. Home
2. Join Game
3. Nickname Entry
4. Waiting Room
5. Trainer Dashboard
6. My Quizzes
7. Create Quiz
8. Quiz Editor
9. Add Question
10. QUIZ Editor
11. POLL Editor
12. Quiz Preview
13. Quiz Detail
14. Host Lobby
15. Host Question
16. Participant QUIZ Answer
17. Participant POLL Answer
18. Submitted State
19. QUIZ Result — Host
20. QUIZ Result — Participant
21. POLL Result — Host
22. POLL Result — Participant
23. Leaderboard
24. Final Results
25. Results Dashboard
26. Game Report
27. Empty/Loading/Error/Reconnecting states

## 7. Host UX
Desktop-first, projector-friendly.
Host Lobby ưu tiên PIN → participant count → names → Start.
Host Question ưu tiên question → timer → response count → state → End Question.

## 8. Participant UX
Mobile-first, dùng một tay.
Nút đáp án lớn, ít chữ, tap target lớn, submitted state rõ, không submit lần 2.
QUIZ chỉ có correct/incorrect sau khi đóng.
POLL tuyệt đối không có correct/incorrect styling.

## 9. Quiz Builder
Desktop-first:
- sidebar trái: list câu hỏi
- main canvas: editor
- top bar: tên quiz, Save, Preview, Host
- Add Question chỉ có Trắc nghiệm/Bình chọn

QUIZ Editor: question + 2–4 options + correct answer + timer + points.
POLL Editor: question + 2–6 options + timer; không correct answer/points.

## 10. Visual Direction
Modern, clean, professional, friendly, corporate training, interactive, playful nhẹ.
Nền sáng, neutral tốt, accent riêng, card lớn, whitespace tốt, typography mạnh, ít gradient.
Không neon/cyberpunk/cartoon/game-show/clone Kahoot.

## 11. Branding
Đề xuất:
- logo direction
- wordmark
- icon concept
- primary/secondary/accent colors
cho **RayCert**, tránh liên tưởng trực tiếp đến Kahoot.

## 12. Design System
Đề xuất:
- colors: primary, secondary, accent, success, warning, error, neutrals, background, surface
- typography: H1/H2/H3/body/label/button/caption
- spacing scale
- radius scale
- shadow levels
- components: Button, Input, Textarea, Select, Card, Question Card, Answer Button, QUIZ/POLL Badge, Timer, Progress, Modal, Sidebar, Tabs, Table, Leaderboard Row, Result Bar, Empty State, Toast, Confirm Dialog

Không dùng font chính dưới 16px trên participant screens.

## 13. States
default, hover, focus, selected, disabled, loading, submitted, success, error, empty, reconnecting.
QUIZ Answer: default/selected/locked/correct/incorrect.
POLL Answer: default/selected/locked; không correct/incorrect.

## 14. Accessibility
Contrast tốt, focus rõ, không chỉ dùng màu, touch target đủ lớn, chart có text/số liệu, đúng/sai có icon/text.

## 15. Không thiết kế
AI generator, marketplace, payment, subscription, LMS, organization management, team mode, certificate, chat, media questions, loại câu hỏi khác QUIZ/POLL.

## 16. Đầu ra theo thứ tự
1. Product Flow
2. Sitemap / Screen Map
3. Design Direction + Branding
4. Design System
5. Wireframes
6. High-fidelity screens
7. Responsive behavior
8. Component Inventory
9. Developer Handoff cho Next.js + Tailwind + shadcn/ui

**Trước tiên chỉ trình bày Product Flow và Sitemap để tôi review. Chưa đi sâu vào visual design cho đến khi flow được chốt.**
