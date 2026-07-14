import { google,} from "googleapis";
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


// HÀM UPLOAD ẢNH BẰNG ACCESS TOKEN CỦA USER ĐĂNG NHẬP
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

    // 1. Tìm xem trên Drive của User đã có thư mục "WMS_Attendance_Photos" chưa
    let folderId = "";
    const listResponse = await userDrive.files.list({
      q: "name = 'WMS_Attendance_Photos' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: "files(id)",
    });

    if (listResponse.data.files && listResponse.data.files.length > 0) {
      folderId = listResponse.data.files[0].id || "";
    } else {
      // 2. Nếu chưa có thư mục, tự động tạo một thư mục mới tên là "WMS_Attendance_Photos"
      const folderResponse = await userDrive.files.create({
        requestBody: {
          name: "WMS_Attendance_Photos",
          mimeType: "application/vnd.google-apps.folder",
        },
        fields: "id",
      });
      folderId = folderResponse.data.id || "";
    }

    // 3. Upload ảnh selfie vào thư mục đó
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

    // 4. Chia sẻ quyền đọc (anyone) để Sếp click vào link từ Google Sheets là xem được luôn
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


// HÀM GHI NHẬT KÝ VÀO GOOGLE SHEETS
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