import "server-only";
import { headers } from "next/headers";

/**
 * The app's own origin, for building Supabase email redirect URLs (Phase
 * 10B §13 — "Không hardcode localhost nếu có helper base URL/environment").
 * Prefers `NEXT_PUBLIC_SITE_URL` when set (reliable behind a proxy/CDN in a
 * real deployment); falls back to this request's own `Host`/`X-Forwarded-*`
 * headers otherwise, which is already correct for local dev without any
 * hardcoded "localhost:3000".
 */
export async function getBaseUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const protocol = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}
