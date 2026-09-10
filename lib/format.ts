const relativeTimeFormatter = new Intl.RelativeTimeFormat("vi", { numeric: "auto" });

/** "2 giờ trước", "hôm qua", "3 ngày trước"... relative to now. */
export function formatRelativeTime(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);
  const diffHours = Math.round(diffMs / 3_600_000);
  const diffDays = Math.round(diffMs / 86_400_000);

  if (Math.abs(diffMinutes) < 60) return relativeTimeFormatter.format(diffMinutes, "minute");
  if (Math.abs(diffHours) < 24) return relativeTimeFormatter.format(diffHours, "hour");
  return relativeTimeFormatter.format(diffDays, "day");
}

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** "27/08/2026" — fixed calendar date, for report/session timestamps. */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

/** 8400 -> "8.4s" — average response time, one decimal place. */
export function formatResponseSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

/** 1782 -> "29:42" — MM:SS countdown display (Post-test overall timer). */
export function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** 72 -> "72%", 70.8 -> "70.8%" — integer when it divides evenly, else at
 * most 1 decimal place (Post-test Result score percent, Phase 9D §17). The
 * value itself is already rounded to 1dp by
 * `lib/assessment/scoring.ts`'s `calculateScorePercent`; this only trims a
 * trailing `.0`. */
export function formatScorePercent(scorePercent: number): string {
  return `${Number.isInteger(scorePercent) ? scorePercent : scorePercent.toFixed(1)}%`;
}
