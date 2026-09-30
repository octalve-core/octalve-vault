import { OrdersTable } from "@/features/admin/orders/orders-table";
import { AdminIndexResults } from "@/features/admin/shared/admin-index-results";
import { AdminPageHeader } from "@/features/admin/shared/admin-page-header";
import { OrderIndexControls } from "@/features/admin/shared/admin-resource-controls";
import { OrderSummary } from "@/features/admin/shared/admin-resource-summaries";
import { toAdminUrlSearchParams } from "@/features/admin/shared/admin-search-params";
import { parseOrderIndexParams } from "@/server/admin/orders-index";
import {
  getAdminOrderSummary,
  listAdminOrders,
} from "@/server/admin/orders-service";
import { requireAdminPage } from "@/server/auth/admin-page";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdminPage("order.read");
  const params = toAdminUrlSearchParams(await searchParams);
  const input = parseOrderIndexParams(params);
  const [result, summary] = await Promise.all([
    listAdminOrders(input),
    getAdminOrderSummary(),
  ]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Commerce"
        title="Orders"
        description="Review immutable order snapshots, customer identities and payment state."
      />
      <div className="mt-7 space-y-5">
        <OrderSummary summary={summary} />
        <OrderIndexControls input={input} />
        <AdminIndexResults
          basePath="/admin/orders"
          queryString={params.toString()}
          meta={result.meta}
          activeFilters={result.activeFilters}
          noun="orders"
        >
          <OrdersTable orders={result.items} />
        </AdminIndexResults>
      </div>
    </>
  );
}
