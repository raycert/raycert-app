/**
 * PLACEHOLDER — not the real generated types yet (Phase 10A §22).
 *
 * This file exists so `lib/supabase/client.ts` / `server.ts` / `admin.ts` can
 * already do `createClient<Database>(...)` — the moment this file is
 * regenerated for real, every call site lights up with full table/column
 * types and autocomplete with zero further code changes.
 *
 * To generate the real file, after applying `supabase/migrations/` to your
 * project (see `docs/backend/SUPABASE_SETUP.md`):
 *
 *   pnpm db:types
 *
 * (defined in package.json as `supabase gen types typescript --project-id
 * <your-project-ref> > lib/supabase/database.types.ts` — requires the
 * Supabase CLI; see the setup doc for the project-id and a login step). Do
 * not hand-edit table shapes here to "keep up" with schema changes — that
 * defeats the point of generating this file; edit the migration, then
 * regenerate.
 *
 * Database types are intentionally kept separate from the frontend/domain
 * types in `types/index.ts` (Phase 10A §22) — column names are snake_case
 * and enum values differ in a few places (documented in
 * `lib/supabase/mappers/`). Nothing in `types/index.ts` imports from here,
 * and nothing here imports from there.
 */
export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
