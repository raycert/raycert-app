import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Full-bleed navy shell for Host Lobby / Host Live — no nav, projector mode.
 * (docs/design/README.md §3, screens 08–14)
 */
export function HostShell({
  children,
  wide,
}: {
  children: ReactNode;
  /** Host Live needs more breathing room on 16:9 projector/desktop displays than Lobby's centered card. */
  wide?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-brand-900 text-white">
      <div
        className={cn(
          "mx-auto flex w-full flex-1 flex-col px-8 py-10",
          wide ? "max-w-[1600px]" : "max-w-5xl"
        )}
      >
        {children}
      </div>
    </div>
  );
}
