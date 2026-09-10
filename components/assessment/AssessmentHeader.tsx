/**
 * Assessment title + description — a separate block from `AssessmentBanner`
 * (Start Screen UI fix-up §6/§7). Rendered once, directly below the banner,
 * never inside/overlaid on it. `companyName` (Company Name addendum) sits
 * between title and description when present — trimmed, never a placeholder
 * row when absent.
 */
export function AssessmentHeader({
  title,
  companyName,
  description,
}: {
  title: string;
  companyName?: string;
  description?: string;
}) {
  const trimmedCompanyName = companyName?.trim();
  return (
    <div className="flex flex-col gap-1 text-center">
      <h1 className="font-heading text-[22px] font-bold text-heading">{title}</h1>
      {trimmedCompanyName ? (
        <p className="text-sm font-semibold text-brand-700">{trimmedCompanyName}</p>
      ) : null}
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}
