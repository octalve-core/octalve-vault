import Link from "next/link";

import { CURRENCIES, PRODUCT_STATUSES } from "@/domain/constants";
import {
  PRODUCT_INDEX_SORTS,
  type ProductIndexInput,
} from "@/server/admin/products-index";
import { ADMIN_PAGE_SIZES } from "@/server/admin/resource-index";

function dateValue(value?: Date): string {
  return value ? value.toISOString().slice(0, 10) : "";
}

function inclusiveToValue(value?: Date): string {
  return value
    ? new Date(value.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    : "";
}

const SORT_LABELS: Record<(typeof PRODUCT_INDEX_SORTS)[number], string> = {
  newest: "Newest",
  oldest: "Oldest",
  "recently-updated": "Recently updated",
  title: "Title A–Z",
  status: "Status",
};

export function ProductIndexControls({
  input,
  categories,
}: {
  input: ProductIndexInput;
  categories: string[];
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 sm:p-6">
      <form method="get" className="grid gap-4 lg:grid-cols-4">
        <label className="text-sm font-medium text-slate-700 lg:col-span-2">
          Search
          <input
            name="q"
            defaultValue={input.query}
            placeholder="Title, slug or category"
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-[#0064E0]"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Status
          <select
            name="status"
            defaultValue={input.status ?? ""}
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-[#0064E0]"
          >
            <option value="">All statuses</option>
            {PRODUCT_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Category
          <select
            name="category"
            defaultValue={input.category ?? ""}
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-[#0064E0]"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Featured
          <select
            name="featured"
            defaultValue={input.featured === undefined ? "" : String(input.featured)}
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-[#0064E0]"
          >
            <option value="">All</option>
            <option value="true">Featured</option>
            <option value="false">Not featured</option>
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Readiness
          <select
            name="readiness"
            defaultValue={input.readiness ?? ""}
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-[#0064E0]"
          >
            <option value="">All</option>
            <option value="ready">Ready</option>
            <option value="not-ready">Not ready</option>
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Asset
          <select
            name="asset"
            defaultValue={input.asset ?? ""}
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-[#0064E0]"
          >
            <option value="">All</option>
            <option value="published">Published</option>
            <option value="missing">Missing published asset</option>
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Active currency
          <select
            name="currency"
            defaultValue={input.currency ?? ""}
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-[#0064E0]"
          >
            <option value="">Any currency</option>
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>{currency}</option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Created from
          <input
            type="date"
            name="createdFrom"
            defaultValue={dateValue(input.created.from)}
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-[#0064E0]"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Created to
          <input
            type="date"
            name="createdTo"
            defaultValue={inclusiveToValue(input.created.toExclusive)}
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-[#0064E0]"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Updated from
          <input
            type="date"
            name="updatedFrom"
            defaultValue={dateValue(input.updated.from)}
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-[#0064E0]"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Updated to
          <input
            type="date"
            name="updatedTo"
            defaultValue={inclusiveToValue(input.updated.toExclusive)}
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-[#0064E0]"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Sort
          <select
            name="sort"
            defaultValue={input.sort}
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-[#0064E0]"
          >
            {PRODUCT_INDEX_SORTS.map((sort) => (
              <option key={sort} value={sort}>{SORT_LABELS[sort]}</option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Page size
          <select
            name="pageSize"
            defaultValue={String(input.pageSize)}
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-[#0064E0]"
          >
            {ADMIN_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>

        <div className="flex items-end gap-3 lg:col-span-2">
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-[#0064E0]"
          >
            Apply filters
          </button>
          <Link
            href="/admin/products"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear
          </Link>
        </div>
      </form>
    </section>
  );
}
