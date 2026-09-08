import type { ReactNode } from "react";

/**
 * Full-bleed navy shell for Host Lobby / Host Live — no nav, projector mode.
 * (docs/design/README.md §3, screens 08–14)
 */
export function HostShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-brand-900 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-8 py-10">
        {children}
      </div>
    </div>
  );
}
