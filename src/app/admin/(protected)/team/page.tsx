import { AdminPageHeader } from "@/features/admin/shared/admin-page-header";
import { TeamManager } from "@/features/admin/team/team-manager";
import { requireAdminPage } from "@/server/auth/admin-page";
import { hasPermission } from "@/domain/permissions";
import { prisma } from "@/lib/prisma";

export default async function AdminTeamPage() { const { user } = await requireAdminPage("admin.read"); const users = await prisma.adminUser.findMany({ select: { id: true, email: true, displayName: true, role: true, active: true, lastLoginAt: true }, orderBy: { createdAt: "asc" } }); const serialized = users.map((item) => ({ ...item, lastLoginAt: item.lastLoginAt?.toISOString() ?? null })); return <><AdminPageHeader eyebrow="Access control" title="Team" description="Role-based administration with revocable server-side sessions." /><div className="mt-7"><TeamManager users={serialized} canWrite={hasPermission(user.role, "admin.write")} /></div></>; }
