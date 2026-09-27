import type { Metadata } from "next";
import { requireAdminPage } from "@/server/auth/admin-page";
import { AdminShell } from "@/features/admin/layout/admin-shell";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdminPage();
  return <AdminShell user={{ displayName: user.displayName, email: user.email, role: user.role }}>{children}</AdminShell>;
}
