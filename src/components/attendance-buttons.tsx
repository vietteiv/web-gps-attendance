"use client";

import React, { useState } from "react";
import { handleCheckInOrOut } from "../features/attendance/actions";

export function AttendanceButtons() {
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);

  const getGeoLocation = (): Promise<{ latitude: string; longitude: string }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error("Trình duyệt của bạn không hỗ trợ định vị GPS."));
      }

      // Cấu hình ép thiết bị bật chip GPS để lấy tọa độ có độ chính xác cao nhất
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,         // Chờ tối đa 10 giây
        maximumAge: 0,          // Không dùng lại tọa độ cũ trong bộ nhớ đệm
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Bốc tọa độ thật, ép sang chuỗi và đổi dấu chấm thành dấu phẩy để Google Sheets vùng VN tự căn Right
          const lat = position.coords.latitude.toString().replace(".", ",");
          const lng = position.coords.longitude.toString().replace(".", ",");
          resolve({ latitude: lat, longitude: lng });
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error("Bạn đã từ chối cấp quyền truy cập GPS. Vui lòng bật lại trong cài đặt trình duyệt!"));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error("Không thể xác định được vị trí. Hãy kiểm tra kết nối mạng hoặc GPS của thiết bị."));
              break;
            case error.TIMEOUT:
              reject(new Error("Quá thời gian lấy vị trí GPS. Vui lòng thử bấm lại!"));
              break;
            default:
              reject(new Error("Có lỗi xảy ra khi lấy tọa độ GPS."));
          }
        },
        options
      );
    });
  };

  const handleClick = async (type: "VÀO CA" | "RA CA") => {
    setLoading(true);
    setStatusText("Đang xác thực tọa độ GPS...");

    try {
      // 1. Kích hoạt bốc tọa độ thực tế từ thiết bị
      const location = await getGeoLocation();
      
      setStatusText(`Đang ghi nhận nhật ký ${type.toLowerCase()}...`);

      // 2. Bắn tọa độ thật xuống Server Action
      const response = await handleCheckInOrOut(type, location.latitude, location.longitude);
      
      setStatusText(null);
      setLoading(false);
      alert(response.success ? response.message : response.error);
    } catch (error) {
      setStatusText(null);
      setLoading(false);
      
      // Kiểm tra nếu error đúng là một Object thuộc class Error
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Có lỗi xảy ra khi xác định vị trí.");
      }
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {statusText && (
        <p className="text-center text-xs font-medium text-amber-600 animate-pulse dark:text-amber-400">
          {statusText}
        </p>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <button 
          type="button" 
          disabled={loading}
          onClick={() => handleClick("VÀO CA")}
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-xs hover:bg-emerald-500 transition-all cursor-pointer disabled:opacity-50"
        >
          {loading && statusText?.includes("VÀO CA") ? "Đang xử lý..." : "VÀO CA"}
        </button>
        <button 
          type="button" 
          disabled={loading}
          onClick={() => handleClick("RA CA")}
          className="w-full rounded-xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-300 transition-all dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-50"
        >
          {loading && statusText?.includes("RA CA") ? "Đang xử lý..." : "RA CA"}
        </button>
      </div>
    </div>
  );
}

