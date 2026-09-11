import type { ReactNode } from "react";

/**
 * Shared shell for /login, /signup, /forgot-password, /reset-password
 * (Phase 10B §15) — a centered card, no NavBar/SidebarNav (mirrors the
 * `(trainer)` route group precedent: a parenthesized folder groups a
 * layout without adding a URL segment). Kept deliberately plain — Signal
 * Blue accents live on the form controls themselves (buttons, focus
 * rings), not as decoration on this shell.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-1">
        <span className="font-heading text-2xl font-extrabold text-heading">RayCert</span>
        <span className="text-sm font-medium text-body">Train. Engage. Certify.</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
