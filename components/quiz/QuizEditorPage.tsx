"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Quiz } from "@/types";
import { useQuizEditor } from "@/hooks/use-quiz-editor";
import { getQuestionValidationMessages } from "@/lib/validation/question";
import { QuizEditorShell } from "./QuizEditorShell";
import { QuestionList } from "./QuestionList";
import { QuizQuestionEditor } from "./QuizQuestionEditor";
import { PollQuestionEditor } from "./PollQuestionEditor";
import { QuizPreviewDialog } from "./QuizPreviewDialog";
import { ExcelImportDialog } from "@/components/import/ExcelImportDialog";

export function QuizEditorPage({ initialQuiz }: { initialQuiz: Quiz }) {
  const router = useRouter();
  const {
    quiz,
    saveStatus,
    selectedQuestion,
    selectedQuestionId,
    hasIncompleteQuestions,
    setTitle,
    selectQuestion,
    addQuestion,
    removeQuestion,
    moveQuestion,
    patchQuestion,
    addOption,
    removeOption,
    updateOptionText,
    setCorrectOption,
    importQuestions,
  } = useQuizEditor(initialQuiz);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const selectedOrder = selectedQuestion
    ? [...quiz.questions].sort((a, b) => a.order - b.order).findIndex((q) => q.id === selectedQuestion.id) + 1
    : 0;

  return (
    <div className="flex h-[calc(100vh-8.5rem)] min-h-130 flex-col">
      <QuizEditorShell
        quizTitle={quiz.title}
        onTitleChange={setTitle}
        saveStatus={saveStatus}
        onImportExcel={() => setImportOpen(true)}
        onPreview={() => setPreviewOpen(true)}
        onHost={() => router.push(`/host/${quiz.id}/lobby`)}
        hostDisabled={hasIncompleteQuestions}
        sidebar={
          <QuestionList
            questions={quiz.questions}
            selectedId={selectedQuestionId}
            onSelect={selectQuestion}
            onMoveUp={(id) => moveQuestion(id, "up")}
            onMoveDown={(id) => moveQuestion(id, "down")}
            onCreateQuestion={addQuestion}
          />
        }
      >
        {selectedQuestion ? (
          selectedQuestion.type === "QUIZ" ? (
            <QuizQuestionEditor
              question={selectedQuestion}
              order={selectedOrder}
              validationMessages={getQuestionValidationMessages(selectedQuestion)}
              onChangeText={(text) => patchQuestion(selectedQuestion.id, { text })}
              onUploadImage={(url, fileName, mimeType) =>
                patchQuestion(selectedQuestion.id, {
                  imageUrl: url,
                  imageFileName: fileName,
                  imageMimeType: mimeType,
                })
              }
              onRemoveImage={() =>
                patchQuestion(selectedQuestion.id, {
                  imageUrl: undefined,
                  imageFileName: undefined,
                  imageMimeType: undefined,
                })
              }
              onAddOption={() => addOption(selectedQuestion.id)}
              onRemoveOption={(optionId) => removeOption(selectedQuestion.id, optionId)}
              onChangeOptionText={(optionId, text) =>
                updateOptionText(selectedQuestion.id, optionId, text)
              }
              onSetCorrect={(optionId) => setCorrectOption(selectedQuestion.id, optionId)}
              onTimerChange={(seconds) =>
                patchQuestion(selectedQuestion.id, { timerSeconds: seconds })
              }
              onPointsChange={(points) => patchQuestion(selectedQuestion.id, { points })}
              onDelete={() => removeQuestion(selectedQuestion.id)}
            />
          ) : (
            <PollQuestionEditor
              question={selectedQuestion}
              order={selectedOrder}
              validationMessages={getQuestionValidationMessages(selectedQuestion)}
              onChangeText={(text) => patchQuestion(selectedQuestion.id, { text })}
              onUploadImage={(url, fileName, mimeType) =>
                patchQuestion(selectedQuestion.id, {
                  imageUrl: url,
                  imageFileName: fileName,
                  imageMimeType: mimeType,
                })
              }
              onRemoveImage={() =>
                patchQuestion(selectedQuestion.id, {
                  imageUrl: undefined,
                  imageFileName: undefined,
                  imageMimeType: undefined,
                })
              }
              onAddOption={() => addOption(selectedQuestion.id)}
              onRemoveOption={(optionId) => removeOption(selectedQuestion.id, optionId)}
              onChangeOptionText={(optionId, text) =>
                updateOptionText(selectedQuestion.id, optionId, text)
              }
              onTimerChange={(seconds) =>
                patchQuestion(selectedQuestion.id, { timerSeconds: seconds })
              }
              onDelete={() => removeQuestion(selectedQuestion.id)}
            />
          )
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm font-semibold text-heading">
              {quiz.questions.length === 0 ? "Quiz chưa có câu hỏi nào" : "Chọn một câu hỏi"}
            </p>
            <p className="max-w-xs text-sm text-muted-foreground">
              {quiz.questions.length === 0
                ? "Bấm + Add Question ở sidebar để bắt đầu."
                : "Chọn một câu hỏi trong sidebar để chỉnh sửa."}
            </p>
          </div>
        )}
      </QuizEditorShell>

      <QuizPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        quiz={quiz}
        hasIncompleteQuestions={hasIncompleteQuestions}
      />
      <ExcelImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImportQuestions={importQuestions}
      />
    </div>
  );
}
