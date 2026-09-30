import { DownloadsTable } from "@/features/admin/downloads/downloads-table";
import { AdminIndexResults } from "@/features/admin/shared/admin-index-results";
import { AdminPageHeader } from "@/features/admin/shared/admin-page-header";
import { DownloadIndexControls } from "@/features/admin/shared/admin-resource-controls";
import { DownloadSummary } from "@/features/admin/shared/admin-resource-summaries";
import { toAdminUrlSearchParams } from "@/features/admin/shared/admin-search-params";
import { parseDownloadIndexParams } from "@/server/admin/downloads-index";
import {
  getAdminDownloadSummary,
  listAdminDownloads,
} from "@/server/admin/downloads-service";
import { requireAdminPage } from "@/server/auth/admin-page";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminDownloadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdminPage("download.read");
  const params = toAdminUrlSearchParams(await searchParams);
  const input = parseDownloadIndexParams(params);
  const now = new Date();
  const [result, summary] = await Promise.all([
    listAdminDownloads(input, now),
    getAdminDownloadSummary(now),
  ]);
  const grants = result.items.map((grant) => ({
    id: grant.id,
    email: grant.email,
    downloadCount: grant.downloadCount,
    revokedAt: grant.revokedAt?.toISOString() ?? null,
    expiresAt: grant.expiresAt?.toISOString() ?? null,
    state: grant.revokedAt
      ? ("REVOKED" as const)
      : grant.expiresAt && grant.expiresAt <= now
        ? ("EXPIRED" as const)
        : ("ACTIVE" as const),
    createdAt: grant.createdAt.toISOString(),
    orderItem: {
      productTitle: grant.orderItem.productTitle,
      order: {
        reference: grant.orderItem.order.reference,
        status: grant.orderItem.order.status,
        payments: grant.orderItem.order.payments,
      },
    },
  }));

  return (
    <>
      <AdminPageHeader eyebrow="Fulfillment" title="Download grants" description="Inspect grants across TEST/LIVE payment environments and revoke future download authorization when necessary." />
      <div className="mt-7 space-y-5">
        <DownloadSummary summary={summary} />
        <DownloadIndexControls input={input} />
        <AdminIndexResults basePath="/admin/downloads" queryString={params.toString()} meta={result.meta} activeFilters={result.activeFilters} noun="grants">
          <DownloadsTable grants={grants} />
        </AdminIndexResults>
      </div>
    </>
  );
}
