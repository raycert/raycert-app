"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signUpAction } from "@/app/(auth)/actions";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

/** `/signup` (Phase 10B §4). "Họ" (surname) maps to the DB's `last_name`,
 * "Tên" (given name) maps to `first_name` — Vietnamese naming order, not
 * the Western order the column names suggest. Handles both email-
 * confirmation-on and -off outcomes from `signUpAction` (§5) — this
 * component can't know the project's Auth setting in advance, so it
 * branches on whatever the action actually returns. */
export function SignupForm() {
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const trimmedLastName = lastName.trim();
  const trimmedFirstName = firstName.trim();
  const trimmedEmail = email.trim();

  const lastNameError = touched && trimmedLastName.length === 0 ? "Vui lòng nhập họ" : undefined;
  const firstNameError = touched && trimmedFirstName.length === 0 ? "Vui lòng nhập tên" : undefined;
  const emailError = !touched
    ? undefined
    : trimmedEmail.length === 0
      ? "Vui lòng nhập email"
      : !EMAIL_PATTERN.test(trimmedEmail)
        ? "Email không hợp lệ"
        : undefined;
  const passwordError = !touched
    ? undefined
    : password.length === 0
      ? "Vui lòng nhập mật khẩu"
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

  const isValid =
    trimmedLastName.length > 0 &&
    trimmedFirstName.length > 0 &&
    EMAIL_PATTERN.test(trimmedEmail) &&
    password.length >= MIN_PASSWORD_LENGTH &&
    confirmPassword === password;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setFormError(null);
    if (!isValid) return;

    setSubmitting(true);
    const result = await signUpAction({
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      email: trimmedEmail,
      password,
    });
    setSubmitting(false);

    if (result && "error" in result) {
      setFormError(result.error);
      return;
    }
    if (result && "requiresEmailConfirmation" in result) {
      setAwaitingConfirmation(true);
    }
    // No result at all means signUpAction already redirected to /dashboard.
  }

  if (awaitingConfirmation) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-success-100 text-success-600">
            <CheckCircleIcon className="size-6" />
          </div>
          <h2 className="font-heading text-lg font-bold text-heading">Kiểm tra email của bạn</h2>
          <p className="text-sm text-muted-foreground">
            Chúng tôi đã gửi một liên kết xác nhận tới <strong className="text-heading">{trimmedEmail}</strong>.
            Vui lòng mở email và xác nhận để hoàn tất đăng ký.
          </p>
          <Button variant="secondary" asChild className="mt-2 w-full">
            <Link href="/login">Quay lại đăng nhập</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">Đăng ký</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-last-name" className="text-[13px] font-semibold text-heading">
                Họ
              </label>
              <Input
                id="signup-last-name"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                aria-invalid={!!lastNameError}
              />
              {lastNameError ? <p className="text-sm text-destructive">{lastNameError}</p> : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-first-name" className="text-[13px] font-semibold text-heading">
                Tên
              </label>
              <Input
                id="signup-first-name"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                aria-invalid={!!firstNameError}
              />
              {firstNameError ? <p className="text-sm text-destructive">{firstNameError}</p> : null}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="signup-email" className="text-[13px] font-semibold text-heading">
              Email
            </label>
            <Input
              id="signup-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!emailError}
            />
            {emailError ? <p className="text-sm text-destructive">{emailError}</p> : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="signup-password" className="text-[13px] font-semibold text-heading">
              Password
            </label>
            <Input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!passwordError}
            />
            {passwordError ? <p className="text-sm text-destructive">{passwordError}</p> : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="signup-confirm-password" className="text-[13px] font-semibold text-heading">
              Confirm Password
            </label>
            <Input
              id="signup-confirm-password"
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
            {submitting ? "Đang đăng ký…" : "Đăng ký"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Đăng nhập
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
