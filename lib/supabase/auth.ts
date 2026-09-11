import "server-only";
import { createClient } from "./server";

/**
 * Shape of a `profiles` row (Phase 10A schema) as read by the frontend —
 * deliberately its own small type here, not reused from `types/index.ts`
 * (that file is frontend/domain types for the mock-data world, kept
 * separate from database-backed types — Phase 10A §22). Field names match
 * the DB's snake_case directly; this is about as far as a "mapper" needs to
 * go for a table this simple (no enum/casing mismatch here, unlike
 * `lib/supabase/mappers/status.ts`'s tables).
 */
export interface TrainerProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

/**
 * The current request's authenticated user, or `null`. Uses
 * `supabase.auth.getUser()` — never `getSession()` — because `getUser()`
 * revalidates the token against Supabase Auth's server on every call,
 * while `getSession()` only reads the (possibly stale/tampered) cookie
 * value. This is Supabase's own documented guidance for anywhere a
 * server needs to trust "is this really the current user" (middleware,
 * layouts, Server Actions) — see `lib/supabase/middleware.ts` for the
 * same rule applied to route protection.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * The current user's `profiles` row, or `null` if not signed in *or* if
 * signed in but no profile row exists yet (Phase 10B §11 — "Nếu profile
 * không tồn tại: xử lý rõ ràng, không crash"; callers render a fallback,
 * they never assume a non-null result). The only expected cause of a
 * missing profile is the `on_auth_user_created` trigger not having run
 * (e.g. a user created directly in the Dashboard before the migration
 * existed) — there is no UI in this phase to repair that, only to not
 * crash because of it.
 */
export async function getCurrentProfile(): Promise<TrainerProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return (profile as TrainerProfile | null) ?? null;
}
