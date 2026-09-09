export function ExcelValidationMessage({
  errorColumn,
  errorMessage,
}: {
  errorColumn?: string;
  errorMessage?: string;
}) {
  if (!errorMessage) return null;

  return (
    <span className="text-[11.5px] text-error-600">
      {errorColumn ? <strong>{errorColumn}</strong> : null}
      {errorColumn ? " · " : ""}
      {errorMessage}
    </span>
  );
}
