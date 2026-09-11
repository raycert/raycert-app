"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { mapAuthError } from "@/lib/supabase/auth-errors";
import { getBaseUrl } from "@/lib/supabase/base-url";

/**
 * Trainer auth Server Actions (Phase 10B) — mirrors the existing
 * `app/(trainer)/assessments/actions.ts` pattern already used in this
 * project (plain typed args, called directly from a client component's
 * event handler, not `<form action>`/FormData). Every action uses
 * `lib/supabase/server.ts`'s cookie-aware client only — never
 * `lib/supabase/admin.ts` (§16: "không import admin client vào auth
 * form"). None of these log the password/tokens they handle (§16); on
 * error, only `mapAuthError`'s friendly string ever reaches the caller —
 * never the raw Supabase error object.
 */

export async function signInAction(
  email: string,
  password: string
): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: mapAuthError(error) };

  redirect("/dashboard");
}

export async function signUpAction(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<{ error: string } | { requiresEmailConfirmation: true } | undefined> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { first_name: input.firstName, last_name: input.lastName } },
  });
  if (error) {
    // TEMP DEBUG (dev-only, remove once root cause is found) — code/status/
    // message only, never the password/input or any token.
    if (process.env.NODE_ENV !== "production") {
      console.log("[signUpAction] error.code:", error.code);
      console.log("[signUpAction] error.status:", error.status);
      console.log("[signUpAction] error.message:", error.message);
    }
    return { error: mapAuthError(error) };
  }
  if (!data.user) return { error: "Đăng ký không thành công. Vui lòng thử lại." };

  if (data.session) {
    // Email confirmation is OFF for this project — already logged in.
    // Defensive profile touch-up (§4): the on_auth_user_created trigger
    // should already have set first_name/last_name from
    // raw_user_meta_data, but only re-assert it here — with a real
    // session, RLS allows it — never via the confirmation-pending branch
    // below, where there is no session yet to authorize this update (and
    // reaching for the admin client just for this is exactly what §16
    // forbids).
    await supabase
      .from("profiles")
      .update({ first_name: input.firstName, last_name: input.lastName })
      .eq("id", data.user.id);

    redirect("/dashboard");
  }

  return { requiresEmailConfirmation: true };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordResetAction(email: string): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const baseUrl = await getBaseUrl();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}/auth/confirm?type=recovery&next=/reset-password`,
  });
  if (error) return { error: mapAuthError(error) };

  return { success: true };
}

export async function updatePasswordAction(newPassword: string): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();

  // Requires an active recovery session, established by app/auth/confirm's
  // verifyOtp call when the user followed the emailed reset link (§14) —
  // there is no separate token param to check here, updateUser acts on
  // whatever session this request's cookies currently carry.
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: mapAuthError(error) };

  return { success: true };
}
