import type { ReactNode } from "react";
import { NavBar } from "@/components/layout/NavBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { getCurrentProfile } from "@/lib/supabase/auth";

/** Every route under this layout is already guaranteed authenticated by
 * `middleware.ts` (Phase 10B §7) — this fetch is for *display* (name/email
 * in the NavBar user menu), not a second auth check. `profile` can still be
 * `null` (§11 — signed in but no `profiles` row yet); `NavBar` renders a
 * sane fallback rather than crashing. */
export default async function TrainerLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentProfile();

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar profile={profile} />
      <div className="flex flex-1">
        <SidebarNav />
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
