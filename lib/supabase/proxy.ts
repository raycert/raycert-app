import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";

/**
 * Trainer-owned routes (Phase 10B §7) — `/host/*` included since Host
 * Lobby/Live are trainer-controlled, and `/assessments/*` covers both the
 * `(trainer)`-grouped list/editor AND `/assessments/[id]/present` (the
 * Presenter screen lives outside the `(trainer)` route group folder for
 * layout reasons — Phase 9C+ — but is still trainer-only and matches this
 * prefix all the same). Deliberately NOT `/assessment/*` (singular) — that
 * is the public participant Post-test flow; the trailing "s" is load-
 * bearing here (`"/assessment/x/start".startsWith("/assessments")` is
 * false, confirmed, so there's no accidental overlap).
 */
const PROTECTED_PREFIXES = ["/dashboard", "/quizzes", "/assessments", "/results", "/host"];

const AUTH_PAGE_PREFIXES = ["/login", "/signup"];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * Refreshes the Supabase session cookie on every matching request (see
 * `proxy.ts`'s matcher — Next.js 16 renamed the root `middleware.ts`
 * convention to `proxy.ts`; this helper module's own name/location is
 * unaffected, only the root special file had to move) and redirects based
 * on auth state — this is the ONE place route protection is enforced;
 * nothing relies on client-side checks or localStorage (§8/§9). Uses
 * `getUser()`, not `getSession()` — see `lib/supabase/auth.ts` for why.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Redirects still need this request's refreshed session cookies carried
  // forward (copied from supabaseResponse) — otherwise a token refresh that
  // just happened on this exact request gets silently dropped by the
  // redirect instead of reaching the browser.
  function redirectTo(url: URL) {
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
    return response;
  }

  if (!user && matchesPrefix(pathname, PROTECTED_PREFIXES)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("redirectTo", pathname);
    return redirectTo(url);
  }

  if (user && matchesPrefix(pathname, AUTH_PAGE_PREFIXES)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return redirectTo(url);
  }

  // IMPORTANT (per @supabase/ssr's documented pattern): return
  // `supabaseResponse` as-is, or a new NextResponse built from it that
  // copies its cookies — never a bare `NextResponse.next()`/`.redirect()`
  // built without carrying the refreshed session cookies forward, or the
  // client silently loses its refreshed session on this response.
  return supabaseResponse;
}
