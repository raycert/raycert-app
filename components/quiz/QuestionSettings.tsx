"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TIMER_OPTIONS = [10, 15, 20, 30, 45, 60];
const POINTS_OPTIONS = [500, 1000, 1500, 2000];

export function QuestionSettings({
  timerSeconds,
  onTimerChange,
  points,
  onPointsChange,
}: {
  timerSeconds: number;
  onTimerChange: (seconds: number) => void;
  points?: number; // omit for POLL
  onPointsChange?: (points: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
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

      {points !== undefined && onPointsChange ? (
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
      ) : null}
    </div>
  );
}
