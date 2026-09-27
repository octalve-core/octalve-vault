import { MetricsGrid } from "@/features/admin/dashboard/sections/metrics-grid";
import { RecentOrders } from "@/features/admin/dashboard/sections/recent-orders";
import { requireAdminPage } from "@/server/auth/admin-page";
import { getDashboardData } from "@/server/admin/operations-service";

export default async function AdminDashboardPage() {
  await requireAdminPage("dashboard.read"); const data = await getDashboardData();
  return <><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0064E0]">Overview</p><h1 className="mt-2 text-3xl font-black tracking-[-0.045em] text-slate-950">Vault operations</h1><p className="mt-2 text-sm text-slate-500">Products, paid orders, customer entitlements and secure delivery at a glance.</p></div><div className="mt-7"><MetricsGrid data={data} /></div><RecentOrders orders={data.recentOrders} /></>;
}
