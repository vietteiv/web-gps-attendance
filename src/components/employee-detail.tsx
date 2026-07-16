"use client";

import React, { useState, useMemo } from "react";

interface AttendanceLog {
  id: string;
  type: "VÀO CA" | "RA CA";
  time: string;
  photoUrl: string;
}

interface GroupedAttendance {
  date: string; // Định dạng "DD/MM/YYYY" hoặc "D/M/YYYY"
  dateObj: Date;
  logs: AttendanceLog[];
  status: string;
}

interface Props {
  history: GroupedAttendance[];
}

export function EmployeeDetailView({ history }: Props) {
  const currentYear = new Date().getFullYear();
  
  // State quản lý bộ lọc của sếp
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(0); // 0: Xem cả năm

  // HÀM TÍNH HỆ SỐ CÔNG DỰA TRÊN THỨ TRONG TUẦN
  const calculateWorkValue = (dateObj: Date): number => {
    const dayOfWeek = dateObj.getDay(); // 0: Chủ Nhật, 6: Thứ Bảy, 1-5: Thứ 2 - Thứ 6
    if (dayOfWeek === 0) return 0;      // Chủ Nhật không tính công thường (hoặc tính tăng ca nếu muốn)
    if (dayOfWeek === 6) return 0.5;    // Thứ 7 làm nửa ngày tính 0.5 công
    return 1.0;                         // Ngày thường tính 1.0 công
  };

  // 1. PHÂN TÍCH TỔNG HỢP CẢ NĂM (Tính tổng số công tích lũy từng tháng)
  const monthlyStats = useMemo(() => {
    const stats: { [month: number]: { totalDays: number; totalCông: number; lateCount: number } } = {};
    
    for (let i = 1; i <= 12; i++) {
      stats[i] = { totalDays: 0, totalCông: 0, lateCount: 0 };
    }

    // Tạo Set để tránh cộng trùng lặp công nếu trong ngày có nhiều dòng chấm công
    const processedDates = new Set<string>();

    history.forEach((group) => {
      const year = group.dateObj.getFullYear();
      if (year !== selectedYear) return;

      const month = group.dateObj.getMonth() + 1;
      const dateKey = `${group.date}-${month}-${year}`;

      if (!processedDates.has(dateKey)) {
        processedDates.add(dateKey);
        stats[month].totalDays++;
        // Cộng dồn hệ số công thực tế (Thứ 7 cộng 0.5, ngày thường cộng 1.0)
        stats[month].totalCông += calculateWorkValue(group.dateObj);
      }

      // Đếm số lần đi trễ
      group.logs.forEach((log) => {
        const rowStr = Object.values(log).join(" ").toLowerCase();
        if (log.type === "VÀO CA" && (rowStr.includes("late") || rowStr.includes("(late)"))) {
          stats[month].lateCount++;
        }
      });
    });

    return stats;
  }, [history, selectedYear]);

 // 2. PHÂN TÍCH CHI TIẾT TỪNG NGÀY TRONG THÁNG (ĐÃ SỬA LOGIC TƯƠNG LAI)
  const dailyLogsForSelectedMonth = useMemo(() => {
    if (selectedMonth === 0) return [];

    // Lấy ngày hôm nay thực tế để làm mốc so sánh (Set về 00:00:00 để so sánh chuẩn ngày)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const daysList = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${day}/${selectedMonth}/${selectedYear}`;
      const currentDateObj = new Date(selectedYear, selectedMonth - 1, day);
      currentDateObj.setHours(0, 0, 0, 0);

      const dayOfWeekNum = currentDateObj.getDay();
      const dayOfWeekStr = currentDateObj.toLocaleDateString("vi-VN", { weekday: "long" });

      // KIỂM TRA XEM CÓ PHẢI LÀ NGÀY TRONG TƯƠNG LAI KHÔNG
      const isFutureDay = currentDateObj.getTime() > today.getTime();

      // Tìm dữ liệu chấm công thực tế của ngày này trong Sheet
      const record = history.find((h) => {
        const d = h.dateObj.getDate();
        const m = h.dateObj.getMonth() + 1;
        const y = h.dateObj.getFullYear();
        return d === day && m === selectedMonth && y === selectedYear;
      });

      if (record) {
        // CÓ ĐI LÀM
        let isLate = false;
        record.logs.forEach((log) => {
          const logStr = Object.values(log).join(" ").toLowerCase();
          if (log.type === "VÀO CA" && (logStr.includes("late") || logStr.includes("(late)"))) {
            isLate = true;
          }
        });

        const côngĐạtĐược = calculateWorkValue(currentDateObj);

        daysList.push({
          dateStr,
          dayOfWeek: dayOfWeekStr,
          status: dayOfWeekNum === 6 
            ? `Làm Thứ 7 (+${côngĐạtĐược} công)` 
            : (isLate ? `Trễ ca (+${côngĐạtĐược} công)` : `Đủ công (+${côngĐạtĐược} công)`),
          details: record.logs,
          bgClass: dayOfWeekNum === 6
            ? "bg-sky-50 dark:bg-sky-950/30 text-sky-800 dark:text-sky-300 ring-1 ring-sky-600/20"
            : (isLate 
                ? "bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 ring-1 ring-amber-600/20" 
                : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-600/20"),
        });
      } else {
        // KHÔNG CÓ DỮ LIỆU CHẤM CÔNG
        let status = "";
        let bgClass = "";

        if (isFutureDay) {
          // 🚀 Nếu là ngày ở tương lai: Ghi nhận là Chưa đến ngày
          status = "Chưa đến ngày";
          bgClass = "bg-slate-100/60 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 ring-1 ring-slate-200/50 dark:ring-slate-800/30";
        } else {
          // Nếu là ngày trong quá khứ hoặc hôm nay nhưng không chấm công -> Tính là vắng thực sự
          if (dayOfWeekNum === 0) {
            status = "Nghỉ Chủ Nhật";
            bgClass = "bg-slate-100 dark:bg-slate-800 text-slate-500";
          } else if (dayOfWeekNum === 6) {
            status = "Vắng Thứ 7 (Nghỉ nửa ngày)";
            bgClass = "bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 ring-1 ring-rose-600/20";
          } else {
            status = "Vắng mặt (Nghỉ làm)";
            bgClass = "bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 ring-1 ring-rose-600/20";
          }
        }

        daysList.push({
          dateStr,
          dayOfWeek: dayOfWeekStr,
          status,
          details: [],
          bgClass,
        });
      }
    }

    return daysList.reverse(); // Ngày mới nhất xếp lên đầu
  }, [history, selectedYear, selectedMonth]);
  return (
    <div className="flex flex-col gap-6">
      {/* KHU VỰC BỘ LỌC */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500">Chọn Năm báo cáo</label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                setSelectedMonth(0);
              }}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold dark:border-slate-800 dark:bg-slate-950 cursor-pointer"
            >
              <option value={2026}>Năm 2026</option>
              <option value={2025}>Năm 2025</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500">Chọn Tháng báo cáo</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold dark:border-slate-800 dark:bg-slate-950 cursor-pointer"
            >
              <option value={0}>Xem tổng hợp cả năm (12 Tháng)</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-mono self-end">
          Đang xem: {selectedMonth === 0 ? `Cả năm ${selectedYear}` : `Tháng ${selectedMonth}/${selectedYear}`}
        </div>
      </section>

      {/* CHẾ ĐỘ 1: XEM TỔNG HỢP CẢ NĂM (12 THÁNG) */}
      {selectedMonth === 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold tracking-tight mb-4">Bảng tổng hợp công xá (Năm {selectedYear})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th scope="col" className="pb-3 font-semibold">Tháng làm việc</th>
                  <th scope="col" className="pb-3 font-semibold text-center">Số ngày đi làm</th>
                  <th scope="col" className="pb-3 font-semibold text-center">Tổng số công đạt</th>
                  <th scope="col" className="pb-3 font-semibold text-center">Số lần đi trễ</th>
                  <th scope="col" className="pb-3 font-semibold text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {Object.keys(monthlyStats).map((mStr) => {
                  const m = Number(mStr);
                  const days = monthlyStats[m].totalDays;
                  const công = monthlyStats[m].totalCông;
                  const lates = monthlyStats[m].lateCount;

                  return (
                    <tr key={m} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-4 font-bold text-slate-800 dark:text-slate-200">Tháng {m}</td>
                      <td className="py-4 text-center font-medium text-slate-600 dark:text-slate-400">{days} ngày</td>
                      
                      {/* Cột Tổng số công hiển thị số thập phân động (Ví dụ: 21.5 công) */}
                      <td className="py-4 text-center text-blue-600 font-bold text-base">
                        {công % 1 === 0 ? công : công.toFixed(1)} công
                      </td>
                      
                      <td className="py-4 text-center">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                          lates > 0 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"
                        }`}>
                          {lates} lần trễ
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => setSelectedMonth(m)}
                          className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                        >
                          Chi tiết ngày tháng {m} ➔
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* CHẾ ĐỘ 2: XEM CHI TIẾT TỪNG NGÀY TRONG THÁNG */}
      {selectedMonth > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold tracking-tight">Chi tiết lịch làm việc Tháng {selectedMonth}/{selectedYear}</h2>
            <button
              onClick={() => setSelectedMonth(0)}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white underline cursor-pointer"
            >
              Quay lại xem cả năm
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th scope="col" className="pb-3 font-semibold">Ngày</th>
                  <th scope="col" className="pb-3 font-semibold">Thứ</th>
                  <th scope="col" className="pb-3 font-semibold">Trạng thái & Hệ số công</th>
                  <th scope="col" className="pb-3 font-semibold">Lịch sử quét chi tiết (Giờ và Ảnh)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {dailyLogsForSelectedMonth.map((day) => (
                  <tr key={day.dateStr} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-4 font-mono font-bold text-slate-900 dark:text-slate-100">{day.dateStr}</td>
                    <td className="py-4 text-slate-500">{day.dayOfWeek}</td>
                    <td className="py-4">
                      <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${day.bgClass}`}>
                        {day.status}
                      </span>
                    </td>
                    <td className="py-4">
                      {day.details.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {day.details.map((log: AttendanceLog) => (
                            <div key={log.id} className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                              <span className={`font-semibold ${log.type === "VÀO CA" ? "text-emerald-600" : "text-rose-600"}`}>
                                {log.type} lúc {log.time}
                              </span>
                              {log.photoUrl.startsWith("http") && (
                                <a
                                  href={log.photoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline"
                                >
                                  [Xem Ảnh selfie ↗]
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Không có dữ liệu</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}