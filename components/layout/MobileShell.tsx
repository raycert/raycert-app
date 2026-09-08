import type { ReactNode } from "react";

/**
 * Mobile-first shell for participant routes — 390px reference viewport,
 * safe-area padding. Full-width on real phones; centered on wider screens.
 * (docs/design/README.md §11)
 */
export function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-background">
      <div
        className="flex flex-1 flex-col"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
