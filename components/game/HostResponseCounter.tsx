export function HostResponseCounter({
  responded,
  total,
}: {
  responded: number;
  total: number;
}) {
  return (
    <p aria-live="polite" className="text-lg font-semibold text-white/80">
      {responded}/{total} <span className="text-white/60">đã trả lời</span>
    </p>
  );
}
