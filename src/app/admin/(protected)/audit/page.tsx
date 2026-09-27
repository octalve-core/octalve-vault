import { AdminPageHeader } from "@/features/admin/shared/admin-page-header";
import { AuditList } from "@/features/admin/audit/audit-list";
import { requireAdminPage } from "@/server/auth/admin-page";
import { prisma } from "@/lib/prisma";

export default async function AdminAuditPage() { await requireAdminPage("audit.read"); const logs = await prisma.adminAuditLog.findMany({ include: { actor: { select: { displayName: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 300 }); return <><AdminPageHeader eyebrow="Governance" title="Audit logs" description="Trace sensitive catalogue, access and operational changes without logging secrets." /><div className="mt-7"><AuditList logs={logs} /></div></>; }
