import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { getAttendanceHistory } from "@/lib/google-sheets";
import { EmployeeDetailView } from "@/components/employee-detail"; 
import Link from "next/link";

interface Props {
  params: Promise<{ email: string }>;
}

export default async function EmployeeDetailPage({ params }: Props) {
  const session = await auth();

  if (!session?.user || !session.user.email) {
    redirect("/login");
  }

  if (!isAdmin(session.user.email)) {
    redirect("/dashboard");
  }

  const { email } = await params;
  const decodedEmail = decodeURIComponent(email);

  const employeeHistory = await getAttendanceHistory(decodedEmail);

  return (
    <div className="min-h-screen bg-slate-50 p-6 dark:bg-slate-950 dark:text-white">
      <header className="mb-6">
        {/* 🚀 ĐÃ SỬA ĐƯỜNG DẪN QUAY LẠI: Trở về /dashboard/report */}
        <Link href="/dashboard/report" className="text-sm text-blue-600 hover:underline dark:text-blue-400 block mb-2">
          ← Quay lại Báo cáo tổng hợp
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Chi tiết bảng chấm công & Đi trễ</h1>
        <p className="text-sm text-slate-500">
          Nhân viên đang xem: <span className="font-bold text-slate-800 dark:text-slate-100">{decodedEmail}</span>
        </p>
      </header>

      <main>
        <EmployeeDetailView history={employeeHistory} />
      </main>
    </div>
  );
}