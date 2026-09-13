import "server-only";
import { cookies } from "next/headers";

/**
 * Participant identity cookie (Phase 10D §6-§7) — carries a joined
 * participant's `participant_token`, scoped to the session they joined.
 * httpOnly so client JS never touches it directly; every participant-facing
 * Server Action reads it server-side instead of trusting a client-supplied
 * participantId/token. Not a Supabase Auth session and not
 * `SUPABASE_SECRET_KEY` — just an opaque bearer value the DB itself
 * generated (`participants.participant_token default gen_random_uuid()`).
 */

const COOKIE_NAME = "rc_pt";
const MAX_AGE_SECONDS = 6 * 60 * 60; // a live session isn't expected to run longer than this

interface ParticipantCookiePayload {
  sessionId: string;
  token: string;
}

export async function setParticipantCookie(sessionId: string, token: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, JSON.stringify({ sessionId, token } satisfies ParticipantCookiePayload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Returns the token only if the cookie's sessionId matches the one asked
 * about — a stale cookie from a previous/different session must never
 * silently authenticate against a new one. */
export async function getParticipantToken(sessionId: string): Promise<string | undefined> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as ParticipantCookiePayload;
    return parsed.sessionId === sessionId ? parsed.token : undefined;
  } catch {
    return undefined;
  }
}
