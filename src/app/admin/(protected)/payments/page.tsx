import { AdminPageHeader } from "@/features/admin/shared/admin-page-header";
import { PaymentsTable } from "@/features/admin/payments/payments-table";
import { RefundPanel } from "@/features/admin/refunds/refund-panel";
import { requireAdminPage } from "@/server/auth/admin-page";
import {
  listAdminPayments,
  listAdminRefundableOrders,
} from "@/server/admin/operations-service";
import { listRefunds } from "@/server/refunds/refund-service";
import { hasPermission } from "@/domain/permissions";

export default async function AdminPaymentsPage() {
  const { user } = await requireAdminPage("payment.read");

  const [payments, paidOrders, refunds] =
    await Promise.all([
      listAdminPayments(),
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

      <div className="mt-7">
        <PaymentsTable payments={payments} />
      </div>

      <RefundPanel
        orders={paidOrders}
        refunds={refundRows}
        canCreate={hasPermission(
          user.role,
          "refund.create",
        )}
      />
    </>
  );
}
