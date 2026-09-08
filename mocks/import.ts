import type { ImportPreviewRow } from "@/types";

export const mockImportPreviewRows: ImportPreviewRow[] = [
  {
    row: 2,
    type: "QUIZ",
    question: "Thủ đô của Việt Nam là gì?",
    status: "valid",
  },
  {
    row: 3,
    type: "POLL",
    question: "Bạn thích màu nào nhất?",
    status: "valid",
  },
  {
    row: 4,
    type: "QUIZ",
    question: "Ngôn ngữ lập trình nào dùng cho frontend RayCert?",
    status: "error",
    errorColumn: "correct answer",
    errorMessage: "QUIZ có nhiều hơn một correct answer",
  },
  {
    row: 5,
    type: "POLL",
    question: "Bạn đánh giá buổi training thế nào?",
    status: "error",
    errorColumn: "correct answer",
    errorMessage: "POLL có correct answer",
  },
];
