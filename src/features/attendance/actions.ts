"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { 
  appendAttendanceToSheet, 
  uploadImageToDrive, 
  getShiftsByCompanyId, 
  getCompanySettings 
} from "../../lib/google-sheets";

// Hàm phụ trợ tính khoảng cách GPS giữa 2 tọa độ (Haversine Formula) - Đơn vị: Mét
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Bán kính Trái Đất (mét)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Hàm đổi định dạng chuỗi "HH:mm:ss" hoặc "HH:mm" thành tổng số phút trong ngày
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

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

    const accessToken = session.accessToken; 
    if (!accessToken) {
      return { success: false, error: "Không tìm thấy quyền truy cập Google Drive. Vui lòng đăng xuất và đăng nhập lại!" };
    }

    // ==========================================
    // 1. LẤY THÔNG TIN CÀI ĐẶT ĐỊNH VỊ GPS VÀ KIỂM TRA
    // ==========================================
    
    // Giả sử logic của bạn lấy ra mã công ty của user. Hiện tại test cứng là "1" (Mã của công ty Dong tay)
    // Sau này bạn hãy gán dynamic theo thông tin tài khoản của user (Ví dụ: session.user.companyId)
    const userCompanyId = "1"; 
    
    const companySettings = await getCompanySettings(userCompanyId);
    if (!companySettings) {
      return { success: false, error: "Không tìm thấy cấu hình vị trí của công ty bạn." };
    }

    // Chuyển đổi tọa độ GPS gửi lên từ Client (Next.js dùng dấu phẩy, chuyển về dấu chấm để tính toán)
    const clientLat = parseFloat(latitude.replace(",", "."));
    const clientLng = parseFloat(longitude.replace(",", "."));

    // Tính toán khoảng cách từ nhân viên tới công ty
    const distance = getDistanceInMeters(
      clientLat,
      clientLng,
      companySettings.latitude,
      companySettings.longitude
    );

    // Kiểm tra xem có vượt quá bán kính check-in cho phép không
    if (distance > companySettings.checkinRadius) {
      return { 
        success: false, 
        error: `Chấm công thất bại! Bạn đang ở cách công ty ${Math.round(distance)}m (Yêu cầu dưới ${companySettings.checkinRadius}m).` 
      };
    }

    // ==========================================
    // 2. TỰ ĐỘNG NHẬN DIỆN CA LÀM VIỆC THEO GIỜ THỰC TẾ
    // ==========================================

    const now = new Date();
    const attendanceDate = now.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    const currentTime = now.toLocaleTimeString("vi-VN", { 
      timeZone: "Asia/Ho_Chi_Minh", 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });

    const checkinTime = type === "VÀO CA" ? currentTime : "";
    const checkoutTime = type === "RA CA" ? currentTime : "";

    // Đọc các ca từ sheet "time"
    const shifts = await getShiftsByCompanyId(userCompanyId);
    if (!shifts || shifts.length === 0) {
      return { success: false, error: "Không tìm thấy bất kỳ ca làm việc nào được cấu hình." };
    }

    const currentMinutes = timeToMinutes(currentTime);
    const MID_DAY_LIMIT_MINUTES = timeToMinutes("12:45:00"); // Mốc phân tách ca sáng - ca chiều

    let targetShift = null;

    // Tìm ca phù hợp dựa trên mốc giờ trưa
    if (currentMinutes < MID_DAY_LIMIT_MINUTES) {
      // Tìm ca sáng (Hoặc lấy phần tử đầu tiên nếu không khớp tên)
      targetShift = shifts.find(s => s.shiftName.toLowerCase().includes("sáng")) || shifts[0];
    } else {
      // Tìm ca chiều (Nếu không có, lấy ca thứ 2 hoặc ca đầu tiên)
      targetShift = shifts.find(s => s.shiftName.toLowerCase().includes("chiều")) || shifts[1] || shifts[0];
    }

    // ==========================================
    // 3. TÍNH TOÁN ĐI TRỄ (KHI VÀO CA)
    // ==========================================
    let isLate = false;
    let lateMinutes = 0;
    let statusMessage = "";

    if (type === "VÀO CA") {
      const shiftStartMinutes = timeToMinutes(targetShift.startTime);
      if (currentMinutes > shiftStartMinutes) {
        isLate = true;
        lateMinutes = currentMinutes - shiftStartMinutes;
        statusMessage = `Thực hiện VÀO CA thành công cho [${targetShift.shiftName}] lúc ${currentTime}! (Bạn đi trễ ${lateMinutes} phút).`;
      } else {
        statusMessage = `Thực hiện VÀO CA thành công cho [${targetShift.shiftName}] lúc ${currentTime}! (Đúng giờ).`;
      }
    } else {
      statusMessage = `Thực hiện RA CA thành công cho [${targetShift.shiftName}] lúc ${currentTime}!`;
    }

    // ==========================================
    // 4. UPLOAD ẢNH SELFIE LÊN DRIVE
    // ==========================================
    const mockAttendanceId = "ATT-" + Math.random().toString(36).substring(2, 9).toUpperCase();
    const employeeEmail = session.user.email; 

    const formattedDate = now.toISOString().split('T')[0];
    const fileName = `${mockAttendanceId}_${formattedDate}_${type.replace(" ", "-")}`;

    let finalPhotoLink = "Chưa kích hoạt Camera";
    
    if (photoUrl && photoUrl.startsWith("data:image")) {
      finalPhotoLink = await uploadImageToDrive(photoUrl, fileName, accessToken);
    } else if (photoUrl === "DATA_IMAGE_MOCK_BASE64_DESKTOP_NO_CAMERA") {
      finalPhotoLink = "Link giả lập (Thiết bị PC không có Webcam)";
    }

    // ==========================================
    // 5. GHI NHẬT KÝ ĐỒNG BỘ XUỐNG GOOGLE SHEETS
    // ==========================================
    const result = await appendAttendanceToSheet({
      attendanceId: mockAttendanceId,
      employeeId: employeeEmail,
      attendanceDate: attendanceDate,
      checkinTime: checkinTime,
      checkoutTime: checkoutTime,
      latitude: latitude,
      longitude: longitude,
      photoUrl: finalPhotoLink,
  shiftName: isLate ? `${targetShift.shiftName} (Late)` : targetShift.shiftName,
    });

    if (result.success) {
      revalidatePath("/dashboard");
      return { success: true, message: statusMessage };
    } else {
      return { success: false, error: "Không thể ghi dữ liệu vào Google Sheets." };
    }
  } catch (error) {
    console.error("Lỗi Server Action chấm công:", error);
    return { success: false, error: "Có lỗi xảy ra trên hệ thống." };
  }
}