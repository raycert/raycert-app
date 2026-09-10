export function AssessmentProgress({
  current,
  total,
  points,
}: {
  current: number;
  total: number;
  points?: number;
}) {
  return (
    <p className="text-[12.5px] text-muted-foreground">
      Câu {current}/{total}
      {points !== undefined ? <span> · {points} điểm</span> : null}
    </p>
  );
}
