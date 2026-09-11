import { isAuthApiError } from "@supabase/supabase-js";

/**
 * Supabase Auth error -> friendly Vietnamese message (Phase 10B §12).
 * Matches on `.code` (a stable, documented enum from `@supabase/auth-js`),
 * never on `.message` substrings (English, not guaranteed stable across
 * SDK/project versions) and never returns the raw error/stack to the
 * caller — an unrecognized code falls through to a generic message rather
 * than leaking internals.
 */
export function mapAuthError(error: unknown): string {
  if (!isAuthApiError(error)) {
    return "Có lỗi kết nối xảy ra. Vui lòng kiểm tra mạng và thử lại.";
  }

  switch (error.code) {
    case "invalid_credentials":
      return "Email hoặc mật khẩu không đúng.";
    case "email_exists":
    case "user_already_exists":
    case "identity_already_exists":
      return "Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.";
    case "weak_password":
      return "Mật khẩu chưa đủ mạnh. Vui lòng chọn mật khẩu khác.";
    case "email_not_confirmed":
      return "Email chưa được xác nhận. Vui lòng kiểm tra hộp thư để xác nhận tài khoản.";
    case "email_address_invalid":
      return "Địa chỉ email không hợp lệ.";
    case "same_password":
      return "Mật khẩu mới phải khác mật khẩu hiện tại.";
    case "otp_expired":
      return "Liên kết đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu lại.";
    case "session_expired":
    case "session_not_found":
    case "refresh_token_not_found":
    case "refresh_token_already_used":
      return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Bạn vừa thực hiện thao tác này nhiều lần. Vui lòng thử lại sau ít phút.";
    case "signup_disabled":
      return "Đăng ký tài khoản hiện đang tạm khoá. Vui lòng liên hệ quản trị viên.";
    default:
      return "Có lỗi xảy ra. Vui lòng thử lại.";
  }
}
