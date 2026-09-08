import type { AnswerOption, Question, Quiz, QuestionType } from "@/types";

const LABELS = ["A", "B", "C", "D", "E", "F"];

function buildOptions(
  questionId: string,
  texts: string[],
  correctIndex?: number
): AnswerOption[] {
  return texts.map((text, i) => ({
    id: `${questionId}-opt-${LABELS[i]}`,
    label: LABELS[i],
    text,
    ...(correctIndex !== undefined ? { isCorrect: i === correctIndex } : {}),
  }));
}

function buildQuestion(params: {
  id: string;
  type: QuestionType;
  text: string;
  options: string[];
  correctIndex?: number; // QUIZ only
  timerSeconds: number;
  points?: number; // QUIZ only
  order: number;
  imageUrl?: string;
}): Question {
  const { id, type, text, options, correctIndex, timerSeconds, points, order, imageUrl } =
    params;
  return {
    id,
    type,
    text,
    imageUrl,
    options: buildOptions(id, options, type === "QUIZ" ? correctIndex : undefined),
    timerSeconds,
    points: type === "QUIZ" ? points ?? 1000 : undefined,
    order,
    isComplete: true,
  };
}

const onboardingQuestions: Question[] = [
  buildQuestion({
    id: "onb-q1",
    type: "QUIZ",
    text: "RayCert dùng để làm gì?",
    options: [
      "Quiz đào tạo realtime cho doanh nghiệp",
      "Quản lý bảng lương",
      "Chấm công nhân sự",
      "Quản lý kho hàng",
    ],
    correctIndex: 0,
    timerSeconds: 20,
    points: 1000,
    order: 1,
  }),
  buildQuestion({
    id: "onb-q2",
    type: "QUIZ",
    text: "Ai có quyền tạo và host một quiz?",
    options: ["Host / Giảng viên", "Participant", "Khách vãng lai", "Không ai cả"],
    correctIndex: 0,
    timerSeconds: 15,
    points: 1000,
    order: 2,
  }),
  buildQuestion({
    id: "onb-q3",
    type: "QUIZ",
    text: "Participant cần gì để vào một game session?",
    options: ["Tài khoản trả phí", "PIN 6 số + nickname", "Email công ty", "Mã QR duy nhất"],
    correctIndex: 1,
    timerSeconds: 15,
    points: 1000,
    order: 3,
  }),
  buildQuestion({
    id: "onb-q4",
    type: "POLL",
    text: "Bạn thấy buổi onboarding hôm nay thế nào?",
    options: ["Rất hữu ích", "Bình thường", "Cần cải thiện"],
    timerSeconds: 15,
    order: 4,
  }),
  buildQuestion({
    id: "onb-q5",
    type: "QUIZ",
    text: "Loại câu hỏi nào có leaderboard?",
    options: ["QUIZ", "POLL", "Cả hai", "Không loại nào"],
    correctIndex: 0,
    timerSeconds: 20,
    points: 1000,
    order: 5,
  }),
  buildQuestion({
    id: "onb-q6",
    type: "QUIZ",
    text: "POLL có đáp án đúng/sai không?",
    options: ["Có", "Không", "Tùy câu hỏi", "Chỉ khi có điểm"],
    correctIndex: 1,
    timerSeconds: 15,
    points: 1000,
    order: 6,
  }),
  buildQuestion({
    id: "onb-q7",
    type: "QUIZ",
    text: "Điểm tối đa cho một câu QUIZ trả lời đúng, nhanh nhất là bao nhiêu?",
    options: ["1000", "1300", "1500", "2000"],
    correctIndex: 1,
    timerSeconds: 20,
    points: 1000,
    order: 7,
  }),
  buildQuestion({
    id: "onb-q8",
    type: "POLL",
    text: "Bạn muốn tham gia buổi đào tạo tiếp theo vào lúc nào?",
    options: ["Buổi sáng", "Buổi chiều", "Buổi tối", "Cuối tuần"],
    timerSeconds: 15,
    order: 8,
  }),
  buildQuestion({
    id: "onb-q9",
    type: "QUIZ",
    text: "Ai quyết định điểm số và trạng thái đúng/sai?",
    options: ["Client (trình duyệt)", "Server", "Participant tự chấm", "Host tự nhập tay"],
    correctIndex: 1,
    timerSeconds: 15,
    points: 1000,
    order: 9,
  }),
  buildQuestion({
    id: "onb-q10",
    type: "QUIZ",
    text: "Một participant có thể trả lời một câu hỏi mấy lần?",
    options: ["Không giới hạn", "Đúng 1 lần", "2 lần", "Tùy host cho phép"],
    correctIndex: 1,
    timerSeconds: 15,
    points: 1000,
    order: 10,
  }),
];

const complianceQuestions: Question[] = [
  buildQuestion({
    id: "cmp-q1",
    type: "QUIZ",
    text: "Thông tin khách hàng cần được xử lý theo nguyên tắc nào?",
    options: ["Bảo mật và đúng mục đích", "Chia sẻ tự do nội bộ", "Lưu vĩnh viễn mọi trường hợp", "Không cần quy định"],
    correctIndex: 0,
    timerSeconds: 20,
    points: 1000,
    order: 1,
  }),
  buildQuestion({
    id: "cmp-q2",
    type: "QUIZ",
    text: "Khi phát hiện rủi ro tuân thủ, bước đầu tiên là gì?",
    options: ["Bỏ qua nếu nhỏ", "Báo cáo theo quy trình nội bộ", "Tự xử lý âm thầm", "Đăng lên mạng xã hội"],
    correctIndex: 1,
    timerSeconds: 20,
    points: 1000,
    order: 2,
  }),
  buildQuestion({
    id: "cmp-q3",
    type: "QUIZ",
    text: "Mật khẩu hệ thống nội bộ nên được chia sẻ như thế nào?",
    options: ["Không chia sẻ với bất kỳ ai", "Chia sẻ qua chat nhóm", "Ghi ra giấy dán màn hình", "Gửi email cho cả phòng"],
    correctIndex: 0,
    timerSeconds: 15,
    points: 1000,
    order: 3,
  }),
  buildQuestion({
    id: "cmp-q4",
    type: "QUIZ",
    text: "Tài liệu mật của công ty được phép mang ra ngoài khi nào?",
    options: ["Bất cứ khi nào cần", "Chỉ khi có phê duyệt phù hợp", "Khi làm việc tại nhà", "Không giới hạn với quản lý"],
    correctIndex: 1,
    timerSeconds: 20,
    points: 1000,
    order: 4,
  }),
  buildQuestion({
    id: "cmp-q5",
    type: "QUIZ",
    text: "Ai chịu trách nhiệm tuân thủ quy định bảo mật dữ liệu?",
    options: ["Chỉ phòng IT", "Chỉ ban lãnh đạo", "Tất cả nhân viên", "Chỉ nhân viên mới"],
    correctIndex: 2,
    timerSeconds: 15,
    points: 1000,
    order: 5,
  }),
  buildQuestion({
    id: "cmp-q6",
    type: "QUIZ",
    text: "Chu kỳ ôn tập tuân thủ (refresher) được khuyến nghị là bao lâu?",
    options: ["Hàng năm", "Một lần duy nhất", "Không cần lặp lại", "Chỉ khi có sự cố"],
    correctIndex: 0,
    timerSeconds: 15,
    points: 1000,
    order: 6,
  }),
];

const teamPulseQuestions: Question[] = [
  buildQuestion({
    id: "tpc-q1",
    type: "POLL",
    text: "Bạn cảm thấy thế nào về khối lượng công việc tuần này?",
    options: ["Vừa sức", "Hơi nhiều", "Quá tải"],
    timerSeconds: 15,
    order: 1,
  }),
  buildQuestion({
    id: "tpc-q2",
    type: "POLL",
    text: "Mức độ hài lòng với sự phối hợp trong team?",
    options: ["Rất hài lòng", "Hài lòng", "Bình thường", "Chưa hài lòng"],
    timerSeconds: 15,
    order: 2,
  }),
  buildQuestion({
    id: "tpc-q3",
    type: "POLL",
    text: "Bạn muốn team building tiếp theo là hoạt động gì?",
    options: ["Dã ngoại", "Thể thao", "Ăn uống", "Workshop kỹ năng", "Khác"],
    timerSeconds: 15,
    order: 3,
  }),
  buildQuestion({
    id: "tpc-q4",
    type: "POLL",
    text: "Bạn có muốn duy trì buổi pulse check hàng tuần không?",
    options: ["Có", "Không", "Tùy giai đoạn dự án"],
    timerSeconds: 15,
    order: 4,
  }),
];

export const mockQuizzes: Quiz[] = [
  {
    id: "quiz-onboarding",
    title: "Onboarding Quiz",
    questions: onboardingQuestions,
    status: "published",
    updatedAt: "2026-08-20T09:00:00.000Z",
  },
  {
    id: "quiz-compliance",
    title: "Compliance Refresher",
    questions: complianceQuestions,
    status: "published",
    updatedAt: "2026-08-25T14:30:00.000Z",
  },
  {
    id: "quiz-team-pulse",
    title: "Team Pulse Check",
    questions: teamPulseQuestions,
    status: "draft",
    updatedAt: "2026-09-01T11:15:00.000Z",
  },
];
