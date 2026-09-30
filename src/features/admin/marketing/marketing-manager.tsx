"use client";
import { adminNotice } from "@/features/admin/shared/admin-notification-provider";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CURRENCIES } from "@/domain/constants";
import {
  decimalMajorToMinor,
  minorToMajorString,
} from "@/domain/money";

type CouponRow = {
  kind: "coupon";
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
  kind: "affiliate";
  id: string;
  code: string;
  displayName: string;
  email: string | null;
  commissionBps: number | null;
  active: boolean;
  orderCount: number;
};

type MarketingRow = CouponRow | AffiliateRow;

function percentageToBps(
  value: string,
  maximum = 9_999,
): number {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    throw new Error(
      "Percentage must have no more than two decimal places.",
    );
  }

  const bps = Math.round(Number(normalized) * 100);
  if (
    !Number.isSafeInteger(bps) ||
    bps < 1 ||
    bps > maximum
  ) {
    throw new Error(
      maximum === 10_000
        ? "Percentage must be between 0.01% and 100%."
        : "Percentage must be between 0.01% and 99.99%.",
    );
  }

  return bps;
}

function optionalPositiveInteger(
  value: string,
): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(
      "Limits must be positive whole numbers.",
    );
  }
  return parsed;
}

function optionalMoney(value: string): number | null {
  return value.trim()
    ? decimalMajorToMinor(value)
    : null;
}

function optionalLocalDateTime(
  value: FormDataEntryValue | null,
): string | null {
  const text =
    typeof value === "string" ? value.trim() : "";
  if (!text) return null;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Date/time is invalid.");
  }
  return date.toISOString();
}

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-[#0064E0]";
const buttonClass =
  "mt-4 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50";
const fieldClass =
  "text-sm font-medium text-slate-700";

function statusClass(active: boolean): string {
  return `rounded-full px-3 py-1.5 text-xs font-medium ${
    active
      ? "bg-emerald-50 text-emerald-700"
      : "bg-slate-100 text-slate-600"
  }`;
}

export function MarketingManager({
  view,
  items,
  canWrite,
}: {
  view: "coupons" | "affiliates";
  items: MarketingRow[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] =
    useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [discountType, setDiscountType] = useState<
    "PERCENTAGE" | "FIXED_AMOUNT"
  >("PERCENTAGE");

  async function createCoupon(formData: FormData) {
    setBusy(true);
    const noticeId = adminNotice.pending({
      title: "Creating coupon",
      message: "Saving the new coupon...",
    });
    setMessage(null);

    try {
      const percentage = String(
        formData.get("percentage") ?? "",
      );
      const fixedAmount = String(
        formData.get("fixedAmount") ?? "",
      );
      const minimumSubtotal = String(
        formData.get("minimumSubtotal") ?? "",
      );
      const productIds = String(
        formData.get("productIds") ?? "",
      )
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      const response = await fetch(
        "/api/admin/promotions",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            kind: "coupon",
            code: String(formData.get("code") ?? ""),
            name: String(formData.get("name") ?? ""),
            discountType,
            percentageBps:
              discountType === "PERCENTAGE"
                ? percentageToBps(percentage)
                : null,
            fixedAmountMinor:
              discountType === "FIXED_AMOUNT"
                ? decimalMajorToMinor(fixedAmount)
                : null,
            currency:
              discountType === "FIXED_AMOUNT" ||
              formData.get("currency")
                ? String(
                    formData.get("currency") ?? "",
                  ) || null
                : null,
            minimumSubtotal:
              optionalMoney(minimumSubtotal),
            maxRedemptions:
              optionalPositiveInteger(
                String(
                  formData.get("maxRedemptions") ??
                    "",
                ),
              ),
            perEmailLimit:
              optionalPositiveInteger(
                String(
                  formData.get("perEmailLimit") ??
                    "",
                ),
              ),
            startsAt: optionalLocalDateTime(
              formData.get("startsAt"),
            ),
            endsAt: optionalLocalDateTime(
              formData.get("endsAt"),
            ),
            productIds,
          }),
        },
      );

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to create coupon.",
        );
      }

      setMessage("Coupon created.");
      adminNotice.success(noticeId, {
        title: "Coupon created",
        message: "The coupon list and summary are now refreshed.",
      });
      router.refresh();
    } catch (error) {
      const noticeMessage =
        error instanceof Error ? error.message : "Unable to create coupon.";
      adminNotice.error(noticeId, {
        title: "Coupon not created",
        message: noticeMessage,
      });
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to create coupon.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function createAffiliate(
    formData: FormData,
  ) {
    setBusy(true);
    const noticeId = adminNotice.pending({
      title: "Creating affiliate",
      message: "Saving the new affiliate...",
    });
    setMessage(null);

    try {
      const commission = String(
        formData.get("commission") ?? "",
      ).trim();

      const response = await fetch(
        "/api/admin/promotions",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            kind: "affiliate",
            code: String(formData.get("code") ?? ""),
            displayName: String(
              formData.get("displayName") ?? "",
            ),
            email:
              String(formData.get("email") ?? "") ||
              null,
            commissionBps: commission
              ? percentageToBps(
                  commission,
                  10_000,
                )
              : null,
          }),
        },
      );

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to create affiliate.",
        );
      }

      setMessage("Affiliate created.");
      adminNotice.success(noticeId, {
        title: "Affiliate created",
        message: "The affiliate list and summary are now refreshed.",
      });
      router.refresh();
    } catch (error) {
      const noticeMessage =
        error instanceof Error ? error.message : "Unable to create affiliate.";
      adminNotice.error(noticeId, {
        title: "Affiliate not created",
        message: noticeMessage,
      });
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to create affiliate.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function setActive(
    kind: "coupon" | "affiliate",
    id: string,
    active: boolean,
  ) {
    setBusy(true);
    const noticeId = adminNotice.pending({
      title: "Updating marketing status",
      message: "Saving the new active state...",
    });
    setMessage(null);

    try {
      const response = await fetch(
        "/api/admin/promotions",
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            kind,
            id,
            active,
          }),
        },
      );

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to update status.",
        );
      }

      adminNotice.success(noticeId, {
        title: "Marketing status updated",
        message: "The latest server-confirmed status is now displayed.",
      });
      router.refresh();
    } catch (error) {
      const noticeMessage =
        error instanceof Error ? error.message : "Unable to update status.";
      adminNotice.error(noticeId, {
        title: "Status not updated",
        message: noticeMessage,
      });
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update status.",
      );
    } finally {
      setBusy(false);
    }
  }

  const coupons = items.filter(
    (item): item is CouponRow =>
      item.kind === "coupon",
  );
  const affiliates = items.filter(
    (item): item is AffiliateRow =>
      item.kind === "affiliate",
  );

  return (
    <div className="space-y-8">
      {message ? (
        <p
          role="status"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
        >
          {message}
        </p>
      ) : null}

      {canWrite ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <form
            action={createCoupon}
            className="rounded-[26px] border border-slate-200 bg-white p-6"
          >
            <h2 className="text-lg font-medium text-slate-950">
              Create coupon
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Coupon rules are validated again on the
              server before any order total is changed.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className={fieldClass}>
                Code
                <input
                  name="code"
                  required
                  maxLength={40}
                  className={`mt-2 ${inputClass}`}
                />
              </label>
              <label className={fieldClass}>
                Name
                <input
                  name="name"
                  required
                  maxLength={160}
                  className={`mt-2 ${inputClass}`}
                />
              </label>
              <label className={fieldClass}>
                Discount type
                <select
                  value={discountType}
                  onChange={(event) =>
                    setDiscountType(
                      event.target
                        .value as typeof discountType,
                    )
                  }
                  className={`mt-2 ${inputClass}`}
                >
                  <option value="PERCENTAGE">
                    Percentage
                  </option>
                  <option value="FIXED_AMOUNT">
                    Fixed amount
                  </option>
                </select>
              </label>

              {discountType === "PERCENTAGE" ? (
                <label className={fieldClass}>
                  Discount %
                  <input
                    name="percentage"
                    required
                    inputMode="decimal"
                    placeholder="10"
                    className={`mt-2 ${inputClass}`}
                  />
                </label>
              ) : (
                <label className={fieldClass}>
                  Fixed amount
                  <input
                    name="fixedAmount"
                    required
                    inputMode="decimal"
                    placeholder="2500"
                    className={`mt-2 ${inputClass}`}
                  />
                </label>
              )}

              <label className={fieldClass}>
                Currency
                <select
                  name="currency"
                  required={
                    discountType === "FIXED_AMOUNT"
                  }
                  className={`mt-2 ${inputClass}`}
                >
                  <option value="">
                    Any (percentage only)
                  </option>
                  {CURRENCIES.map((currency) => (
                    <option key={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </label>
              <label className={fieldClass}>
                Minimum subtotal
                <input
                  name="minimumSubtotal"
                  inputMode="decimal"
                  className={`mt-2 ${inputClass}`}
                />
              </label>
              <label className={fieldClass}>
                Maximum redemptions
                <input
                  name="maxRedemptions"
                  type="number"
                  min="1"
                  step="1"
                  className={`mt-2 ${inputClass}`}
                />
              </label>
              <label className={fieldClass}>
                Per-email limit
                <input
                  name="perEmailLimit"
                  type="number"
                  min="1"
                  step="1"
                  className={`mt-2 ${inputClass}`}
                />
              </label>
              <label className={fieldClass}>
                Starts at
                <input
                  name="startsAt"
                  type="datetime-local"
                  className={`mt-2 ${inputClass}`}
                />
              </label>
              <label className={fieldClass}>
                Ends at
                <input
                  name="endsAt"
                  type="datetime-local"
                  className={`mt-2 ${inputClass}`}
                />
              </label>
              <label
                className={`${fieldClass} sm:col-span-2`}
              >
                Restrict to product IDs
                <input
                  name="productIds"
                  placeholder="vp_001, vp_002"
                  className={`mt-2 ${inputClass}`}
                />
              </label>
            </div>
            <button
              disabled={busy}
              className={buttonClass}
            >
              Create coupon
            </button>
          </form>

          <form
            action={createAffiliate}
            className="h-fit rounded-[26px] border border-slate-200 bg-white p-6"
          >
            <h2 className="text-lg font-medium text-slate-950">
              Create affiliate
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Commission is optional. Leaving it blank
              records attribution only.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className={fieldClass}>
                Affiliate code
                <input
                  name="code"
                  required
                  maxLength={40}
                  className={`mt-2 ${inputClass}`}
                />
              </label>
              <label className={fieldClass}>
                Display name
                <input
                  name="displayName"
                  required
                  maxLength={160}
                  className={`mt-2 ${inputClass}`}
                />
              </label>
              <label className={fieldClass}>
                Email
                <input
                  name="email"
                  type="email"
                  maxLength={254}
                  className={`mt-2 ${inputClass}`}
                />
              </label>
              <label className={fieldClass}>
                Commission % (optional)
                <input
                  name="commission"
                  inputMode="decimal"
                  placeholder="10"
                  className={`mt-2 ${inputClass}`}
                />
              </label>
            </div>
            <button
              disabled={busy}
              className={buttonClass}
            >
              Create affiliate
            </button>
          </form>
        </div>
      ) : null}

      {view === "coupons" ? (
        <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[.1em] text-slate-400">
                <tr>
                  <th className="px-5 py-4">Code</th>
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Rule</th>
                  <th className="px-5 py-4">Products</th>
                  <th className="px-5 py-4">Usage</th>
                  <th className="px-5 py-4">Window</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td className="px-5 py-4 font-mono font-medium">
                      {coupon.code}
                    </td>
                    <td className="px-5 py-4">
                      {coupon.name}
                    </td>
                    <td className="px-5 py-4">
                      {coupon.discountType ===
                      "PERCENTAGE"
                        ? `${
                            (coupon.percentageBps ??
                              0) / 100
                          }%`
                        : `${coupon.currency ?? ""} ${
                            coupon.fixedAmountMinor ===
                            null
                              ? "—"
                              : minorToMajorString(
                                  coupon.fixedAmountMinor,
                                )
                          }`}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {coupon.productIds.length
                        ? coupon.productIds.join(", ")
                        : "All"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {coupon.redemptionCount}
                      {coupon.maxRedemptions
                        ? ` / ${coupon.maxRedemptions}`
                        : ""}
                      <span className="ml-2 text-xs text-slate-400">
                        all-env detail
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {coupon.startsAt
                        ? new Date(
                            coupon.startsAt,
                          ).toLocaleString()
                        : "Now"}{" "}
                      →{" "}
                      {coupon.endsAt
                        ? new Date(
                            coupon.endsAt,
                          ).toLocaleString()
                        : "Open"}
                    </td>
                    <td className="px-5 py-4">
                      {canWrite ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void setActive(
                              "coupon",
                              coupon.id,
                              !coupon.active,
                            )
                          }
                          className={statusClass(
                            coupon.active,
                          )}
                        >
                          {coupon.active
                            ? "Active"
                            : "Inactive"}
                        </button>
                      ) : (
                        <span
                          className={statusClass(
                            coupon.active,
                          )}
                        >
                          {coupon.active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[.1em] text-slate-400">
                <tr>
                  <th className="px-5 py-4">Code</th>
                  <th className="px-5 py-4">Affiliate</th>
                  <th className="px-5 py-4">Commission</th>
                  <th className="px-5 py-4">Attributed orders</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {affiliates.map((affiliate) => (
                  <tr key={affiliate.id}>
                    <td className="px-5 py-4 font-mono font-medium">
                      {affiliate.code}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">
                        {affiliate.displayName}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {affiliate.email ?? "No email"}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      {affiliate.commissionBps ===
                      null
                        ? "Attribution only"
                        : `${
                            affiliate.commissionBps /
                            100
                          }%`}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {affiliate.orderCount}
                      <span className="ml-2 text-xs text-slate-400">
                        all-env detail
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {canWrite ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void setActive(
                              "affiliate",
                              affiliate.id,
                              !affiliate.active,
                            )
                          }
                          className={statusClass(
                            affiliate.active,
                          )}
                        >
                          {affiliate.active
                            ? "Active"
                            : "Inactive"}
                        </button>
                      ) : (
                        <span
                          className={statusClass(
                            affiliate.active,
                          )}
                        >
                          {affiliate.active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
