"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * Browser Supabase client (Phase 10A §3) — for Client Components only. Uses
 * the two `NEXT_PUBLIC_*` env vars, safe to expose to the browser (RLS is
 * what actually protects data, not keeping this URL/key secret). Never pass
 * `SUPABASE_SECRET_KEY` here.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
