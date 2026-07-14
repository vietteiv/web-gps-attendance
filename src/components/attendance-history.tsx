"use client";

import React, { useState } from "react";

interface AttendanceLog {
  id: string;
  type: "VÀO CA" | "RA CA";
  time: string;
  photoUrl: string;
}

interface GroupedAttendance {
  date: string;
  dateObj: Date;
  logs: AttendanceLog[];
  status: string;
}

interface Props {
  history: GroupedAttendance[];
}

export function AttendanceHistory({ history }: Props) {
  const [filter, setFilter] = useState<"all" | "today" | "week">("all");

  const isThisWeek = (date: Date) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); 
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const checkDate = new Date(date);
    return checkDate >= startOfWeek && checkDate <= endOfWeek;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    const checkDate = new Date(date);
    return (
      today.getDate() === checkDate.getDate() &&
      today.getMonth() === checkDate.getMonth() &&
      today.getFullYear() === checkDate.getFullYear()
    );
  };

  const filteredHistory = history.filter((item) => {
    const itemDate = new Date(item.dateObj);
    if (filter === "today") return isToday(itemDate);
    if (filter === "week") return isThisWeek(itemDate);
    return true;
  });

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex-1 flex flex-col">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-lg font-bold tracking-tight">Lịch sử chấm công gần đây</h2>
        
        <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800 text-xs self-start">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-md px-3 py-1.5 font-medium transition-all cursor-pointer ${
              filter === "all" ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilter("week")}
            className={`rounded-md px-3 py-1.5 font-medium transition-all cursor-pointer ${
              filter === "week" ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            Tuần này
          </button>
          <button
            onClick={() => setFilter("today")}
            className={`rounded-md px-3 py-1.5 font-medium transition-all cursor-pointer ${
              filter === "today" ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            Hôm nay
          </button>
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <th scope="col" className="pb-3 font-semibold w-1/4">Ngày</th>
              <th scope="col" className="pb-3 font-semibold w-1/5">Loại hình</th>
              <th scope="col" className="pb-3 font-semibold w-1/5">Thời gian</th>
              <th scope="col" className="pb-3 font-semibold w-1/5">Ảnh Selfie</th>
              <th scope="col" className="pb-3 font-semibold text-right w-1/5">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  Không tìm thấy dữ liệu chấm công phù hợp.
                </td>
              </tr>
            ) : (
              filteredHistory.map((group) => (
                <React.Fragment key={group.date}>
                  {group.logs.map((log, index) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      {/* Chỉ hiển thị ngày ở dòng đầu tiên của nhóm ngày đó cho thoáng giao diện */}
                      <td className="py-3 font-medium text-slate-900 dark:text-slate-100">
                        {index === 0 ? group.date : ""}
                      </td>
                      
                      {/* Cột Loại hình quét */}
                      <td className="py-3">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                          log.type === "VÀO CA"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                        }`}>
                          {log.type}
                        </span>
                      </td>

                      {/* Cột thời gian đi theo hàng chuẩn chỉ */}
                      <td className={`py-3 font-mono font-medium ${
                        log.type === "VÀO CA" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}>
                        {log.time}
                      </td>

                      {/* Cột Ảnh đi liền theo đúng hàng dữ liệu quét */}
                      <td className="py-3">
                        {log.photoUrl.startsWith("http") ? (
                          <a 
                            href={log.photoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs text-blue-600 hover:underline dark:text-blue-400 font-medium"
                          >
                            Xem ảnh ↗
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            {log.photoUrl.includes("giả lập") ? "Ảnh PC" : "Không ảnh"}
                          </span>
                        )}
                      </td>

                      {/* Cột trạng thái tổng của ngày */}
                      <td className="py-3 text-right">
                        {index === 0 ? (
                          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-400">
                            {group.status}
                          </span>
                        ) : ""}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}