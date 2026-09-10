"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const TIMER_OPTIONS = [10, 15, 20, 30, 45, 60];
const POINTS_OPTIONS = [500, 1000, 1500, 2000];

export function QuestionSettings({
  timerSeconds,
  onTimerChange,
  points,
  onPointsChange,
  // "preset" (default) = Live Quiz's 500/1000/1500/2000 dropdown, unchanged
  // behavior. "custom" = Post-test's free-entry numeric input (addendum §2)
  // — a trainer-set per-question point value, no Live Quiz scoring reuse.
  pointsInputMode = "preset",
  // Post-test has no per-question timer — only an overall assessment-level
  // `timeLimitMinutes` (Phase 9C). Live Quiz always shows the Timer control
  // (default true); Assessment Editor passes `showTimer={false}`.
  showTimer = true,
}: {
  timerSeconds: number;
  onTimerChange: (seconds: number) => void;
  points?: number; // omit for POLL
  onPointsChange?: (points: number) => void;
  pointsInputMode?: "preset" | "custom";
  showTimer?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {showTimer ? (
        <div className="flex flex-col gap-1">
          <label htmlFor="question-timer" className="sr-only">
            Timer
          </label>
          <Select value={String(timerSeconds)} onValueChange={(v) => onTimerChange(Number(v))}>
            <SelectTrigger id="question-timer" size="sm" className="h-auto rounded-lg px-3.5 py-2">
              <SelectValue>Timer: {timerSeconds}s</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TIMER_OPTIONS.map((seconds) => (
                <SelectItem key={seconds} value={String(seconds)}>
                  {seconds}s
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {points !== undefined && onPointsChange ? (
        pointsInputMode === "custom" ? (
          <div className="flex flex-col gap-1">
            <label htmlFor="question-points" className="text-[11px] font-medium text-muted-foreground">
              Điểm
            </label>
            <Input
              id="question-points"
              type="number"
              min={1}
              step={1}
              value={points}
              onChange={(e) => {
                const raw = e.target.value;
                onPointsChange(raw === "" ? 1 : Number(raw));
              }}
              className="h-auto w-24 rounded-lg px-3.5 py-2 text-sm"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <label htmlFor="question-points" className="sr-only">
              Points
            </label>
            <Select value={String(points)} onValueChange={(v) => onPointsChange(Number(v))}>
              <SelectTrigger id="question-points" size="sm" className="h-auto rounded-lg px-3.5 py-2">
                <SelectValue>Points: {points}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {POINTS_OPTIONS.map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      ) : null}
    </div>
  );
}
