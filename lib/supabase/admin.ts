import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Admin Supabase client (Phase 10A §3) — `SUPABASE_SECRET_KEY`, bypasses RLS
 * entirely. The `import "server-only"` above is not a comment — it makes
 * any accidental import of this file from a Client Component a **build
 * error**, since `SUPABASE_SECRET_KEY` (no `NEXT_PUBLIC_` prefix) would
 * otherwise silently end up `undefined` in the browser bundle at best, or
 * get logged/exposed at worst.
 *
 * Only reach for this when RLS genuinely cannot express the operation —
 * e.g. the `auth.users` → `profiles` bootstrap trigger runs as Postgres
 * itself, not through this client, so even that doesn't need it. This
 * project has no actual caller of `createAdminClient` yet (Phase 10A ships
 * no server-side query code) — it exists so Phase 10B+ has a correct,
 * already-guarded place to reach for if/when something genuinely needs to
 * bypass RLS (e.g. an admin-only operation), instead of reaching for the
 * secret key ad hoc.
 *
 * No cookies/session — this client is never "the current user," it acts as
 * Postgres' `postgres`/superuser-equivalent role from RLS's perspective.
 * Never use it for anything a signed-in trainer's own publishable-key +
 * RLS session can already do.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
