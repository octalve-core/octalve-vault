"use client";
import { AdminNotificationProvider } from "@/features/admin/shared/admin-notification-provider";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BadgePercent, BarChart3, Boxes, ClipboardList, CreditCard, Download, FileClock, LogOut, Menu, Settings, ShieldAlert, ShieldCheck, Users, WalletCards, X } from "lucide-react";
import { useState } from "react";
import type { AdminRole } from "@/domain/constants";
import { hasPermission, type Permission } from "@/domain/permissions";

const nav: Array<{ href: string; label: string; icon: typeof BarChart3; permission: Permission }> = [
  { href: "/admin", label: "Overview", icon: BarChart3, permission: "dashboard.read" },
  { href: "/admin/products", label: "Products", icon: Boxes, permission: "product.read" },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList, permission: "order.read" },
  { href: "/admin/payments", label: "Payments", icon: CreditCard, permission: "payment.read" },
  { href: "/admin/customers", label: "Customers", icon: Users, permission: "customer.read" },
  { href: "/admin/downloads", label: "Downloads", icon: Download, permission: "download.read" },
  { href: "/admin/marketing", label: "Marketing", icon: BadgePercent, permission: "marketing.read" },
  { href: "/admin/team", label: "Team", icon: ShieldCheck, permission: "admin.read" },
  { href: "/admin/audit", label: "Audit Logs", icon: FileClock, permission: "audit.read" },
  { href: "/admin/security", label: "Security", icon: ShieldAlert, permission: "security.read" },
  { href: "/admin/settings", label: "Settings", icon: Settings, permission: "settings.read" },
];

export function AdminShell({ user, children }: { user: { displayName: string; email: string; role: AdminRole }; children: React.ReactNode }) {
  const pathname = usePathname(); const router = useRouter(); const [open, setOpen] = useState(false);
  const items = nav.filter((item) => hasPermission(user.role, item.permission));
  async function logout() { await fetch("/api/admin/auth/logout", { method: "POST" }); router.replace("/admin/login"); router.refresh(); }
  const sidebar = <><div className="flex h-20 items-center gap-3 border-b border-white/8 px-5"><Image src="/brand/vault-logo.png" alt="Octalve Vault" width={42} height={42} className="h-10 w-10 object-contain" /><div><p className="text-sm font-medium text-white">Octalve Vault</p><p className="text-[10px] uppercase tracking-[.14em] text-white">Administration</p></div></div><nav className="grid gap-1 p-3">{items.map(({ href, label, icon: Icon }) => { const active = href === "/admin" ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${active ? "bg-white text-slate-950" : "text-white hover:bg-white/[.06] hover:text-white"}`}><Icon className="h-4 w-4" />{label}</Link>; })}</nav><div className="mt-auto border-t border-white/8 p-4">
      <AdminNotificationProvider /><div className="rounded-2xl bg-white/[.055] p-3"><p className="truncate text-sm font-medium text-white">{user.displayName}</p><p className="mt-0.5 truncate text-xs text-white">{user.email}</p><p className="mt-2 text-[10px] font-medium uppercase tracking-[.12em] text-white">{user.role.replaceAll("_", " ")}</p></div><button type="button" onClick={logout} className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-white hover:bg-white/[.05] hover:text-white"><LogOut className="h-4 w-4" />Logout</button></div></>;
  return <div className="min-h-screen bg-[#f5f7fa]"><aside className="fixed inset-y-0 start-0 z-40 hidden w-64 flex-col bg-[#07090c] lg:flex">{sidebar}</aside>{open ? <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Close menu" className="absolute inset-0 bg-black/55" onClick={() => setOpen(false)} /><aside className="relative flex h-full w-[280px] flex-col bg-[#07090c]">{sidebar}</aside></div> : null}<div className="lg:ps-64"><header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-7"><button type="button" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 lg:hidden" aria-label="Open menu">{open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</button><div className="hidden items-center gap-2 text-xs font-medium uppercase tracking-[.14em] text-slate-400 lg:flex"><WalletCards className="h-4 w-4" />Vault Operations</div><div className="text-end"><p className="text-sm font-medium text-slate-950">{user.displayName}</p><p className="text-[10px] uppercase tracking-[.12em] text-slate-400">{user.role.replaceAll("_", " ")}</p></div></header><main className="p-4 sm:p-7 lg:p-9">{children}</main></div></div>;
}
