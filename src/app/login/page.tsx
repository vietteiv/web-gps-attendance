import React from "react";
import { loginWithGoogle } from "@/features/auth/actions";

export const metadata = {
  title: "Đăng nhập | Hệ thống chấm công GPS WMS",
  description: "Xác thực tài khoản Google để vào hệ thống chấm công GPS và Selfie của WMS.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <header className="border-b border-slate-200 bg-white py-4 px-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <p className="text-xl font-bold tracking-tight">Hệ thống chấm công GPS</p>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-4">
        <article className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <header className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Chào mừng quay trở lại</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Sử dụng tài khoản Gmail nội bộ để tiếp tục</p>
          </header>

          {/* Thay đổi action gọi Server Action đăng nhập */}
          <form action={loginWithGoogle} className="space-y-4">
            <fieldset className="border-0 p-0 m-0 space-y-4">
              <legend className="sr-only">Xác thực tài khoản</legend>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-3 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 cursor-pointer"
              >
                <span>Đăng nhập bằng Google</span>
              </button>
            </fieldset>
          </form>

          <footer className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
            <p>Yêu cầu bật quyền định vị (GPS) và Camera khi được nhắc để thực hiện chấm công.</p>
          </footer>
        </article>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <small>&copy; 2026 WMS</small>
      </footer>
    </div>
  );
}