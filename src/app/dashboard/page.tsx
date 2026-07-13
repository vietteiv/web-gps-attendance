import React from "react";

export const metadata = {
  title: "Bảng điều khiển | Hệ thống chấm công GPS WMS",
  description: "Trang tổng quan chấm công hàng ngày, theo dõi vị trí GPS và thực hiện chụp ảnh selfie kiểm thử.",
};

const mockHistory = [
  { id: 1, date: "2026-07-13", checkIn: "08:02 AM", checkOut: "17:30 PM", status: "Hợp lệ", location: "Văn phòng Quận 1" },
  { id: 2, date: "2026-07-10", checkIn: "07:55 AM", checkOut: "17:05 PM", status: "Hợp lệ", location: "Văn phòng Quận 1" },
];

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <header className="border-b border-slate-200 bg-white py-4 px-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xl font-bold tracking-tight">Hệ thống chấm công GPS</p>
          <nav aria-label="Menu chính" className="flex items-center gap-4">
            <span className="text-sm text-slate-500 dark:text-slate-400">Nguyễn Văn A</span>
            <button type="button" className="text-sm font-medium text-red-600 hover:underline dark:text-red-400">Đăng xuất</button>
          </nav>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-7xl w-full p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <h1 className="sr-only">Bảng điều khiển chấm công cá nhân</h1>

        {/* Khu vực Thao Tác Check-In/Out */}
        <section className="lg:col-span-1 flex flex-col gap-6" aria-labelledby="action-heading">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <header className="mb-4">
              <h2 id="action-heading" className="text-lg font-bold tracking-tight">Trạm Chấm Công Kỹ Thuật Số</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Hôm nay: <time dateTime="2026-07-13">Thứ Hai, 13/07/2026</time></p>
            </header>

            <figure className="mb-6 overflow-hidden rounded-xl bg-slate-100 border border-dashed border-slate-300 aspect-video flex flex-col items-center justify-center text-center p-4 dark:bg-slate-800 dark:border-slate-700">
              <figcaption className="text-xs text-slate-500 dark:text-slate-400 font-medium">Camera sẵn sàng (Selfie tự động)</figcaption>
            </figure>

            <aside className="mb-6 rounded-lg bg-blue-50 p-3 text-xs text-blue-800 dark:bg-blue-950/40 dark:text-blue-300" aria-label="Thông tin định vị">
              <p className="font-semibold">Tọa độ GPS Hiện Tại:</p>
              <p className="mt-1 font-mono">10.7626° N, 106.6602° E</p>
            </aside>

            <div className="grid grid-cols-2 gap-4">
              <button type="button" className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-xs hover:bg-emerald-500 transition-all">VÀO CA</button>
              <button type="button" className="w-full rounded-xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-300 transition-all dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">RA CA</button>
            </div>
          </article>
        </section>

        {/* Thống kê nhanh & Nhật ký lịch sử dữ liệu */}
        <section className="lg:col-span-2 flex flex-col gap-6" aria-labelledby="history-heading">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <dl className="grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col">
                <dt className="text-xs font-medium text-slate-500 order-2 mt-1 dark:text-slate-400">Công chuẩn</dt>
                <dd className="text-2xl font-bold tracking-tight text-blue-600 order-1 dark:text-blue-400">22 ngày</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs font-medium text-slate-500 order-2 mt-1 dark:text-slate-400">Đi muộn</dt>
                <dd className="text-2xl font-bold tracking-tight text-amber-600 order-1 dark:text-amber-400">1 lần</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs font-medium text-slate-500 order-2 mt-1 dark:text-slate-400">Nghỉ phép</dt>
                <dd className="text-2xl font-bold tracking-tight text-slate-600 order-1 dark:text-slate-400">0 ngày</dd>
              </div>
            </dl>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex-1">
            <header className="mb-4">
              <h2 id="history-heading" className="text-lg font-bold tracking-tight">Lịch sử chấm công gần đây</h2>
            </header>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <th scope="col" className="pb-3 font-semibold">Ngày</th>
                    <th scope="col" className="pb-3 font-semibold">Giờ Vào</th>
                    <th scope="col" className="pb-3 font-semibold">Giờ Ra</th>
                    <th scope="col" className="pb-3 font-semibold text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {mockHistory.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 font-medium">
                        <time dateTime={row.date}>{row.date}</time>
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-400">{row.checkIn}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-400">{row.checkOut}</td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-400">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <small>&copy; 2026 WMS</small>
      </footer>
    </div>
  );
}