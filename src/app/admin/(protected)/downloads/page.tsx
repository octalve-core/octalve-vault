import { AdminPageHeader } from "@/features/admin/shared/admin-page-header";
import { DownloadsTable } from "@/features/admin/downloads/downloads-table";
import { requireAdminPage } from "@/server/auth/admin-page";
import { listAdminDownloads } from "@/server/admin/operations-service";

export default async function AdminDownloadsPage() { await requireAdminPage("download.read"); const grants = await listAdminDownloads(); const serialized = grants.map((grant) => ({ id: grant.id, email: grant.email, downloadCount: grant.downloadCount, revokedAt: grant.revokedAt?.toISOString() ?? null, expiresAt: grant.expiresAt?.toISOString() ?? null, createdAt: grant.createdAt.toISOString(), orderItem: { productTitle: grant.orderItem.productTitle, order: { reference: grant.orderItem.order.reference, status: grant.orderItem.order.status } } })); return <><AdminPageHeader eyebrow="Fulfillment" title="Download grants" description="Inspect active entitlements and revoke future download authorization when necessary." /><div className="mt-7"><DownloadsTable grants={serialized} /></div></>; }
