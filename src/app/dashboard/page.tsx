import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { logout } from "@/features/auth/actions";
import { AttendanceButtons } from "@/components/attendance-buttons";
import { getAttendanceHistory } from "@/lib/google-sheets";
import { AttendanceHistory } from "@/components/attendance-history"; // Import bảng lọc Client mới

export const metadata = {
  title: "Bảng điều khiển | Hệ thống chấm công GPS WMS",
  description: "Trang tổng quan chấm công hàng ngày, theo dõi vị trí GPS và thực hiện chụp ảnh selfie.",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user || !session.user.email) {
    redirect("/login");
  }

  // Gọi hàm lấy lịch sử gộp theo ngày
  const groupedHistory = await getAttendanceHistory(session.user.email);

  const todayStr = new Date().toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });

  const todayIso = new Date().toISOString().split("T")[0];

  // Tính số ngày công chuẩn trong tháng (số ngày duy nhất có ghi nhận chấm công)
  const totalWorkDays = groupedHistory.length;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      {/* header */}
      <header role="banner" className="border-b border-slate-200 bg-white py-4 px-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xl font-bold tracking-tight">Hệ thống chấm công GPS</p>
          
          <nav aria-label="Menu chính" className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {session.user.name || "Nhân viên WMS"}
            </span>
            
            <form action={logout}>
              <button type="submit" className="text-sm font-medium text-red-600 hover:underline dark:text-red-400 cursor-pointer">
                Đăng xuất
              </button>
            </form>
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 mx-auto max-w-7xl w-full p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <h1 className="sr-only">Bảng điều khiển chấm công cá nhân</h1>

        {/* Khu vực Thao Tác Check-In/Out */}
        <section className="lg:col-span-1 flex flex-col gap-6" aria-labelledby="action-heading">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <header className="mb-4">
              <h2 id="action-heading" className="text-lg font-bold tracking-tight">Trạm Chấm Công Kỹ Thuật Số</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Hôm nay: <time dateTime={todayIso}>{todayStr}</time></p>
            </header>

            {/* component nút bấm ra vào chấm công*/}
            <AttendanceButtons />
          </article>
        </section>

        {/* Thống kê nhanh & Nhật ký lịch sử dữ liệu */}
        <section className="lg:col-span-2 flex flex-col gap-6" aria-labelledby="history-heading">
          {/* Khối thống kê công */}
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <dl className="grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col">
                <dt className="text-xs font-medium text-slate-500 order-2 mt-1 dark:text-slate-400">Công chuẩn</dt>
                <dd className="text-2xl font-bold tracking-tight text-blue-600 order-1 dark:text-blue-400">{totalWorkDays} ngày</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs font-medium text-slate-500 order-2 mt-1 dark:text-slate-400">Đi muộn</dt>
                <dd className="text-2xl font-bold tracking-tight text-amber-600 order-1 dark:text-amber-400">0 lần</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs font-medium text-slate-500 order-2 mt-1 dark:text-slate-400">Nghỉ phép</dt>
                <dd className="text-2xl font-bold tracking-tight text-slate-600 order-1 dark:text-slate-400">0 ngày</dd>
              </div>
            </dl>
          </article>

          {/* bảng lịch sử chấm công phân loại theo tab */}
          <AttendanceHistory history={groupedHistory} />
        </section>
      </main>

      {/* footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <small>&copy; 2026 WMS</small>
      </footer>
    </div>
  );
}