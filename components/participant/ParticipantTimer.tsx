"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function ParticipantTimer({
  secondsLeft,
  variant,
  locked,
}: {
  secondsLeft: number;
  variant: "quiz" | "poll";
  locked?: boolean;
}) {
  const lowTime = secondsLeft <= 5 && secondsLeft > 0;

  // Announce remaining time at 5s checkpoints (and the final countdown),
  // never every tick — avoids screen-reader spam (§13, §15 accessibility).
  const [announced, setAnnounced] = useState(secondsLeft);
  const lastAnnouncedRef = useRef(secondsLeft);
  useEffect(() => {
    const shouldAnnounce =
      secondsLeft === 0 || secondsLeft <= 5 || secondsLeft % 5 === 0;
    if (shouldAnnounce && secondsLeft !== lastAnnouncedRef.current) {
      lastAnnouncedRef.current = secondsLeft;
      setAnnounced(secondsLeft);
    }
  }, [secondsLeft]);

  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full border-[3px] font-heading text-xs font-bold",
        locked
          ? "border-border text-muted-foreground"
          : lowTime
            ? "border-amber-600 text-amber-600"
            : variant === "quiz"
              ? "border-primary text-primary"
              : "border-teal-500 text-teal-500"
      )}
    >
      <span aria-hidden="true">{secondsLeft}</span>
      <span className="sr-only" aria-live="polite">
        {announced === 0 ? "Hết giờ" : `Còn ${announced} giây`}
      </span>
    </div>
  );
}
