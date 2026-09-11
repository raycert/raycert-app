"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requestPasswordResetAction } from "@/app/(auth)/actions";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** `/forgot-password` (Phase 10B §13). Always shows the same confirmation
 * after a valid-looking submit, whether or not the email is actually
 * registered — Supabase's `resetPasswordForEmail` itself doesn't reveal
 * that either, avoiding an account-enumeration side channel. */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const trimmedEmail = email.trim();
  const emailError = !touched
    ? undefined
    : trimmedEmail.length === 0
      ? "Vui lòng nhập email"
      : !EMAIL_PATTERN.test(trimmedEmail)
        ? "Email không hợp lệ"
        : undefined;
  const isValid = EMAIL_PATTERN.test(trimmedEmail);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setFormError(null);
    if (!isValid) return;

    setSubmitting(true);
    const result = await requestPasswordResetAction(trimmedEmail);
    setSubmitting(false);

    if ("error" in result) {
      setFormError(result.error);
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-success-100 text-success-600">
            <MailCheckIcon className="size-6" />
          </div>
          <h2 className="font-heading text-lg font-bold text-heading">Đã gửi email</h2>
          <p className="text-sm text-muted-foreground">
            Nếu <strong className="text-heading">{trimmedEmail}</strong> có trong hệ thống, bạn sẽ nhận được
            email hướng dẫn đặt lại mật khẩu trong ít phút.
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
        <CardTitle className="font-heading text-xl">Quên mật khẩu</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <p className="text-sm text-muted-foreground">
            Nhập email tài khoản của bạn — chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.
          </p>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="forgot-email" className="text-[13px] font-semibold text-heading">
              Email
            </label>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!emailError}
            />
            {emailError ? <p className="text-sm text-destructive">{emailError}</p> : null}
          </div>

          {formError ? (
            <p role="alert" className="rounded-md bg-error-100 px-3 py-2 text-sm text-error-600">
              {formError}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Đang gửi…" : "Gửi liên kết đặt lại mật khẩu"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Quay lại đăng nhập
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
