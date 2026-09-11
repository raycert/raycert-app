import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /auth/confirm?token_hash=...&type=...&next=...
 *
 * Not one of Phase 10B's 4 named routes (`/login`/`/signup`/
 * `/forgot-password`/`/reset-password`) — it's the plumbing that makes
 * `/reset-password`'s "Redirect URL phải trỏ đúng về /reset-password"
 * (§13) and signup email confirmation (§5) actually work. Both flows email
 * a link containing a one-time `token_hash`; verifying it is what
 * establishes the real session (cookies), and a Server Component page
 * render cannot set cookies (see `lib/supabase/server.ts`) — only a Route
 * Handler or Server Action can, so this exchange has to happen somewhere
 * like this, not directly on `/reset-password`'s page. This is also
 * Supabase's own documented default email-template pattern for the
 * Next.js App Router (`{{ .SiteURL }}/auth/confirm?token_hash={{
 * .TokenHash }}&type={{ .Type }}&next=...`), not a bespoke one — see
 * docs/backend/SUPABASE_SETUP.md's Auth settings checklist.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      redirect(`${origin}${next}`);
    }
  }

  redirect(`${origin}/login?error=invalid_or_expired_link`);
}
