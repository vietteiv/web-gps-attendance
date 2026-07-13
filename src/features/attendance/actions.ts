


"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { appendAttendanceToSheet } from "../../lib/google-sheets";

// Thêm tham số nhận latitude và longitude từ Client gửi vào
export async function handleCheckInOrOut(
  type: "VÀO CA" | "RA CA",
  latitude: string,
  longitude: string
) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.email) {
      return { success: false, error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!" };
    }

    // Tách ngày giờ chuẩn Việt Nam chạy trên Server
    const now = new Date();
    const attendanceDate = now.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    const currentTime = now.toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: '2-digit', minute:'2-digit', second:'2-digit' });

    // Định nghĩa logic Vào/Ra để map vào cột Checkin/Checkout tương ứng
    const checkinTime = type === "VÀO CA" ? currentTime : "";
    const checkoutTime = type === "RA CA" ? currentTime : "";

    const mockAttendanceId = "ATT-" + Math.random().toString(36).substring(2, 9).toUpperCase();
    const employeeEmail = session.user.email; 
    const mockPhotoUrl = "Chưa kích hoạt Camera";

    // Bắn tọa độ thật xuống đúng tab attendance
    const result = await appendAttendanceToSheet({
      attendanceId: mockAttendanceId,
      employeeId: employeeEmail,
      attendanceDate: attendanceDate,
      checkinTime: checkinTime,
      checkoutTime: checkoutTime,
      latitude: latitude,    // Tọa độ thật nhận từ Client
      longitude: longitude,  // Tọa độ thật nhận từ Client
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