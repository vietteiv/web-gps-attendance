import { redirect } from "next/navigation";

export default function RootPage() {
  // Tự động đá người dùng sang trang login
  redirect("/login");
}