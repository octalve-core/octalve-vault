import { AdminEmpty } from "../shared/admin-empty";
import { formatMoney } from "@/domain/money";
import type { CurrencyCode } from "@/domain/constants";

type PaymentRow = { id: string; provider: string; providerReference: string; amount: number; currency: string; status: string; createdAt: Date; order: { reference: string; email: string } };
export function PaymentsTable({ payments }: { payments: PaymentRow[] }) {
  if (!payments.length) return <AdminEmpty title="No payment attempts yet" description="Provider payment attempts and verification states will appear here." />;
  return <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-[.1em] text-slate-400"><tr><th className="px-5 py-4">Provider</th><th className="px-5 py-4">Order</th><th className="px-5 py-4">Customer</th><th className="px-5 py-4">Amount</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Reference</th></tr></thead><tbody className="divide-y divide-slate-100">{payments.map((payment) => <tr key={payment.id}><td className="px-5 py-5 font-black text-slate-950">{payment.provider}</td><td className="px-5 py-5 text-slate-600">{payment.order.reference}</td><td className="px-5 py-5 text-slate-600">{payment.order.email}</td><td className="px-5 py-5 font-black text-slate-900">{formatMoney(payment.amount, payment.currency as CurrencyCode, "en")}</td><td className="px-5 py-5"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{payment.status}</span></td><td className="px-5 py-5 text-xs text-slate-500">{payment.providerReference}</td></tr>)}</tbody></table></div></div>;
}
