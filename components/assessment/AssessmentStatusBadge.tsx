import type { AssessmentStatus } from "@/types";
import { cn } from "@/lib/utils";

export function AssessmentStatusBadge({ status }: { status: AssessmentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
        status === "active" ? "bg-success-100 text-success-600" : "bg-muted text-muted-foreground"
      )}
    >
      {status === "active" ? "Active" : "Inactive"}
    </span>
  );
}
