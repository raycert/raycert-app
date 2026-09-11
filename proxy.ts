import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Next.js 16 renamed the `middleware.ts` file convention to `proxy.ts`
 * (the exported function is named `proxy`, not `middleware`) — using the
 * old convention/name here would be exactly the deprecated pattern §8
 * says not to use; `pnpm build` flagged this explicitly the first time
 * this file was named `middleware.ts`.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Every request except static assets/images — Supabase's own
    // documented Next.js App Router matcher pattern. Session refresh needs
    // to run broadly (any of these could be a Server Component render that
    // needs a valid cookie), not just on the trainer routes it also
    // protects.
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
