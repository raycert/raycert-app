import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Server Supabase client (Phase 10A §3) — for Server Components, Server
 * Actions, and Route Handlers. Reads/writes the auth session via Next.js
 * cookies, which is what Phase 10B's trainer login will need. Still uses
 * only the publishable key + RLS, same as the browser client — this is
 * about *where the code runs* (so cookies/session work), not elevated
 * privilege. For that, see `admin.ts`.
 *
 * Must be created fresh per request (never module-level singleton) — it
 * closes over this request's cookies.
 *
 * `setAll` is wrapped in try/catch per the official `@supabase/ssr` Next.js
 * pattern: a Server *Component* render can't set cookies (Next.js throws),
 * only Server Actions/Route Handlers can — a session refresh triggered
 * during a plain page render is safe to no-op there, since middleware
 * (added in Phase 10B) is what actually keeps the session cookie fresh.
 */
export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component render — no-op (see doc comment above).
          }
        },
      },
    }
  );
}
