"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updatePasswordAction } from "@/app/(auth)/actions";

const MIN_PASSWORD_LENGTH = 8;

/** `/reset-password` (Phase 10B §14) — only ever rendered once the page has
 * already confirmed an active session exists (see page.tsx); this
 * component itself just collects/submits the new password. */
export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordError = !touched
    ? undefined
    : password.length === 0
      ? "Vui lòng nhập mật khẩu mới"
      : password.length < MIN_PASSWORD_LENGTH
        ? `Mật khẩu tối thiểu ${MIN_PASSWORD_LENGTH} ký tự`
        : undefined;
  const confirmError = !touched
    ? undefined
    : confirmPassword.length === 0
      ? "Vui lòng nhập lại mật khẩu"
      : confirmPassword !== password
        ? "Mật khẩu nhập lại không khớp"
        : undefined;
  const isValid = password.length >= MIN_PASSWORD_LENGTH && confirmPassword === password;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setFormError(null);
    if (!isValid) return;

    setSubmitting(true);
    const result = await updatePasswordAction(password);
    setSubmitting(false);

    if ("error" in result) {
      setFormError(result.error);
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/dashboard"), 1500);
  }

  if (success) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
          <h2 className="font-heading text-lg font-bold text-heading">Đã đặt lại mật khẩu</h2>
          <p className="text-sm text-muted-foreground">Đang chuyển tới Dashboard…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">Đặt lại mật khẩu</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reset-password" className="text-[13px] font-semibold text-heading">
              Mật khẩu mới
            </label>
            <Input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!passwordError}
            />
            {passwordError ? <p className="text-sm text-destructive">{passwordError}</p> : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="reset-confirm-password" className="text-[13px] font-semibold text-heading">
              Nhập lại mật khẩu mới
            </label>
            <Input
              id="reset-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-invalid={!!confirmError}
            />
            {confirmError ? <p className="text-sm text-destructive">{confirmError}</p> : null}
          </div>

          {formError ? (
            <p role="alert" className="rounded-md bg-error-100 px-3 py-2 text-sm text-error-600">
              {formError}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Đang lưu…" : "Đặt lại mật khẩu"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
