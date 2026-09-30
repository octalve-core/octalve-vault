import { AuditList } from "@/features/admin/audit/audit-list";
import { AdminIndexResults } from "@/features/admin/shared/admin-index-results";
import { AdminPageHeader } from "@/features/admin/shared/admin-page-header";
import { AuditIndexControls } from "@/features/admin/shared/admin-resource-controls";
import { AuditSummary } from "@/features/admin/shared/admin-resource-summaries";
import { toAdminUrlSearchParams } from "@/features/admin/shared/admin-search-params";
import { parseAuditIndexParams } from "@/server/admin/audit-index";
import {
  getAdminAuditSummary,
  listAdminAuditActors,
  listAdminAuditEntityTypes,
  listAdminAuditLogs,
} from "@/server/admin/audit-query-service";
import { requireAdminPage } from "@/server/auth/admin-page";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdminPage("audit.read");
  const params = toAdminUrlSearchParams(await searchParams);
  const input = parseAuditIndexParams(params);
  const [result, summary, actors, entityTypes] = await Promise.all([
    listAdminAuditLogs(input),
    getAdminAuditSummary(),
    listAdminAuditActors(),
    listAdminAuditEntityTypes(),
  ]);

  return (
    <>
      <AdminPageHeader eyebrow="Governance" title="Audit logs" description="Trace sensitive catalogue, access and operational changes without logging secrets." />
      <div className="mt-7 space-y-5">
        <AuditSummary summary={summary} />
        <AuditIndexControls input={input} actors={actors} entityTypes={entityTypes} />
        <AdminIndexResults basePath="/admin/audit" queryString={params.toString()} meta={result.meta} activeFilters={result.activeFilters} noun="events">
          <AuditList logs={result.items} />
        </AdminIndexResults>
      </div>
    </>
  );
}
