"use client";

import React, { useState } from "react";
// Đi lùi ra src/ rồi chui vào features/attendance/actions
import { handleCheckInOrOut } from "../features/attendance/actions";

export function AttendanceButtons() {
  const [loading, setLoading] = useState(false);

  const handleClick = async (type: "VÀO CA" | "RA CA") => {
    setLoading(true);
    const response = await handleCheckInOrOut(type);
    setLoading(false);
    
    alert(response.success ? response.message : response.error);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <button 
        type="button" 
        disabled={loading}
        onClick={() => handleClick("VÀO CA")}
        className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-xs hover:bg-emerald-500 transition-all cursor-pointer disabled:opacity-50"
      >
        {loading ? "Đang xử lý..." : "VÀO CA"}
      </button>
      <button 
        type="button" 
        disabled={loading}
        onClick={() => handleClick("RA CA")}
        className="w-full rounded-xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-300 transition-all dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-50"
      >
        {loading ? "Đang xử lý..." : "RA CA"}
      </button>
    </div>
  );
}