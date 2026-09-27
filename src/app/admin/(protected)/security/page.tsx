import { AdminPageHeader } from "@/features/admin/shared/admin-page-header";
import { SecurityEvents } from "@/features/admin/security/security-events";
import { requireAdminPage } from "@/server/auth/admin-page";
import { prisma } from "@/lib/prisma";

export default async function AdminSecurityPage() { await requireAdminPage("security.read"); const events = await prisma.securityEvent.findMany({ orderBy: { createdAt: "desc" }, take: 300 }); return <><AdminPageHeader eyebrow="Security" title="Security events" description="Operational security signals are separated from business audit history and never display stored secrets." /><div className="mt-7"><SecurityEvents events={events} /></div></>; }
