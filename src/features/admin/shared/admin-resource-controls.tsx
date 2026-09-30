import Link from "next/link";

import {
  ADMIN_ROLES,
  CURRENCIES,
  PAYMENT_ENVIRONMENTS,
  PAYMENT_PROVIDERS,
} from "@/domain/constants";
import {
  AUDIT_INDEX_SORTS,
  AUDIT_ORIGINS,
  type AuditIndexInput,
} from "@/server/admin/audit-index";
import {
  CUSTOMER_INDEX_SORTS,
  CUSTOMER_SEGMENTS,
  type CustomerIndexInput,
} from "@/server/admin/customers-index";
import {
  DOWNLOAD_GRANT_STATES,
  DOWNLOAD_INDEX_SORTS,
  type DownloadIndexInput,
} from "@/server/admin/downloads-index";
import {
  AFFILIATE_INDEX_SORTS,
  COUPON_DISCOUNT_TYPES,
  COUPON_INDEX_SORTS,
  type MarketingIndexInput,
} from "@/server/admin/marketing-index";
import {
  ORDER_INDEX_SORTS,
  ORDER_STATUSES,
  type OrderIndexInput,
} from "@/server/admin/orders-index";
import {
  PAYMENT_INDEX_SORTS,
  PAYMENT_STATUSES,
  type PaymentIndexInput,
} from "@/server/admin/payments-index";
import { ADMIN_PAGE_SIZES } from "@/server/admin/resource-index";
import {
  TEAM_INDEX_SORTS,
  TEAM_LOGIN_STATES,
  type TeamIndexInput,
} from "@/server/admin/team-index";
import type { AdminAuditActor } from "@/server/admin/audit-query-service";

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-[#0064E0]";
const formClass =
  "grid gap-4 rounded-[28px] border border-slate-200 bg-white p-5 sm:p-6 lg:grid-cols-4";

function dateValue(value?: Date): string {
  return value ? value.toISOString().slice(0, 10) : "";
}

function inclusiveToValue(value?: Date): string {
  return value
    ? new Date(value.getTime() - 86_400_000)
        .toISOString()
        .slice(0, 10)
    : "";
}

function Actions({ clearHref }: { clearHref: string }) {
  return (
    <div className="flex items-end gap-3 lg:col-span-2">
      <button
        type="submit"
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-[#0064E0]"
      >
        Apply filters
      </button>
      <Link
        href={clearHref}
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Clear
      </Link>
    </div>
  );
}

function PageSize({
  value,
}: {
  value: number;
}) {
  return (
    <label className="text-sm font-medium text-slate-700">
      Page size
      <select
        name="pageSize"
        defaultValue={String(value)}
        className={inputClass}
      >
        {ADMIN_PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </label>
  );
}

export function OrderIndexControls({
  input,
}: {
  input: OrderIndexInput;
}) {
  return (
    <form method="get" className={formClass}>
      <label className="text-sm font-medium text-slate-700 lg:col-span-2">
        Search
        <input name="q" defaultValue={input.query} placeholder="Reference, email or product" className={inputClass} />
      </label>
      <label className="text-sm font-medium text-slate-700">
        Status
        <select name="status" defaultValue={input.status ?? ""} className={inputClass}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((status) => <option key={status}>{status}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">
        Environment
        <select name="environment" defaultValue={input.environment ?? ""} className={inputClass}>
          <option value="">TEST + LIVE</option>
          {PAYMENT_ENVIRONMENTS.map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">
        Provider
        <select name="provider" defaultValue={input.provider ?? ""} className={inputClass}>
          <option value="">All providers</option>
          {PAYMENT_PROVIDERS.map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">
        Currency
        <select name="currency" defaultValue={input.currency ?? ""} className={inputClass}>
          <option value="">All currencies</option>
          {CURRENCIES.map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">Created from<input type="date" name="createdFrom" defaultValue={dateValue(input.created.from)} className={inputClass} /></label>
      <label className="text-sm font-medium text-slate-700">Created to<input type="date" name="createdTo" defaultValue={inclusiveToValue(input.created.toExclusive)} className={inputClass} /></label>
      <label className="text-sm font-medium text-slate-700">Paid from<input type="date" name="paidFrom" defaultValue={dateValue(input.paid.from)} className={inputClass} /></label>
      <label className="text-sm font-medium text-slate-700">Paid to<input type="date" name="paidTo" defaultValue={inclusiveToValue(input.paid.toExclusive)} className={inputClass} /></label>
      <label className="text-sm font-medium text-slate-700">
        Sort
        <select name="sort" defaultValue={input.sort} className={inputClass}>
          {ORDER_INDEX_SORTS.map((sort) => <option key={sort} value={sort}>{sort.replaceAll("-", " ")}</option>)}
        </select>
      </label>
      <PageSize value={input.pageSize} />
      <Actions clearHref="/admin/orders" />
    </form>
  );
}

export function PaymentIndexControls({
  input,
}: {
  input: PaymentIndexInput;
}) {
  return (
    <form method="get" className={formClass}>
      <label className="text-sm font-medium text-slate-700 lg:col-span-2">
        Search
        <input name="q" defaultValue={input.query} placeholder="Provider ref, transaction, order or email" className={inputClass} />
      </label>
      <label className="text-sm font-medium text-slate-700">
        Status
        <select name="status" defaultValue={input.status ?? ""} className={inputClass}>
          <option value="">All statuses</option>
          {PAYMENT_STATUSES.map((status) => <option key={status}>{status}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">
        Environment
        <select name="environment" defaultValue={input.environment ?? ""} className={inputClass}>
          <option value="">TEST + LIVE</option>
          {PAYMENT_ENVIRONMENTS.map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">
        Provider
        <select name="provider" defaultValue={input.provider ?? ""} className={inputClass}>
          <option value="">All providers</option>
          {PAYMENT_PROVIDERS.map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">
        Currency
        <select name="currency" defaultValue={input.currency ?? ""} className={inputClass}>
          <option value="">All currencies</option>
          {CURRENCIES.map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">Created from<input type="date" name="createdFrom" defaultValue={dateValue(input.created.from)} className={inputClass} /></label>
      <label className="text-sm font-medium text-slate-700">Created to<input type="date" name="createdTo" defaultValue={inclusiveToValue(input.created.toExclusive)} className={inputClass} /></label>
      <label className="text-sm font-medium text-slate-700">Updated from<input type="date" name="updatedFrom" defaultValue={dateValue(input.updated.from)} className={inputClass} /></label>
      <label className="text-sm font-medium text-slate-700">Updated to<input type="date" name="updatedTo" defaultValue={inclusiveToValue(input.updated.toExclusive)} className={inputClass} /></label>
      <label className="text-sm font-medium text-slate-700">
        Sort
        <select name="sort" defaultValue={input.sort} className={inputClass}>
          {PAYMENT_INDEX_SORTS.map((sort) => <option key={sort} value={sort}>{sort.replaceAll("-", " ")}</option>)}
        </select>
      </label>
      <PageSize value={input.pageSize} />
      <Actions clearHref="/admin/payments" />
    </form>
  );
}

export function CustomerIndexControls({
  input,
}: {
  input: CustomerIndexInput;
}) {
  return (
    <form method="get" className={formClass}>
      <label className="text-sm font-medium text-slate-700 lg:col-span-2">Search<input name="q" defaultValue={input.query} placeholder="Customer email" className={inputClass} /></label>
      <label className="text-sm font-medium text-slate-700">
        Buyer segment
        <select name="segment" defaultValue={input.segment ?? ""} className={inputClass}>
          <option value="">All buyers</option>
          {CUSTOMER_SEGMENTS.map((segment) => <option key={segment} value={segment}>{segment}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">
        Currency
        <select name="currency" defaultValue={input.currency ?? ""} className={inputClass}>
          <option value="">All currencies</option>
          {CURRENCIES.map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">Last order from<input type="date" name="lastOrderFrom" defaultValue={dateValue(input.lastOrder.from)} className={inputClass} /></label>
      <label className="text-sm font-medium text-slate-700">Last order to<input type="date" name="lastOrderTo" defaultValue={inclusiveToValue(input.lastOrder.toExclusive)} className={inputClass} /></label>
      <label className="text-sm font-medium text-slate-700">
        Sort
        <select name="sort" defaultValue={input.sort} className={inputClass}>
          {CUSTOMER_INDEX_SORTS.map((sort) => <option key={sort} value={sort}>{sort.replaceAll("-", " ")}</option>)}
        </select>
      </label>
      <PageSize value={input.pageSize} />
      <Actions clearHref="/admin/customers" />
    </form>
  );
}

export function DownloadIndexControls({
  input,
}: {
  input: DownloadIndexInput;
}) {
  return (
    <form method="get" className={formClass}>
      <label className="text-sm font-medium text-slate-700 lg:col-span-2">Search<input name="q" defaultValue={input.query} placeholder="Email, order, product or filename" className={inputClass} /></label>
      <label className="text-sm font-medium text-slate-700">
        State
        <select name="state" defaultValue={input.state ?? ""} className={inputClass}>
          <option value="">All states</option>
          {DOWNLOAD_GRANT_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">
        Environment
        <select name="environment" defaultValue={input.environment ?? ""} className={inputClass}>
          <option value="">TEST + LIVE</option>
          {PAYMENT_ENVIRONMENTS.map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">Product<input name="product" defaultValue={input.product ?? ""} placeholder="Product ID, slug or title" className={inputClass} /></label>
      <label className="text-sm font-medium text-slate-700">Created from<input type="date" name="createdFrom" defaultValue={dateValue(input.created.from)} className={inputClass} /></label>
      <label className="text-sm font-medium text-slate-700">Created to<input type="date" name="createdTo" defaultValue={inclusiveToValue(input.created.toExclusive)} className={inputClass} /></label>
      <label className="text-sm font-medium text-slate-700">Expiry from<input type="date" name="expiryFrom" defaultValue={dateValue(input.expiry.from)} className={inputClass} /></label>
      <label className="text-sm font-medium text-slate-700">Expiry to<input type="date" name="expiryTo" defaultValue={inclusiveToValue(input.expiry.toExclusive)} className={inputClass} /></label>
      <label className="text-sm font-medium text-slate-700">
        Sort
        <select name="sort" defaultValue={input.sort} className={inputClass}>
          {DOWNLOAD_INDEX_SORTS.map((sort) => <option key={sort} value={sort}>{sort.replaceAll("-", " ")}</option>)}
        </select>
      </label>
      <PageSize value={input.pageSize} />
      <Actions clearHref="/admin/downloads" />
    </form>
  );
}

export function MarketingIndexControls({
  input,
}: {
  input: MarketingIndexInput;
}) {
  const sorts =
    input.view === "coupons"
      ? COUPON_INDEX_SORTS
      : AFFILIATE_INDEX_SORTS;

  return (
    <section className="space-y-4">
      <div className="flex gap-2">
        <Link href="/admin/marketing?view=coupons" className={`rounded-full px-4 py-2 text-sm font-medium ${input.view === "coupons" ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-700"}`}>Coupons</Link>
        <Link href="/admin/marketing?view=affiliates" className={`rounded-full px-4 py-2 text-sm font-medium ${input.view === "affiliates" ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-700"}`}>Affiliates</Link>
      </div>
      <form method="get" className={formClass}>
        <input type="hidden" name="view" value={input.view} />
        <label className="text-sm font-medium text-slate-700 lg:col-span-2">Search<input name="q" defaultValue={input.query} placeholder={input.view === "coupons" ? "Coupon code or name" : "Affiliate code, name or email"} className={inputClass} /></label>
        <label className="text-sm font-medium text-slate-700">
          Status
          <select name="active" defaultValue={input.active === undefined ? "" : String(input.active)} className={inputClass}>
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </label>
        {input.view === "coupons" ? (
          <>
            <label className="text-sm font-medium text-slate-700">
              Discount type
              <select name="discountType" defaultValue={input.discountType ?? ""} className={inputClass}>
                <option value="">All types</option>
                {COUPON_DISCOUNT_TYPES.map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Currency
              <select name="currency" defaultValue={input.currency ?? ""} className={inputClass}>
                <option value="">Any currency</option>
                {CURRENCIES.map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
          </>
        ) : null}
        <label className="text-sm font-medium text-slate-700">
          Sort
          <select name="sort" defaultValue={input.sort} className={inputClass}>
            {sorts.map((sort) => <option key={sort} value={sort}>{sort.replaceAll("-", " ")}</option>)}
          </select>
        </label>
        <PageSize value={input.pageSize} />
        <Actions clearHref={`/admin/marketing?view=${input.view}`} />
      </form>
    </section>
  );
}

export function TeamIndexControls({
  input,
}: {
  input: TeamIndexInput;
}) {
  return (
    <form method="get" className={formClass}>
      <label className="text-sm font-medium text-slate-700 lg:col-span-2">Search<input name="q" defaultValue={input.query} placeholder="Name or email" className={inputClass} /></label>
      <label className="text-sm font-medium text-slate-700">
        Role
        <select name="role" defaultValue={input.role ?? ""} className={inputClass}>
          <option value="">All roles</option>
          {ADMIN_ROLES.map((role) => <option key={role}>{role}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">
        Status
        <select name="active" defaultValue={input.active === undefined ? "" : String(input.active)} className={inputClass}>
          <option value="">All</option>
          <option value="true">Active</option>
          <option value="false">Disabled</option>
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">
        Login
        <select name="loginState" defaultValue={input.loginState ?? ""} className={inputClass}>
          <option value="">Any login state</option>
          {TEAM_LOGIN_STATES.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">
        Sort
        <select name="sort" defaultValue={input.sort} className={inputClass}>
          {TEAM_INDEX_SORTS.map((sort) => <option key={sort} value={sort}>{sort.replaceAll("-", " ")}</option>)}
        </select>
      </label>
      <PageSize value={input.pageSize} />
      <Actions clearHref="/admin/team" />
    </form>
  );
}

export function AuditIndexControls({
  input,
  actors,
  entityTypes,
}: {
  input: AuditIndexInput;
  actors: AdminAuditActor[];
  entityTypes: string[];
}) {
  return (
    <form method="get" className={formClass}>
      <label className="text-sm font-medium text-slate-700 lg:col-span-2">Search<input name="q" defaultValue={input.query} placeholder="Action, entity, ID or actor" className={inputClass} /></label>
      <label className="text-sm font-medium text-slate-700">
        Entity type
        <select name="entityType" defaultValue={input.entityType ?? ""} className={inputClass}>
          <option value="">All entities</option>
          {entityTypes.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">
        Actor
        <select name="actor" defaultValue={input.actorAdminId ?? ""} className={inputClass}>
          <option value="">All actors</option>
          {actors.map((actor) => <option key={actor.id} value={actor.id}>{actor.displayName} · {actor.email}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">
        Origin
        <select name="origin" defaultValue={input.origin ?? ""} className={inputClass}>
          <option value="">Human + system</option>
          {AUDIT_ORIGINS.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">Created from<input type="date" name="createdFrom" defaultValue={dateValue(input.created.from)} className={inputClass} /></label>
      <label className="text-sm font-medium text-slate-700">Created to<input type="date" name="createdTo" defaultValue={inclusiveToValue(input.created.toExclusive)} className={inputClass} /></label>
      <label className="text-sm font-medium text-slate-700">
        Sort
        <select name="sort" defaultValue={input.sort} className={inputClass}>
          {AUDIT_INDEX_SORTS.map((sort) => <option key={sort} value={sort}>{sort}</option>)}
        </select>
      </label>
      <PageSize value={input.pageSize} />
      <Actions clearHref="/admin/audit" />
    </form>
  );
}
