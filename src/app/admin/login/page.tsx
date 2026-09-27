import type { Metadata } from "next";
import { AdminLoginForm } from "@/features/admin/login/admin-login-form";

export const metadata: Metadata = { title: "Admin Login", robots: { index: false, follow: false } };
export default function AdminLoginPage() {
  return <main className="grid min-h-screen place-items-center overflow-hidden bg-[#030405] px-4 py-14"><div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,100,224,.25),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(230,21,37,.16),transparent_27%)]" /><div className="relative"><AdminLoginForm /></div></main>;
}
