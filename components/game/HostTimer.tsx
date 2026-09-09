import { cn } from "@/lib/utils";

export function HostTimer({ secondsLeft }: { secondsLeft: number }) {
  const lowTime = secondsLeft <= 5 && secondsLeft > 0;

  return (
    <div
      role="timer"
      aria-live="off"
      className={cn(
        "flex size-20 shrink-0 items-center justify-center rounded-full border-[6px] font-heading text-3xl font-extrabold",
        lowTime ? "border-amber-600 text-amber-600" : "border-white/30 text-white"
      )}
    >
      {secondsLeft}
    </div>
  );
}
