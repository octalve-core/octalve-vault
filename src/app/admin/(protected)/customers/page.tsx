import { AdminPageHeader } from "@/features/admin/shared/admin-page-header";
import { CustomersTable } from "@/features/admin/customers/customers-table";
import { requireAdminPage } from "@/server/auth/admin-page";
import { listAdminCustomers } from "@/server/admin/operations-service";

export default async function AdminCustomersPage() { await requireAdminPage("customer.read"); const customers = await listAdminCustomers(); return <><AdminPageHeader eyebrow="Customers" title="Customers" description="A privacy-conscious operational view derived from verified paid orders." /><div className="mt-7"><CustomersTable customers={customers} /></div></>; }
