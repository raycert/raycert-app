/**
 * PARTIAL PLACEHOLDER — not the real generated types yet (Phase 10A §22).
 *
 * `profiles` is hand-typed below (matching
 * `supabase/migrations/20260910000000_initial_schema.sql` exactly) because
 * Phase 10B's real code (`lib/supabase/auth.ts`, `app/(auth)/actions.ts`)
 * needs to `.from("profiles")` and a fully-empty placeholder (`Tables:
 * Record<string, never>`) makes every table resolve to `never`, which
 * doesn't compile. Every other table is still the empty placeholder — add
 * more by hand here ONLY if/when real code needs to query them, the same
 * way `profiles` was added, and keep each one in sync with its migration
 * by hand until the CLI is available.
 *
 * To generate the real, complete file (replacing every hand-typed table
 * here, `profiles` included):
 *
 *   pnpm db:types
 *
 * (defined in package.json as `supabase gen types typescript --project-id
 * <your-project-ref> > lib/supabase/database.types.ts` — requires the
 * Supabase CLI; see docs/backend/SUPABASE_SETUP.md for the project-id and
 * a login step).
 *
 * Database types are intentionally kept separate from the frontend/domain
 * types in `types/index.ts` (Phase 10A §22) — column names are snake_case
 * and enum values differ in a few places (documented in
 * `lib/supabase/mappers/`). Nothing in `types/index.ts` imports from here,
 * and nothing here imports from there.
 */

// `type` object literals, not `interface` — the real `supabase gen types`
// output uses inline object literals, and `interface` here is not just a
// style deviation: it breaks `.update()`'s generic inference deep inside
// `@supabase/postgrest-js`'s conditional types (confirmed empirically —
// switching these three from `interface` to `type` was the fix). Keep this
// as `type` if you ever hand-add another table here.
type ProfilesRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: string;
  created_at: string;
  updated_at: string;
};

type ProfilesInsert = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  role?: string;
  created_at?: string;
  updated_at?: string;
};

type ProfilesUpdate = {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  role?: string;
  created_at?: string;
  updated_at?: string;
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      profiles: {
        Row: ProfilesRow;
        Insert: ProfilesInsert;
        Update: ProfilesUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
