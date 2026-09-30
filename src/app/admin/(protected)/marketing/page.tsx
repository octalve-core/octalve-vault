import { hasPermission } from "@/domain/permissions";
import { MarketingManager } from "@/features/admin/marketing/marketing-manager";
import { AdminIndexResults } from "@/features/admin/shared/admin-index-results";
import { AdminPageHeader } from "@/features/admin/shared/admin-page-header";
import { MarketingIndexControls } from "@/features/admin/shared/admin-resource-controls";
import { MarketingSummary } from "@/features/admin/shared/admin-resource-summaries";
import { toAdminUrlSearchParams } from "@/features/admin/shared/admin-search-params";
import { parseMarketingIndexParams } from "@/server/admin/marketing-index";
import {
  getAdminMarketingSummary,
  listAdminMarketing,
} from "@/server/admin/marketing-service";
import { requireAdminPage } from "@/server/auth/admin-page";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminMarketingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { user } = await requireAdminPage("marketing.read");
  const params = toAdminUrlSearchParams(await searchParams);
  const input = parseMarketingIndexParams(params);
  const [result, summary] = await Promise.all([
    listAdminMarketing(input),
    getAdminMarketingSummary(),
  ]);

  return (
    <>
      <AdminPageHeader eyebrow="Commerce" title="Coupons & affiliates" description="Manage server-authoritative promotion rules and affiliate attribution. Changes remain audited." />
      <div className="mt-7 space-y-5">
        <MarketingSummary summary={summary} />
        <MarketingIndexControls input={input} />
        <AdminIndexResults basePath="/admin/marketing" queryString={params.toString()} meta={result.meta} activeFilters={result.activeFilters} noun={input.view}>
          <MarketingManager view={input.view} items={result.items} canWrite={hasPermission(user.role, "marketing.write")} />
        </AdminIndexResults>
      </div>
    </>
  );
}
