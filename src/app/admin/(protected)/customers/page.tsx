import { CustomersTable } from "@/features/admin/customers/customers-table";
import { AdminIndexResults } from "@/features/admin/shared/admin-index-results";
import { AdminPageHeader } from "@/features/admin/shared/admin-page-header";
import { CustomerIndexControls } from "@/features/admin/shared/admin-resource-controls";
import { CustomerSummary } from "@/features/admin/shared/admin-resource-summaries";
import { toAdminUrlSearchParams } from "@/features/admin/shared/admin-search-params";
import { parseCustomerIndexParams } from "@/server/admin/customers-index";
import {
  getAdminCustomerSummary,
  listAdminCustomers,
} from "@/server/admin/customers-service";
import { requireAdminPage } from "@/server/auth/admin-page";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdminPage("customer.read");
  const params = toAdminUrlSearchParams(await searchParams);
  const input = parseCustomerIndexParams(params);
  const [result, summary] = await Promise.all([
    listAdminCustomers(input),
    getAdminCustomerSummary(),
  ]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Customers"
        title="Customers"
        description="A privacy-conscious operational view derived from verified paid orders."
      />
      <div className="mt-7 space-y-5">
        <CustomerSummary summary={summary} />
        <CustomerIndexControls input={input} />
        <AdminIndexResults basePath="/admin/customers" queryString={params.toString()} meta={result.meta} activeFilters={result.activeFilters} noun="customers">
          <CustomersTable customers={result.items} />
        </AdminIndexResults>
      </div>
    </>
  );
}
