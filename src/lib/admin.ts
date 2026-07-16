export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;

  // Đọc chuỗi email từ biến môi trường .env.local
  const adminEmailsEnv = process.env.ADMIN_EMAILS || "";

  // Chuyển chuỗi "email1,email2" thành mảng ["email1", "email2"] và chuẩn hóa chữ thường
  const adminEmails = adminEmailsEnv
    .split(",")
    .map((e) => e.trim().toLowerCase());

  // Kiểm tra xem email đăng nhập có nằm trong danh sách không
  return adminEmails.includes(email.toLowerCase());
}