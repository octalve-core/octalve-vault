import { AdminPageHeader } from "@/features/admin/shared/admin-page-header";
import { OrdersTable } from "@/features/admin/orders/orders-table";
import { requireAdminPage } from "@/server/auth/admin-page";
import { listAdminOrders } from "@/server/admin/operations-service";

export default async function AdminOrdersPage() { await requireAdminPage("order.read"); const orders = await listAdminOrders(); return <><AdminPageHeader eyebrow="Commerce" title="Orders" description="Review immutable order snapshots, customer identities and payment state." /><div className="mt-7"><OrdersTable orders={orders} /></div></>; }
