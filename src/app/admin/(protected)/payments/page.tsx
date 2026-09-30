import { hasPermission } from "@/domain/permissions";
import { PaymentsTable } from "@/features/admin/payments/payments-table";
import { RefundPanel } from "@/features/admin/refunds/refund-panel";
import { AdminIndexResults } from "@/features/admin/shared/admin-index-results";
import { AdminPageHeader } from "@/features/admin/shared/admin-page-header";
import { PaymentIndexControls } from "@/features/admin/shared/admin-resource-controls";
import { PaymentSummary } from "@/features/admin/shared/admin-resource-summaries";
import { toAdminUrlSearchParams } from "@/features/admin/shared/admin-search-params";
import { listAdminRefundableOrders } from "@/server/admin/operations-service";
import { parsePaymentIndexParams } from "@/server/admin/payments-index";
import {
  getAdminPaymentSummary,
  listAdminPayments,
} from "@/server/admin/payments-service";
import { requireAdminPage } from "@/server/auth/admin-page";
import { listRefunds } from "@/server/refunds/refund-service";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { user } = await requireAdminPage("payment.read");
  const params = toAdminUrlSearchParams(await searchParams);
  const input = parsePaymentIndexParams(params);
  const [result, summary, paidOrders, refunds] = await Promise.all([
    listAdminPayments(input),
    getAdminPaymentSummary(),
    listAdminRefundableOrders(),
    listRefunds(),
  ]);
  const refundRows = refunds.map((refund) => ({
    id: refund.id,
    amount: refund.amount,
    currency: refund.currency,
    status: refund.status,
    reason: refund.reason,
    createdAt: refund.createdAt.toISOString(),
    order: refund.order,
  }));

  return (
    <>
      <AdminPageHeader
        eyebrow="Commerce"
        title="Payments & refunds"
        description="Provider attempts, verification state, provider references and real provider refund initiation."
      />
      <div className="mt-7 space-y-5">
        <PaymentSummary summary={summary} />
        <PaymentIndexControls input={input} />
        <AdminIndexResults basePath="/admin/payments" queryString={params.toString()} meta={result.meta} activeFilters={result.activeFilters} noun="payments">
          <PaymentsTable payments={result.items} />
        </AdminIndexResults>
      </div>
      <RefundPanel orders={paidOrders} refunds={refundRows} canCreate={hasPermission(user.role, "refund.create")} />
    </>
  );
}
