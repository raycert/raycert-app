"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signInAction } from "@/app/(auth)/actions";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** `/login` (Phase 10B §3). Client-side validation mirrors the app's
 * existing touched-gated pattern (`StudentInformationForm`) — errors only
 * appear after a submit attempt, not on every keystroke. */
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const emailError = !touched
    ? undefined
    : email.trim().length === 0
      ? "Vui lòng nhập email"
      : !EMAIL_PATTERN.test(email.trim())
        ? "Email không hợp lệ"
        : undefined;
  const passwordError = !touched ? undefined : password.length === 0 ? "Vui lòng nhập mật khẩu" : undefined;

  const isValid = EMAIL_PATTERN.test(email.trim()) && password.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setFormError(null);
    if (!isValid) return;

    setSubmitting(true);
    const result = await signInAction(email.trim(), password);
    setSubmitting(false);
    if (result?.error) setFormError(result.error);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">Đăng nhập</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-email" className="text-[13px] font-semibold text-heading">
              Email
            </label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "login-email-error" : undefined}
            />
            {emailError ? (
              <p id="login-email-error" role="alert" className="text-sm text-destructive">
                {emailError}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="text-[13px] font-semibold text-heading">
                Mật khẩu
              </label>
              <Link href="/forgot-password" className="text-[12.5px] font-medium text-primary hover:underline">
                Quên mật khẩu?
              </Link>
            </div>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? "login-password-error" : undefined}
            />
            {passwordError ? (
              <p id="login-password-error" role="alert" className="text-sm text-destructive">
                {passwordError}
              </p>
            ) : null}
          </div>

          {formError ? (
            <p role="alert" className="rounded-md bg-error-100 px-3 py-2 text-sm text-error-600">
              {formError}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Đang đăng nhập…" : "Đăng nhập"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Chưa có tài khoản?{" "}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Đăng ký
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
