import { google } from "googleapis";
import { Readable } from "stream";

// Khởi tạo Google JWT Auth
const auth = new google.auth.JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
  ],
});

const sheets = google.sheets({ version: "v4", auth });

// Interface cho cấu trúc dữ liệu ca làm việc từ sheet "time"
export interface Shift {
  id: string;
  companyId: string;
  shiftName: string;
  startTime: string; // Định dạng "HH:mm:ss" hoặc "HH:mm"
  endTime: string; // Định dạng "HH:mm:ss" hoặc "HH:mm"
}

// Interface cho thông tin công ty từ sheet "settings"
export interface CompanySettings {
  companyId: string;
  companyName: string;
  address: string;
  latitude: number;
  longitude: number;
  checkinRadius: number;
}

interface AttendanceRecord {
  attendanceId: string;
  employeeId: string;
  attendanceDate: string;
  checkinTime: string;
  checkoutTime: string;
  latitude: string;
  longitude: string;
  photoUrl: string; // Chứa link ảnh Drive
  shiftName?: string; // Cột mới để lưu tên ca (Ví dụ: "Ca Sáng") - Cột I trong Sheet
}

// các hàm đọc dữ liệu từ sheet
// Lấy danh sách toàn bộ ca làm việc từ sheet "time" và lọc theo companyId
export async function getShiftsByCompanyId(
  companyId: string,
): Promise<Shift[]> {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const range = "time!A2:E"; // Đọc từ dòng 2 bỏ qua tiêu đề (id, company_id, shift_name, start_time, end_time)

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];

    // Lọc ra các ca làm việc của công ty tương ứng
    return rows
      .filter((row) => row[1] && row[1].toString() === companyId.toString())
      .map((row) => ({
        id: row[0] || "",
        companyId: row[1] || "",
        shiftName: row[2] || "",
        startTime: row[3] || "",
        endTime: row[4] || "",
      }));
  } catch (error) {
    console.error("Lỗi khi đọc danh sách ca từ sheet 'time':", error);
    return [];
  }
}

 // Lấy thông tin cài đặt định vị của công ty từ sheet "settings"
export async function getCompanySettings(
  companyId: string,
): Promise<CompanySettings | null> {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const range = "settings!A2:F"; // company_id, company_name, address, latitude, longitude, checkin_radius

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    const targetRow = rows.find(
      (row) => row[0] && row[0].toString() === companyId.toString(),
    );

    if (!targetRow) return null;

    // Chuyển đổi định dạng chuỗi VN (dùng dấu phẩy) sang Float nếu cần
    const parseGpsCoord = (val: string) => parseFloat(val.replace(",", "."));

    return {
      companyId: targetRow[0],
      companyName: targetRow[1],
      address: targetRow[2] || "",
      latitude: parseGpsCoord(targetRow[3] || "0"),
      longitude: parseGpsCoord(targetRow[4] || "0"),
      checkinRadius: parseInt(targetRow[5] || "1000", 10),
    };
  } catch (error) {
    console.error("Lỗi khi đọc cấu hình từ sheet 'settings':", error);
    return null;
  }
}

// file upload drive & ghi nhật ký
export async function uploadImageToDrive(
  base64Data: string,
  fileName: string,
  accessToken: string,
): Promise<string> {
  try {
    const strippedData = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(strippedData, "base64");

    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const userDrive = google.drive({ version: "v3", auth: oauth2Client });

    let folderId = "";
    const listResponse = await userDrive.files.list({
      q: "name = 'WMS_Attendance_Photos' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: "files(id)",
    });

    if (listResponse.data.files && listResponse.data.files.length > 0) {
      folderId = listResponse.data.files[0].id || "";
    } else {
      const folderResponse = await userDrive.files.create({
        requestBody: {
          name: "WMS_Attendance_Photos",
          mimeType: "application/vnd.google-apps.folder",
        },
        fields: "id",
      });
      folderId = folderResponse.data.id || "";
    }

    const fileResponse = await userDrive.files.create({
      requestBody: {
        name: `${fileName}.jpg`,
        parents: folderId ? [folderId] : [],
      },
      media: {
        mimeType: "image/jpeg",
        body: bufferStream,
      },
      fields: "id",
    });

    const fileId = fileResponse.data.id;

    if (fileId) {
      await userDrive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });
    }

    return fileId || "LỖI_KHÔNG_CÓ_ID";
  } catch (error) {
    console.error("Lỗi khi upload ảnh bằng quyền User:", error);
    return "LỖI_UPLOAD_DRIVE";
  }
}

// Hàm ghi nhật ký vào gg sheets
export async function appendAttendanceToSheet(record: AttendanceRecord) {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const range = "attendance!A:I";

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            record.attendanceId,
            record.employeeId,
            record.attendanceDate,
            record.checkinTime,
            record.checkoutTime,
            record.latitude,
            record.longitude,
            record.photoUrl,
            record.shiftName || "Không xác định", // Thêm tên ca vào dòng ghi nhận
          ],
        ],
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Lỗi khi ghi dữ liệu vào Google Sheets:", error);
    return { success: false, error };
  }
}

// Hàm biến đổi ID thô thành Link xem ảnh trên Web
function convertIdToDriveLink(photoField: string): string {
  if (!photoField) return "";
  const trimmed = photoField.trim();

  // Nếu đã là link rồi thì giữ nguyên
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // Nếu là giả lập hoặc rỗng thì giữ nguyên
  if (trimmed.toLowerCase().includes("giả lập") || trimmed === "") {
    return trimmed;
  }

  // Nếu là ID thô, chuyển thành link xem trên Web
  return `https://drive.google.com/uc?export=view&id=${trimmed}`;
}

// đọc lịch sử chấm công 
export interface AttendanceLog {
  id: string;
  type: "VÀO CA" | "RA CA";
  time: string;
  photoUrl: string;
  shiftName: string; // Tên ca hiển thị trên giao diện lịch sử
}

export interface GroupedAttendance {
  date: string;
  dateObj: Date;
  logs: AttendanceLog[];
  status: string;
}
// Lấy lịch sử chấm công của nhân viên và tự động dựng link ảnh Drive từ ID thô 
export async function getAttendanceHistory(
  employeeEmail: string,
): Promise<GroupedAttendance[]> {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const range = "attendance!A2:I"; // Đọc cả cột I (Tên Ca)

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];

    const userRows = rows.filter(
      (row) => row[1] && row[1].toLowerCase() === employeeEmail.toLowerCase(),
    );

    const groups: { [key: string]: GroupedAttendance } = {};

    userRows.forEach((row) => {
      const attendanceId = row[0] || "";
      const dateStr = row[2] || "";
      const checkInTime = row[3] || "";
      const checkOutTime = row[4] || "";
      const rawPhotoVal = row[7] || "";
      const photoUrl = convertIdToDriveLink(rawPhotoVal);
      const shiftName = row[8] || "Hành chính"; // Cột I (Index 8) chứa tên ca

      if (!dateStr) return;

      const [day, month, year] = dateStr.split("/").map(Number);
      const dateObj = new Date(year, month - 1, day);

      if (!groups[dateStr]) {
        groups[dateStr] = {
          date: dateStr,
          dateObj,
          logs: [],
          status: "Hợp lệ",
        };
      }

      if (checkInTime && checkInTime.trim() !== "") {
        groups[dateStr].logs.push({
          id: attendanceId + "-in",
          type: "VÀO CA",
          time: checkInTime,
          photoUrl: photoUrl,
          shiftName: shiftName,
        });
      } else if (checkOutTime && checkOutTime.trim() !== "") {
        groups[dateStr].logs.push({
          id: attendanceId + "-out",
          type: "RA CA",
          time: checkOutTime,
          photoUrl: photoUrl,
          shiftName: shiftName,
        });
      }
    });

    return Object.values(groups)
      .map((group) => {
        group.logs.reverse();
        return group;
      })
      .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  } catch (error) {
    console.error("Lỗi khi đọc lịch sử chấm công từ Sheets:", error);
    return [];
  }
}
