"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CURRENCIES } from "@/domain/constants";
import { decimalMajorToMinor, minorToMajorString } from "@/domain/money";

type CouponRow = {
  id: string;
  code: string;
  name: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  percentageBps: number | null;
  fixedAmountMinor: number | null;
  currency: string | null;
  minimumSubtotal: number | null;
  maxRedemptions: number | null;
  perEmailLimit: number | null;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  productIds: string[];
  redemptionCount: number;
  orderCount: number;
};

type AffiliateRow = {
  id: string;
  code: string;
  displayName: string;
  email: string | null;
  commissionBps: number | null;
  active: boolean;
  orderCount: number;
};

function percentageToBps(value: string, maximum = 9_999): number {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    throw new Error("Percentage must have no more than two decimal places.");
  }
  const bps = Math.round(Number(normalized) * 100);
  if (!Number.isSafeInteger(bps) || bps < 1 || bps > maximum) {
    throw new Error(
      maximum === 10_000
        ? "Percentage must be between 0.01% and 100%."
        : "Percentage must be between 0.01% and 99.99%.",
    );
  }
  return bps;
}

function optionalPositiveInteger(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error("Limits must be positive whole numbers.");
  }
  return parsed;
}

function optionalMoney(value: string): number | null {
  return value.trim() ? decimalMajorToMinor(value) : null;
}

function optionalLocalDateTime(value: FormDataEntryValue | null): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return null;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) throw new Error("Date/time is invalid.");
  return date.toISOString();
}

export function MarketingManager({
  coupons,
  affiliates,
  canWrite,
}: {
  coupons: CouponRow[];
  affiliates: AffiliateRow[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">(
    "PERCENTAGE",
  );

  async function createCoupon(formData: FormData) {
    setBusy(true);
    setMessage(null);
    try {
      const percentage = String(formData.get("percentage") ?? "");
      const fixedAmount = String(formData.get("fixedAmount") ?? "");
      const minimumSubtotal = String(formData.get("minimumSubtotal") ?? "");
      const productIds = String(formData.get("productIds") ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      const response = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "coupon",
          code: String(formData.get("code") ?? ""),
          name: String(formData.get("name") ?? ""),
          discountType,
          percentageBps:
            discountType === "PERCENTAGE" ? percentageToBps(percentage) : null,
          fixedAmountMinor:
            discountType === "FIXED_AMOUNT" ? decimalMajorToMinor(fixedAmount) : null,
          currency:
            discountType === "FIXED_AMOUNT" || formData.get("currency")
              ? String(formData.get("currency") ?? "") || null
              : null,
          minimumSubtotal: optionalMoney(minimumSubtotal),
          maxRedemptions: optionalPositiveInteger(
            String(formData.get("maxRedemptions") ?? ""),
          ),
          perEmailLimit: optionalPositiveInteger(
            String(formData.get("perEmailLimit") ?? ""),
          ),
          startsAt: optionalLocalDateTime(formData.get("startsAt")),
          endsAt: optionalLocalDateTime(formData.get("endsAt")),
          productIds,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to create coupon.");
      setMessage("Coupon created.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create coupon.");
    } finally {
      setBusy(false);
    }
  }

  async function createAffiliate(formData: FormData) {
    setBusy(true);
    setMessage(null);
    try {
      const commission = String(formData.get("commission") ?? "").trim();
      const response = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "affiliate",
          code: String(formData.get("code") ?? ""),
          displayName: String(formData.get("displayName") ?? ""),
          email: String(formData.get("email") ?? "") || null,
          commissionBps: commission ? percentageToBps(commission, 10_000) : null,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to create affiliate.");
      setMessage("Affiliate created.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create affiliate.");
    } finally {
      setBusy(false);
    }
  }

  async function setActive(kind: "coupon" | "affiliate", id: string, active: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/promotions", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, id, active }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to update status.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update status.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      {message ? (
        <p role="status" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          {message}
        </p>
      ) : null}

      {canWrite ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <form action={createCoupon} className="rounded-[26px] border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-950">Create coupon</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Coupon rules are validated again on the server before any order total is changed.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Code"><input name="code" required maxLength={40} className={inputClass} /></Field>
              <Field label="Name"><input name="name" required maxLength={160} className={inputClass} /></Field>
              <Field label="Discount type">
                <select value={discountType} onChange={(event) => setDiscountType(event.target.value as typeof discountType)} className={inputClass}>
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED_AMOUNT">Fixed amount</option>
                </select>
              </Field>
              {discountType === "PERCENTAGE" ? (
                <Field label="Discount %"><input name="percentage" required inputMode="decimal" placeholder="10" className={inputClass} /></Field>
              ) : (
                <Field label="Fixed amount"><input name="fixedAmount" required inputMode="decimal" placeholder="2500" className={inputClass} /></Field>
              )}
              <Field label="Currency">
                <select name="currency" required={discountType === "FIXED_AMOUNT"} className={inputClass}>
                  <option value="">Any (percentage only)</option>
                  {CURRENCIES.map((currency) => <option key={currency}>{currency}</option>)}
                </select>
              </Field>
              <Field label="Minimum subtotal"><input name="minimumSubtotal" inputMode="decimal" className={inputClass} /></Field>
              <Field label="Maximum redemptions"><input name="maxRedemptions" type="number" min="1" step="1" className={inputClass} /></Field>
              <Field label="Per-email limit"><input name="perEmailLimit" type="number" min="1" step="1" className={inputClass} /></Field>
              <Field label="Starts at"><input name="startsAt" type="datetime-local" className={inputClass} /></Field>
              <Field label="Ends at"><input name="endsAt" type="datetime-local" className={inputClass} /></Field>
              <div className="sm:col-span-2">
                <Field label="Restrict to product IDs (comma separated)"><input name="productIds" placeholder="vp_001, vp_002" className={inputClass} /></Field>
              </div>
            </div>
            <button disabled={busy} className={buttonClass}>Create coupon</button>
          </form>

          <form action={createAffiliate} className="rounded-[26px] border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-950">Create affiliate</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Commission is optional. Leaving it blank records attribution only and creates no payout assumption.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Affiliate code"><input name="code" required maxLength={40} className={inputClass} /></Field>
              <Field label="Display name"><input name="displayName" required maxLength={160} className={inputClass} /></Field>
              <Field label="Email"><input name="email" type="email" maxLength={254} className={inputClass} /></Field>
              <Field label="Commission % (optional)"><input name="commission" inputMode="decimal" placeholder="10" className={inputClass} /></Field>
            </div>
            <button disabled={busy} className={buttonClass}>Create affiliate</button>
          </form>
        </div>
      ) : null}

      <section className="rounded-[26px] border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-950">Coupons</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[.1em] text-slate-400"><tr><th className="pb-3">Code</th><th>Name</th><th>Rule</th><th>Products</th><th>Usage</th><th>Window</th><th>Status</th></tr></thead>
            <tbody>{coupons.map((coupon) => (
              <tr key={coupon.id} className="border-t border-slate-100">
                <td className="py-4 font-mono font-semibold">{coupon.code}</td>
                <td>{coupon.name}</td>
                <td>{coupon.discountType === "PERCENTAGE" ? `${(coupon.percentageBps ?? 0) / 100}%` : `${coupon.currency ?? ""} ${coupon.fixedAmountMinor === null ? "—" : minorToMajorString(coupon.fixedAmountMinor)}`}</td>
                <td>{coupon.productIds.length ? coupon.productIds.join(", ") : "All"}</td>
                <td>{coupon.redemptionCount}{coupon.maxRedemptions ? ` / ${coupon.maxRedemptions}` : ""}</td>
                <td className="text-xs text-slate-500">{coupon.startsAt ? new Date(coupon.startsAt).toLocaleString() : "Now"} → {coupon.endsAt ? new Date(coupon.endsAt).toLocaleString() : "Open"}</td>
                <td>{canWrite ? <button disabled={busy} onClick={() => setActive("coupon", coupon.id, !coupon.active)} className={statusClass(coupon.active)}>{coupon.active ? "Active" : "Inactive"}</button> : <span className={statusClass(coupon.active)}>{coupon.active ? "Active" : "Inactive"}</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[26px] border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-950">Affiliates</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[.1em] text-slate-400"><tr><th className="pb-3">Code</th><th>Name</th><th>Email</th><th>Commission</th><th>Orders</th><th>Status</th></tr></thead>
            <tbody>{affiliates.map((affiliate) => (
              <tr key={affiliate.id} className="border-t border-slate-100">
                <td className="py-4 font-mono font-semibold">{affiliate.code}</td>
                <td>{affiliate.displayName}</td>
                <td>{affiliate.email ?? "—"}</td>
                <td>{affiliate.commissionBps === null ? "Attribution only" : `${affiliate.commissionBps / 100}%`}</td>
                <td>{affiliate.orderCount}</td>
                <td>{canWrite ? <button disabled={busy} onClick={() => setActive("affiliate", affiliate.id, !affiliate.active)} className={statusClass(affiliate.active)}>{affiliate.active ? "Active" : "Inactive"}</button> : <span className={statusClass(affiliate.active)}>{affiliate.active ? "Active" : "Inactive"}</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="text-xs font-semibold text-slate-500">{label}{children}</label>;
}

const inputClass = "mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-[#0064E0]";
const buttonClass = "mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white disabled:opacity-50";
function statusClass(active: boolean) {
  return `rounded-full px-3 py-1.5 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`;
}
