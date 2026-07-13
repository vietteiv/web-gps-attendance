"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
// Đảm bảo import đúng đường dẫn tương đối của ông
import { appendAttendanceToSheet } from "../../lib/google-sheets";

export async function handleCheckInOrOut(type: "VÀO CA" | "RA CA") {
  try {
    const session = await auth();
    if (!session?.user || !session.user.email) {
      return { success: false, error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!" };
    }

    // 1. Tách ngày giờ chuẩn Việt Nam chạy trên Server
    const now = new Date();
    const attendanceDate = now.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }); // DD/MM/YYYY hoặc YYYY-MM-DD tùy định dạng máy
    const currentTime = now.toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: '2-digit', minute:'2-digit', second:'2-digit' });

    // 2. Định nghĩa logic Vào/Ra để map vào cột Checkin/Checkout tương ứng
    const checkinTime = type === "VÀO CA" ? currentTime : "";
    const checkoutTime = type === "RA CA" ? currentTime : "";

    // Giả lập dữ liệu ID tạm thời cho MVP 1
    const mockAttendanceId = "ATT-" + Math.random().toString(36).substring(2, 9).toUpperCase();
    const mockEmployeeId = session.user.email; // Tạm thời dùng Email làm ID liên kết bảng employees
const mockLatitude = "10.7626";
const mockLongitude = "106.6602";

    const mockPhotoUrl = "Chưa kích hoạt Camera";

    // 3. Bắn dữ liệu chuẩn xuống đúng tab attendance
    const result = await appendAttendanceToSheet({
      attendanceId: mockAttendanceId,
      employeeId: mockEmployeeId,
      attendanceDate: attendanceDate,
      checkinTime: checkinTime,
      checkoutTime: checkoutTime,
      latitude: mockLatitude,
      longitude: mockLongitude,
      photoUrl: mockPhotoUrl,
    });

    if (result.success) {
      revalidatePath("/dashboard");
      return { success: true, message: `Thực hiện ${type} thành công lúc ${currentTime}!` };
    } else {
      return { success: false, error: "Không thể ghi dữ liệu vào Google Sheets." };
    }
  } catch (error) {
    console.error("Lỗi Server Action chấm công:", error);
    return { success: false, error: "Có lỗi xảy ra trên hệ thống." };
  }
}