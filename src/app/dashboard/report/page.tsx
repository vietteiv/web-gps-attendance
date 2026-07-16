import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { logout } from "@/features/auth/actions";
import { google } from "googleapis";
import Link from "next/link";

const sheetAuth = new google.auth.JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth: sheetAuth });

export default async function ReportPage() {
  const session = await auth();

  if (!session?.user || !session.user.email) {
    redirect("/login");
  }

  if (!isAdmin(session.user.email)) {
    redirect("/dashboard");
  }

  let rows: string[][] = [];
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "attendance!A2:I",
    });
    rows = response.data.values || [];
  } catch (error) {
    console.error("Lỗi khi đọc Sheets làm báo cáo:", error);
  }

  const reportData: { 
    [email: string]: { 
      checkIns: number; 
      checkOuts: number;
      lateCount: number;
    } 
  } = {};

 rows.forEach((row) => {
    const email = row[1];
    const checkIn = row[3];
    const checkOut = row[4];
    
    // Lấy trực tiếp tên Ca ở cột I 
    const shiftName = row[8] || ""; 
    const shiftNameSafe = shiftName.toLowerCase().trim();

    if (!email) return;

    if (!reportData[email]) {
      reportData[email] = { checkIns: 0, checkOuts: 0, lateCount: 0 };
    }

    if (checkIn && checkIn.trim() !== "") {
      reportData[email].checkIns++;
      
      // 🚀 ĐÃ SỬA: Kiểm tra chính xác chữ "late" trong tên ca làm việc ở cột I
      if (shiftNameSafe.includes("late") || shiftNameSafe.includes("(late)")) {
        reportData[email].lateCount++;
      }
    }
    if (checkOut && checkOut.trim() !== "") {
      reportData[email].checkOuts++;
    }
  });

  const emailList = Object.keys(reportData);

  return (
    <div className="min-h-screen bg-slate-50 p-6 dark:bg-slate-950 dark:text-white">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Báo cáo chấm công tổng hợp</h1>
          <p className="text-sm text-slate-500">Tổng hợp dữ liệu chấm công thực tế từ Google Sheet</p>
        </div>
        
        {/* KHU VỰC ĐIỀU HƯỚNG VÀ THAO TÁC CỦA SẾP */}
        <div className="flex items-center gap-6">
          {/* Nút quay lại trang chấm công cá nhân */}
          <Link 
            href="/dashboard" 
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← Quay lại 
          </Link>

          <form action={logout}>
            <button type="submit" className="text-sm font-semibold text-red-600 hover:underline dark:text-red-400 cursor-pointer">
              Đăng xuất
            </button>
          </form>
        </div>
      </header>

      <main className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400 pb-3">
                <th className="pb-3 font-semibold">Nhân viên</th>
                <th className="pb-3 font-semibold text-center">Tổng số lượt Vào</th>
                <th className="pb-3 font-semibold text-center">Tổng số lượt Ra</th>
                <th className="pb-3 font-semibold text-center">Tổng số lần đi trễ</th>
                <th className="pb-3 font-semibold text-right">Trạng thái dữ liệu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {emailList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Chưa có dữ liệu chấm công nào trên toàn hệ thống.
                  </td>
                </tr>
              ) : (
                emailList.map((email) => (
                  <tr key={email} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-4 font-medium">
                      {/* 🚀 ĐC GIỮ NGUYÊN: Trỏ sang thư mục con /dashboard/report/[email] */}
                      <Link 
                        href={`/dashboard/report/${encodeURIComponent(email)}`} 
                        className="text-blue-600 hover:underline dark:text-blue-400 font-semibold"
                      >
                        {email}
                      </Link>
                    </td>
                    <td className="py-4 text-center text-emerald-600 font-semibold">{reportData[email].checkIns} lần</td>
                    <td className="py-4 text-center text-rose-600 font-semibold">{reportData[email].checkOuts} lần</td>
                    <td className="py-4 text-center">
                      <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                        reportData[email].lateCount > 0
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-400"
                      }`}>
                        {reportData[email].lateCount} lần trễ
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-950/60 dark:text-blue-400">
                        Đang đồng bộ Sheets
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}