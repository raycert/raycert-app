"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MonitorPlayIcon } from "lucide-react";
import { toast } from "sonner";
import type { Assessment } from "@/types";
import { useAssessmentEditor } from "@/hooks/use-assessment-editor";
import { getQuestionValidationMessages } from "@/lib/validation/question";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { QuestionList } from "@/components/quiz/QuestionList";
import { QuizQuestionEditor } from "@/components/quiz/QuizQuestionEditor";
import { PollQuestionEditor } from "@/components/quiz/PollQuestionEditor";
import { ExcelImportDialog } from "@/components/import/ExcelImportDialog";
import { downloadBlob, generatePostTestTemplateBlob, POST_TEST_TEMPLATE_FILENAME } from "@/lib/excel/template";
import { AssessmentQuestionSummary } from "./AssessmentQuestionSummary";
import { AssessmentSettings } from "./AssessmentSettings";
import { AssessmentPreviewDialog } from "./AssessmentPreviewDialog";
import { AssessmentBannerSection } from "./AssessmentBannerSection";

const MAX_COMPANY_NAME_LENGTH = 120;

export function AssessmentEditor({ initialAssessment }: { initialAssessment: Assessment }) {
  const router = useRouter();
  const {
    assessment,
    selectedQuestion,
    selectedQuestionId,
    totalPoints,
    validationMessages,
    isPublishable,
    setTitle,
    setCompanyName,
    setDescription,
    updateBanner,
    updateSettings,
    setStatus,
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
  } = useAssessmentEditor(initialAssessment);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  async function handleDownloadTemplate() {
    const blob = await generatePostTestTemplateBlob();
    downloadBlob(blob, POST_TEST_TEMPLATE_FILENAME);
  }

  const selectedOrder = selectedQuestion
    ? [...assessment.questions]
        .sort((a, b) => a.order - b.order)
        .findIndex((q) => q.id === selectedQuestion.id) + 1
    : 0;

  function handleSaveAndClose() {
    toast.success("Đã lưu Post-test (mock — chưa có backend persistence)");
    router.push("/assessments");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/assessments")}>
          ← Quay lại Assessments
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPreviewOpen(true)}>
            Preview
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/assessments/${assessment.id}/present`} target="_blank" rel="noopener noreferrer">
              <MonitorPlayIcon />
              Present
            </Link>
          </Button>
          <Button size="sm" onClick={handleSaveAndClose}>
            Save & Close
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label htmlFor="assessment-title" className="sr-only">
          Post-test title
        </label>
        <Input
          id="assessment-title"
          value={assessment.title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled Post-test"
          className="h-11 text-lg font-bold"
        />
        <label htmlFor="assessment-company-name" className="sr-only">
          Tên công ty
        </label>
        <Input
          id="assessment-company-name"
          value={assessment.companyName ?? ""}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Công ty TNHH ABC"
          maxLength={MAX_COMPANY_NAME_LENGTH}
        />
        <label htmlFor="assessment-description" className="sr-only">
          Description
        </label>
        <Textarea
          id="assessment-description"
          value={assessment.description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả ngắn về bài Post-test này…"
          className="min-h-16"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Banner bài kiểm tra</CardTitle>
        </CardHeader>
        <CardContent>
          <AssessmentBannerSection
            bannerImageUrl={assessment.bannerImageUrl}
            bannerFileName={assessment.bannerFileName}
            onUploadBanner={(url, fileName, mimeType) =>
              updateBanner({ bannerImageUrl: url, bannerFileName: fileName, bannerMimeType: mimeType })
            }
            onRemoveBanner={() =>
              updateBanner({ bannerImageUrl: undefined, bannerFileName: undefined, bannerMimeType: undefined })
            }
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <Card>
          <CardHeader>
            <CardTitle>Questions</CardTitle>
            <CardAction className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleDownloadTemplate}>
                Tải file mẫu
              </Button>
              <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                Import Excel
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <AssessmentQuestionSummary questions={assessment.questions} />
            <div className="flex flex-col overflow-hidden rounded-lg border border-border lg:flex-row">
              <aside className="border-b border-border lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0">
                <QuestionList
                  questions={assessment.questions}
                  selectedId={selectedQuestionId}
                  onSelect={selectQuestion}
                  onMoveUp={(id) => moveQuestion(id, "up")}
                  onMoveDown={(id) => moveQuestion(id, "down")}
                  onCreateQuestion={addQuestion}
                />
              </aside>
              <div className="flex-1 p-4">
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
                      pointsInputMode="custom"
                      showTimer={false}
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
                      showTimer={false}
                    />
                  )
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
                    <p className="text-sm font-semibold text-heading">
                      {assessment.questions.length === 0
                        ? "Post-test chưa có câu hỏi nào"
                        : "Chọn một câu hỏi"}
                    </p>
                    <p className="max-w-xs text-sm text-muted-foreground">
                      {assessment.questions.length === 0
                        ? "Bấm + Add Question ở sidebar để bắt đầu."
                        : "Chọn một câu hỏi trong sidebar để chỉnh sửa."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assessment Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <AssessmentSettings
              settings={assessment.settings}
              totalQuestionCount={assessment.questions.length}
              totalPoints={totalPoints}
              status={assessment.status}
              isPublishable={isPublishable}
              validationMessages={validationMessages}
              onUpdateSettings={updateSettings}
              onStatusChange={setStatus}
            />
          </CardContent>
        </Card>
      </div>

      <AssessmentPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} assessment={assessment} />
      <ExcelImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImportQuestions={importQuestions}
        mode="POST_TEST"
      />
    </div>
  );
}
