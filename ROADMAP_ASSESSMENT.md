# ROADMAP_ASSESSMENT.md — RayCert

**Trạng thái: ROADMAP / DESIGN-ONLY — chưa triển khai.**
Tài liệu này không tạo route, không tạo backend, không tạo database schema, không thêm field
runtime nào. Mục đích duy nhất: ghi lại kiến trúc dự kiến cho activity mode thứ 2 (Post-test)
để các phase kế tiếp (Quiz Editor, data model, v.v.) không vô tình thiết kế phụ thuộc cứng vào
Live Quiz theo cách khó mở rộng sau này.

Xem thêm: `MASTER_PLAN.md` → "Phase 9 — Assessment / Post-test".

**Cập nhật:** Phase 9A (một phase thực thi riêng, không phải tài liệu này) đã hiện thực hoá một
phần nội dung roadmap dưới đây — cụ thể là `Assessment`/`AssessmentSettings`/`AssessmentStatus`
(§2, §4) và cơ chế điểm/pass dựa trên `points` per-question + `minimumPassingPoints` (§3). Các
đoạn đã implement được đánh dấu rõ bên dưới; phần còn lại (`AssessmentAttempt`,
`AssessmentAnswer`, participant take-flow) vẫn là roadmap/chưa triển khai.

---

## 1. Activity Mode (future)

RayCert dự kiến hỗ trợ 2 activity mode dùng chung một thư viện Quiz:

```ts
// FUTURE — minh hoạ khái niệm, CHƯA thêm vào types/index.ts, chưa dùng ở runtime/database.
type ActivityMode = "LIVE_QUIZ" | "POST_TEST";
```

- **`LIVE_QUIZ`** — cơ chế hiện tại (đã triển khai Phase 0–3): host điều khiển từng câu theo
  thời gian thực qua PIN/QR/Join Link, mọi participant cùng nhịp, có speed bonus + leaderboard.
- **`POST_TEST`** — participant tự làm bài theo tốc độ riêng, không cần host present khi làm
  bài. Chi tiết rule ở mục 3.

Không thêm field `activityMode` vào `GameSession`, database, hay bất kỳ logic runtime nào ở
bước này — chỉ ghi nhận khái niệm để đặt tên/kiến trúc tương lai nhất quán.

---

## 2. Nguyên tắc: domain component dùng chung phải trung tính

Các type/component sau đây được cả `LIVE_QUIZ` lẫn `POST_TEST` sử dụng, nên **không được**
thiết kế phụ thuộc cứng vào riêng Live Quiz:

- `Question`
- `AnswerOption`
- `Quiz`
- `QuestionType`
- `QuestionImage` — khái niệm chung đứng sau `imageUrl` trên `Question` và các component
  `QuestionImageUpload` (editor) / `QuestionImageDisplay` (read-only), không phải một type mới
  cần tạo ngay.

**Hiện trạng (Phase 0–3):** các type/component này đã đặt tên trung tính sẵn (không có prefix
kiểu `Live`/`Game`) — **không cần đổi tên gì ở bước này.** Đây là ràng buộc áp dụng cho các
phase tương lai khi động tới các phần này:

- Không đặt tên kiểu `LiveQuestion`, `GameQuiz`, `LiveAnswerOption`.
- Không giả định `Question`/`AnswerOption` luôn tồn tại trong ngữ cảnh có `GameSession` đang
  chạy — component hiển thị câu hỏi/đáp án/ảnh nên nhận props dữ liệu thuần (text, options,
  imageUrl, timerSeconds...), không import trực tiếp `GameSession`/`SessionPhase`.
- `timerSeconds` trên `Question` tiếp tục là "thời gian cho câu hỏi này" — Post-test có thể
  diễn giải khác (vd. không dùng per-question timer, chỉ dùng time limit toàn bài ở cấp
  `Assessment`) mà không cần đổi field hiện tại.
- Correct-answer (`AnswerOption.isCorrect`) tiếp tục là dữ liệu thuần của `Question`, không
  gắn với riêng cách Live Quiz chấm điểm (speed bonus) — Post-test chấm % correct dùng lại
  cùng field này theo cách tính khác.

Nói cách khác: **Live Quiz và Post-test là hai "cách chơi" trên cùng một thư viện Quiz/Question
— không phải hai hệ dữ liệu câu hỏi tách biệt.**

---

## 3. Future Post-test rules (chưa triển khai)

- Participant tự làm theo tốc độ của mình, không do host điều khiển từng câu theo thời gian
  thực.
- Không cần host present/điều khiển câu hỏi trong lúc participant làm bài.
- Không speed bonus.
- Không leaderboard mặc định.
- Điểm tính theo **điểm tuyệt đối trên mỗi câu QUIZ** (`points`, trainer tự nhập, KHÔNG phải
  correct rate hay `1000 + speed bonus` của Live Quiz).
- Có **pass score dạng điểm tuyệt đối** (`minimumPassingPoints` — không phải ngưỡng %) để coi là
  đạt/không đạt.
- Có khái niệm **attempt** (một lần participant làm bài; có thể giới hạn số attempt cho phép).
- Có thể có **time limit cho toàn bài** (khác với per-question timer của Live Quiz).
- Có thể **randomize** thứ tự câu hỏi và/hoặc thứ tự đáp án mỗi attempt.
- **Result chỉ hiển thị sau khi submit** toàn bài — không hiện đúng/sai từng câu ngay như Live
  Quiz.
- **POLL không tính điểm** — giữ nguyên nguyên tắc hiện tại của POLL (CLAUDE.md §2), không đổi
  khi POLL xuất hiện trong một Assessment.

> **Cập nhật (Phase 9A addendum — đã triển khai):** cơ chế điểm/pass ở trên không còn là mô tả
> roadmap trừu tượng nữa. Đã implement cụ thể: mỗi câu hỏi QUIZ trong Assessment có field
> `points` riêng (numeric input, trainer nhập trực tiếp, mặc định 1, KHÔNG dùng dropdown preset
> của Live Quiz). `totalPoints` = tổng `points` các câu QUIZ, derive từ `questions`, không lưu
> field riêng. Điều kiện đạt = `minimumPassingPoints` (điểm tuyệt đối, field chính, KHÔNG phải
> `minimumCorrectAnswers` — field này đã bị loại bỏ khỏi domain). Công thức: `earnedPoints =
> sum(points của các câu trả lời đúng)`; `scorePercent = earnedPoints / totalPoints * 100`;
> `passed = earnedPoints >= minimumPassingPoints`. Xem `docs/design/README.md` §5 (Scoring rule)
> và `lib/assessment/scoring.ts`.

---

## 4. Future data concepts (chỉ ghi nhận, chưa tạo schema/type)

Song song với các bảng Live Quiz hiện có (`game_sessions`, `participants`,
`participant_answers` — CLAUDE.md §6), Post-test dự kiến cần 3 khái niệm mới, **không** tái sử
dụng `GameSession`/`ParticipantAnswer`:

- **`Assessment`** — một "bài" Post-test — **đã implement ở Phase 9A** (`types/index.ts`), gồm
  `questions: Question[]` (mỗi câu QUIZ có `points` riêng) + `settings.minimumPassingPoints` +
  time limit toàn bài + randomize + số attempt cho phép. Không còn "tham chiếu tới 1 `Quiz`" —
  Assessment giữ bản sao `Question[]` của riêng nó (xem §2 ở trên).
- **`AssessmentAttempt`** — một lần participant làm một `Assessment`: trạng thái (đang làm/đã
  nộp), thời điểm bắt đầu/kết thúc, `earnedPoints`, `scorePercent`, đạt/không đạt (so với
  `minimumPassingPoints` — điểm tuyệt đối, không phải %). Vẫn **chưa** triển khai (Phase 9B).
- **`AssessmentAnswer`** — câu trả lời của participant trong một `AssessmentAttempt`; tương tự
  `ParticipantAnswer` của Live Quiz nhưng không có khái niệm `pointsAwarded` kiểu speed bonus.

Không tạo bảng Postgres, không tạo TypeScript type, không tạo Zod schema cho 3 khái niệm này ở
bước này — chỉ ghi nhận tên và trách nhiệm để migration/type sau này không phải đặt tên lại từ
đầu.

---

## 5. Liên quan

- `MASTER_PLAN.md` → "Phase 9 — Assessment / Post-test" (mục roadmap tương ứng).
- `docs/design/README.md` §5 (TypeScript Domain Types) — có ghi chú tham chiếu tới tài liệu này
  ngay tại định nghĩa `Question`/`AnswerOption`/`Quiz`/`QuestionType`.
- `CLAUDE.md` §2 (Scope câu hỏi) — QUIZ/POLL vẫn là 2 loại câu hỏi duy nhất; Post-test là một
  activity mode mới tái sử dụng 2 loại này, **không phải** loại câu hỏi thứ 3.
