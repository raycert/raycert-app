import type { Quiz } from "@/types";
import { cn } from "@/lib/utils";

export function QuizStatusBadge({ status }: { status: Quiz["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
        status === "published"
          ? "bg-background text-brand-500"
          : "bg-muted text-muted-foreground"
      )}
    >
      {status}
    </span>
  );
}
