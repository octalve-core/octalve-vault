import { Boxes, CheckCircle2, Download, Users } from "lucide-react";

export function MetricsGrid({ data }: { data: { products: number; paidOrders: number; grants: number; customers: number } }) {
  const cards = [["Products", data.products, Boxes], ["Paid orders", data.paidOrders, CheckCircle2], ["Active grants", data.grants, Download], ["Customers", data.customers, Users]] as const;
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, Icon]) => <article key={label} className="rounded-[24px] border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-500">{label}</p><span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-white"><Icon className="h-4 w-4" /></span></div><p className="mt-5 text-3xl font-black tracking-[-0.04em] text-slate-950">{value}</p></article>)}</div>;
}
