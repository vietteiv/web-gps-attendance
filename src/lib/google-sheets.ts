




import { google } from "googleapis";

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

interface AttendanceRecord {
  attendanceId: string; // Cột A: attendance_id (Tự sinh chuỗi ngẫu nhiên hoặc UUID)
  employeeId: string; // Cột B: employee_id
  attendanceDate: string; // Cột C: attendance_date (YYYY-MM-DD)
  checkinTime: string; // Cột D: checkin_time (Giờ vào)
  checkoutTime: string; // Cột E: checkout_time (Giờ ra, nếu đang vào ca thì để trống "")
  latitude: string; // Cột F: checkin_latitude
  longitude: string; // Cột G: checkin_longitude
  photoUrl: string; // Cột H: checkin_photo_url
}

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
            `'${record.latitude}`, 
            `'${record.longitude}`, 
            record.photoUrl, 
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

