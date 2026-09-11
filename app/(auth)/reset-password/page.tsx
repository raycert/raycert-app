import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { getCurrentUser } from "@/lib/supabase/auth";

/** `/reset-password` (Phase 10B §14) — only renders the form once a
 * session exists (established either by following a valid recovery email
 * link through `/auth/confirm`, or by an already-logged-in trainer
 * visiting directly). No session -> a clear invalid/expired state, never
 * a form that would just fail silently on submit. */
export default async function ResetPasswordPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
          <h2 className="font-heading text-lg font-bold text-heading">Liên kết không hợp lệ</h2>
          <p className="text-sm text-muted-foreground">
            Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu một liên kết
            mới.
          </p>
          <Button asChild className="mt-2 w-full">
            <Link href="/forgot-password">Yêu cầu liên kết mới</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <ResetPasswordForm />;
}
