"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { appendAttendanceToSheet, uploadImageToDrive } from "../../lib/google-sheets";

export async function handleCheckInOrOut(
  type: "VÀO CA" | "RA CA",
  latitude: string,
  longitude: string,
  photoUrl: string 
) {
  try {
   const session = await auth();
    if (!session?.user || !session.user.email) {
      return { success: false, error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!" };
    }

    const accessToken = session.accessToken; // Lấy token của user ra đây
    if (!accessToken) {
      return { success: false, error: "Không tìm thấy quyền truy cập Google Drive. Vui lòng đăng xuất và đăng nhập lại!" };
    }

    const now = new Date();
    const attendanceDate = now.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    const currentTime = now.toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: '2-digit', minute:'2-digit', second:'2-digit' });

    const checkinTime = type === "VÀO CA" ? currentTime : "";
    const checkoutTime = type === "RA CA" ? currentTime : "";

    const mockAttendanceId = "ATT-" + Math.random().toString(36).substring(2, 9).toUpperCase();
    const employeeEmail = session.user.email; 

    const formattedDate = now.toISOString().split('T')[0];
    const fileName = `${mockAttendanceId}_${formattedDate}_${type.replace(" ", "-")}`;

    // XỬ LÝ UPLOAD ẢNH BẰNG QUYỀN VÀ QUOTA CỦA USER
    let finalPhotoLink = "Chưa kích hoạt Camera";
    
    if (photoUrl && photoUrl.startsWith("data:image")) {
      // Truyền thêm accessToken của user vào hàm upload
      finalPhotoLink = await uploadImageToDrive(photoUrl, fileName, accessToken);
    } else if (photoUrl === "DATA_IMAGE_MOCK_BASE64_DESKTOP_NO_CAMERA") {
      finalPhotoLink = "Link giả lập (Thiết bị PC không có Webcam)";
    }

    // Ghi nhận nhật ký xuống Google Sheets (vẫn dùng Service Account JWT cho Sheets vì Sheets này là database bảo mật chung của công ty)
    const result = await appendAttendanceToSheet({
      attendanceId: mockAttendanceId,
      employeeId: employeeEmail,
      attendanceDate: attendanceDate,
      checkinTime: checkinTime,
      checkoutTime: checkoutTime,
      latitude: latitude,
      longitude: longitude,
      photoUrl: finalPhotoLink,
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