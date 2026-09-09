import { cn } from "@/lib/utils";

/**
 * One overview stat (High-Fidelity #25) — neutral surface, brand-700 value.
 * `muted` renders "—" for metrics that don't apply (e.g. QUIZ score on an
 * all-POLL session) instead of a misleading 0.
 */
export function ReportMetricCard({
  label,
  value,
  muted = false,
  className,
}: {
  label: string;
  value: string | number;
  muted?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg bg-surface px-4 py-3.5 text-center", className)}>
      <p
        className={cn(
          "font-heading text-lg font-extrabold",
          muted ? "text-muted-foreground" : "text-brand-700"
        )}
      >
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
