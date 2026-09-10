"use client";

import type { AssessmentSettings as AssessmentSettingsData, AssessmentStatus } from "@/types";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ValidationMessage } from "@/components/quiz/ValidationMessage";
import { getEquivalentPassRate } from "@/lib/validation/assessment";

function ToggleRow({
  id,
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
      <div>
        <label htmlFor={id} className="text-[13px] font-semibold text-heading">
          {label}
        </label>
        {description ? <p className="text-[12px] text-muted-foreground">{description}</p> : null}
      </div>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
    </div>
  );
}

/** Post-test settings panel (Phase 9A addendum §4/§5/§10). `minimumPassingPoints`
 * — an absolute point total, not a correct-answer count and not a % — is the
 * field PASS/FAIL is computed from; "Tương đương: X%" is display-only. `status`
 * is disabled from switching to Active while `!isPublishable`. */
export function AssessmentSettings({
  settings,
  totalQuestionCount,
  totalPoints,
  status,
  isPublishable,
  validationMessages,
  onUpdateSettings,
  onStatusChange,
}: {
  settings: AssessmentSettingsData;
  totalQuestionCount: number;
  totalPoints: number;
  status: AssessmentStatus;
  isPublishable: boolean;
  validationMessages: string[];
  onUpdateSettings: (patch: Partial<AssessmentSettingsData>) => void;
  onStatusChange: (status: AssessmentStatus) => void;
}) {
  const passRate = getEquivalentPassRate(settings.minimumPassingPoints, totalPoints);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
        <p className="text-[13px] font-semibold text-heading">Điều kiện đạt</p>

        <div className="flex items-center justify-between text-[12.5px]">
          <span className="text-muted-foreground">Tổng số câu:</span>
          <span className="font-semibold text-heading">{totalQuestionCount}</span>
        </div>

        <div className="flex items-center justify-between text-[12.5px]">
          <span className="text-muted-foreground">Tổng điểm bài:</span>
          <span className="font-semibold text-heading">{totalPoints} điểm</span>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="min-passing-points" className="text-[12.5px] text-muted-foreground">
            Tổng điểm tối thiểu để đạt:
          </label>
          <Input
            id="min-passing-points"
            type="number"
            min={1}
            max={totalPoints || undefined}
            value={settings.minimumPassingPoints}
            onChange={(e) => {
              const raw = e.target.value;
              onUpdateSettings({ minimumPassingPoints: raw === "" ? 1 : Number(raw) });
            }}
            className="w-24"
          />
        </div>

        <div className="flex items-center justify-between text-[12.5px]">
          <span className="text-muted-foreground">Tương đương:</span>
          <span className="font-semibold text-heading">
            {passRate !== null ? `${passRate}%` : "—"}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="max-attempts" className="text-[13px] font-semibold text-heading">
          Số lần làm
        </label>
        <Input
          id="max-attempts"
          type="number"
          min={1}
          value={settings.maxAttempts}
          onChange={(e) => onUpdateSettings({ maxAttempts: Number(e.target.value) })}
          className="w-24"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="time-limit" className="text-[13px] font-semibold text-heading">
            Thời gian làm bài
          </label>
          <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <Switch
              size="sm"
              checked={settings.timeLimitMinutes === null}
              onCheckedChange={(checked) => onUpdateSettings({ timeLimitMinutes: checked ? null : 30 })}
            />
            Không giới hạn
          </label>
        </div>
        {settings.timeLimitMinutes !== null ? (
          <div className="flex items-center gap-2">
            <Input
              id="time-limit"
              type="number"
              min={1}
              value={settings.timeLimitMinutes}
              onChange={(e) => onUpdateSettings({ timeLimitMinutes: Number(e.target.value) })}
              className="w-24"
            />
            <span className="text-[12.5px] text-muted-foreground">phút</span>
          </div>
        ) : null}
      </div>

      <ToggleRow
        id="randomize-questions"
        label="Randomize questions"
        description="Đảo thứ tự câu hỏi mỗi lần participant làm bài."
        checked={settings.randomizeQuestions}
        onCheckedChange={(checked) => onUpdateSettings({ randomizeQuestions: checked })}
      />
      <ToggleRow
        id="randomize-answers"
        label="Randomize answer options"
        description="Đảo thứ tự đáp án trong mỗi câu hỏi."
        checked={settings.randomizeAnswers}
        onCheckedChange={(checked) => onUpdateSettings({ randomizeAnswers: checked })}
      />
      <ToggleRow
        id="show-correct-answers"
        label="Show correct answers after submit"
        description="Participant thấy đáp án đúng sau khi nộp bài."
        checked={settings.showCorrectAnswersAfterSubmit}
        onCheckedChange={(checked) => onUpdateSettings({ showCorrectAnswersAfterSubmit: checked })}
      />

      <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
        <div>
          <p className="text-[13px] font-semibold text-heading">Trạng thái</p>
          <p className="text-[12px] text-muted-foreground">
            {status === "active"
              ? "Đang mở — participant có thể làm bài."
              : "Đang tắt — participant không thể làm bài."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] font-medium text-muted-foreground">
            {status === "active" ? "Active" : "Inactive"}
          </span>
          <Switch
            aria-label="Active / Inactive"
            checked={status === "active"}
            disabled={!isPublishable}
            onCheckedChange={(checked) => onStatusChange(checked ? "active" : "inactive")}
          />
        </div>
      </div>

      <ValidationMessage messages={validationMessages} />
    </div>
  );
}
