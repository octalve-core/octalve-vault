import { AdminEmpty } from "../shared/admin-empty";
import { formatMoney } from "@/domain/money";
import type { CurrencyCode } from "@/domain/constants";

type CustomerRow = { email: string; orders: number; lastOrderAt: Date; totals: Record<string, number> };
export function CustomersTable({ customers }: { customers: CustomerRow[] }) {
  if (!customers.length) return <AdminEmpty title="No customers yet" description="Customers appear after a verified paid order." />;
  return <div className="grid gap-3">{customers.map((customer) => <div key={customer.email} className="rounded-[24px] border border-slate-200 bg-white p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black text-slate-950">{customer.email}</p><p className="mt-1 text-xs text-slate-400">{customer.orders} paid order{customer.orders === 1 ? "" : "s"} · Last {customer.lastOrderAt.toLocaleString("en-NG")}</p></div><div className="flex flex-wrap gap-2">{Object.entries(customer.totals).map(([currency, amount]) => <span key={currency} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{formatMoney(amount, currency as CurrencyCode, "en")}</span>)}</div></div></div>)}</div>;
}
