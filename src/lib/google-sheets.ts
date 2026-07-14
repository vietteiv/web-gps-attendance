import { google} from "googleapis";
import { Readable } from "stream";

// Bổ sung thêm scope quyền Google Drive
const auth = new google.auth.JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file"
  ],
});

const sheets = google.sheets({ version: "v4", auth });

interface AttendanceRecord {
  attendanceId: string;
  employeeId: string;
  attendanceDate: string;
  checkinTime: string;
  checkoutTime: string;
  latitude: string;
  longitude: string;
  photoUrl: string; // Nơi này mốt sẽ chứa link ảnh Drive thật
}


// hàm upload ảnh bằng token của user 
export async function uploadImageToDrive(
  base64Data: string, 
  fileName: string, 
  accessToken: string // Nhận access_token của user
): Promise<string> {
  try {
    const strippedData = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(strippedData, "base64");

    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);

    // Sử dụng OAuth2 client với token của chính user đăng nhập
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const userDrive = google.drive({ version: "v3", auth: oauth2Client });

    // Tìm xem trên Drive của User đã có thư mục "WMS_Attendance_Photos" chưa
    let folderId = "";
    const listResponse = await userDrive.files.list({
      q: "name = 'WMS_Attendance_Photos' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: "files(id)",
    });

    if (listResponse.data.files && listResponse.data.files.length > 0) {
      folderId = listResponse.data.files[0].id || "";
    } else {
      // Nếu chưa có thư mục, tự động tạo một thư mục mới tên là "WMS_Attendance_Photos"
      const folderResponse = await userDrive.files.create({
        requestBody: {
          name: "WMS_Attendance_Photos",
          mimeType: "application/vnd.google-apps.folder",
        },
        fields: "id",
      });
      folderId = folderResponse.data.id || "";
    }

    // Upload ảnh selfie vào thư mục đó
    const fileResponse = await userDrive.files.create({
      requestBody: {
        name: `${fileName}.jpg`,
        parents: folderId ? [folderId] : [],
      },
      media: {
        mimeType: "image/jpeg",
        body: bufferStream,
      },
      fields: "id, webViewLink",
    });

    const fileId = fileResponse.data.id;

    // Chia sẻ quyền đọc (anyone) khi click vào link từ Google Sheets là xem được luôn
    if (fileId) {
      await userDrive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });
    }

    return fileResponse.data.webViewLink || "Không lấy được link ảnh";
  } catch (error) {
    console.error("Lỗi khi upload ảnh bằng quyền User:", error);
    return "LỖI_UPLOAD_DRIVE";
  }
}


// hàm ghi nhật ký vào gg sheets
export async function appendAttendanceToSheet(record: AttendanceRecord) {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const range = "attendance!A:H";

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
            record.photoUrl, // Link ảnh Drive xịn sẽ được ghi vào đây
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

// định nghĩa cấu trúc cho từng dòng quét 
export interface AttendanceLog {
  id: string;
  type: "VÀO CA" | "RA CA";
  time: string;
  photoUrl: string;
}

export interface GroupedAttendance {
  date: string;
  dateObj: Date;
  logs: AttendanceLog[]; // Danh sách các hàng quét thực tế trong ngày
  status: string;
}

// hàm lấy lịch sử chấm công 
export async function getAttendanceHistory(employeeEmail: string): Promise<GroupedAttendance[]> {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const range = "attendance!A2:H"; // Bỏ qua tiêu đề hàng 1

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    
    // Lọc các dòng thuộc về nhân viên đang đăng nhập
    const userRows = rows.filter(
      (row) => row[1] && row[1].toLowerCase() === employeeEmail.toLowerCase()
    );

    // Gom nhóm theo ngày nhưng giữ nguyên từng lượt quét riêng biệt
    const groups: { [key: string]: GroupedAttendance } = {};

    userRows.forEach((row) => {
      const attendanceId = row[0] || "";
      const dateStr = row[2] || ""; 
      const checkInTime = row[3] || "";
      const checkOutTime = row[4] || "";
      const photoUrl = row[7] || "";

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

      // Kiểm tra thực tế dòng dữ liệu dưới Sheet để phân loại lượt quét
      if (checkInTime && checkInTime.trim() !== "") {
        groups[dateStr].logs.push({
          id: attendanceId + "-in",
          type: "VÀO CA",
          time: checkInTime,
          photoUrl: photoUrl,
        });
      } else if (checkOutTime && checkOutTime.trim() !== "") {
        groups[dateStr].logs.push({
          id: attendanceId + "-out",
          type: "RA CA",
          time: checkOutTime,
          photoUrl: photoUrl,
        });
      }
    });

    // Đổi sang mảng, đảo ngược log để lượt bấm mới nhất lên đầu, và xếp ngày mới nhất lên trước
    return Object.values(groups)
      .map((group) => {
        group.logs.reverse(); // Lượt bấm mới nhất trong ngày hiển thị lên đầu
        return group;
      })
      .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  } catch (error) {
    console.error("Lỗi khi đọc lịch sử chấm công từ Sheets:", error);
    return [];
  }
}