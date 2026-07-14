"use client";

import React, { useState, useEffect, useRef } from "react";
import { handleCheckInOrOut } from "../features/attendance/actions";

export function AttendanceButtons() {
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Tự động kích hoạt mở Camera khi nhân viên vào trang Dashboard
  useEffect(() => {
    async function startCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Trình duyệt không hỗ trợ truy cập Camera.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" }, // Ưu tiên camera trước (Selfie) nếu dùng điện thoại
          audio: false,                  // Không cần thu âm thanh
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
} catch (error) {
        console.error("Lỗi mở camera:", error);
        setCameraError("Không tìm thấy Webcam hoặc chưa cấp quyền Camera. (Chế độ giả lập ảnh bật)");
      }
    }

    startCamera();

    // Cleanup: Tắt camera khi chuyển trang hoặc tắt component để tiết kiệm pin/RAM
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Hàm xử lý chụp ảnh từ luồng Video và chuyển sang Base64
  const capturePhotoBase64 = (): string => {
    // Trường hợp máy không có camera, trả về chuỗi ảnh giả lập để không bị crash luồng test
    if (cameraError || !videoRef.current) {
      return "DATA_IMAGE_MOCK_BASE64_DESKTOP_NO_CAMERA";
    }

    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Vẽ hình ảnh hiện tại của video lên canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Xuất ra chuỗi Base64 chất lượng 0.7 để tối ưu dung lượng
        return canvas.toDataURL("image/jpeg", 0.7);
      }
      return "CANVAS_CONTEXT_ERROR";
    } catch  {
      return "CAPTURE_EXCEPTION_ERROR";
    }
  };

  // Hàm lấy vị trí GPS thực tế
  const getGeoLocation = (): Promise<{ latitude: string; longitude: string }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error("Trình duyệt của bạn không hỗ trợ định vị GPS."));
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toString().replace(".", ",");
          const lng = position.coords.longitude.toString().replace(".", ",");
          resolve({ latitude: lat, longitude: lng });
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error("Bạn đã từ chối cấp quyền truy cập GPS. Vui lòng bật lại trong cài đặt!"));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error("Không thể xác định được vị trí GPS."));
              break;
            case error.TIMEOUT:
              reject(new Error("Quá thời gian lấy vị trí GPS."));
              break;
            default:
              reject(new Error("Lỗi định vị GPS."));
          }
        },
        options
      );
    });
  };

  const handleClick = async (type: "VÀO CA" | "RA CA") => {
    setLoading(true);
    setStatusText("Đang kiểm tra tọa độ GPS...");

    try {
      // Bốc vị trí thật
      const location = await getGeoLocation();
      
      setStatusText("Đang quét khuôn mặt và chụp ảnh selfie...");
      // Bốc ảnh Base64 thật (hoặc ảnh giả lập nếu máy không có camera)
      const photoBase64 = capturePhotoBase64();

      setStatusText(`Đang ghi nhận nhật ký ${type.toLowerCase()}...`);

      // Bắn toàn bộ data lên Server Action
      const response = await handleCheckInOrOut(
        type, 
        location.latitude, 
        location.longitude,
        photoBase64
      );
      
      setStatusText(null);
      setLoading(false);
      alert(response.success ? response.message : response.error);
    } catch (error) {
      setStatusText(null);
      setLoading(false);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Có lỗi xảy ra.");
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
      {/* KHUNG HIỂN THỊ CAMERA VIEW */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner flex items-center justify-center">
        {cameraError ? (
          <div className="p-4 text-center text-xs text-rose-500 font-medium px-6">
            {cameraError}
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover scale-x-[-1]" // Lật gương video nhìn cho tự nhiên
          />
        )}
        
        {/* Điểm ngắm nhận diện khuôn mặt giả lập cho đẹp giao diện */}
        {!cameraError && (
          <div className="absolute inset-0 border-2 border-dashed border-emerald-500/30 rounded-2xl m-8 pointer-events-none animate-pulse" />
        )}
      </div>

      {/* HIỂN THỊ TRẠNG THÁI TIẾN TRÌNH */}
      {statusText && (
        <p className="text-center text-xs font-medium text-amber-600 animate-pulse dark:text-amber-400">
          {statusText}
        </p>
      )}
      
      {/* HỆ THỐNG NÚT BẤM */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          type="button" 
          disabled={loading}
          onClick={() => handleClick("VÀO CA")}
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-emerald-500 transition-all cursor-pointer disabled:opacity-50"
        >
          {loading && statusText?.includes("VÀO CA") ? "Đang xử lý..." : "VÀO CA"}
        </button>
        <button 
          type="button" 
          disabled={loading}
          onClick={() => handleClick("RA CA")}
          className="w-full rounded-xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 shadow-md hover:bg-slate-300 transition-all dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-50"
        >
          {loading && statusText?.includes("RA CA") ? "Đang xử lý..." : "RA CA"}
        </button>
      </div>
    </div>
  );
}