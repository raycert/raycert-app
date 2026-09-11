/**
 * Postgres/PostgREST error -> friendly Vietnamese message (Phase 10C §16 —
 * "Không hiển thị raw Supabase error cho user"). Same spirit as
 * `lib/supabase/auth-errors.ts`, but Postgres errors use numeric SQLSTATE
 * codes rather than Supabase Auth's named `ErrorCode` enum.
 */
export function mapDataError(error: { message?: string; code?: string } | null | undefined): string {
  if (!error) return "Có lỗi xảy ra. Vui lòng thử lại.";

  switch (error.code) {
    case "23505": // unique_violation
      return "Dữ liệu bị trùng lặp.";
    case "23514": // check_violation
    case "23502": // not_null_violation
      return "Dữ liệu không hợp lệ.";
    case "23503": // foreign_key_violation
      return "Không thể thực hiện — dữ liệu liên quan không hợp lệ.";
    case "42501": // insufficient_privilege (RLS denied)
      return "Bạn không có quyền thực hiện thao tác này.";
    case "PGRST116": // PostgREST: no rows / not found for .single()
      return "Không tìm thấy dữ liệu.";
    default:
      return "Có lỗi khi lưu dữ liệu. Vui lòng thử lại.";
  }
}
