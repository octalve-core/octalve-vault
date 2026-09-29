import Link from "next/link";

import type {
  ProductIndexResult,
  ProductIndexActiveFilter,
} from "@/server/admin/products-index";
import { AdminEmpty } from "../shared/admin-empty";

type ProductRow = {
  id: string;
  slug: string;
  category: string;
  status: string;
  featured: boolean;
  translations: Array<{ locale: string; title: string }>;
  prices: Array<{ currency: string; amountMinor: number; isActive: boolean }>;
  assets: Array<{ version: number; status: string }>;
};

const FILTER_PARAMS: Record<string, string[]> = {
  query: ["q"],
  status: ["status"],
  category: ["category"],
  featured: ["featured"],
  readiness: ["readiness"],
  asset: ["asset"],
  currency: ["currency"],
  created: ["createdFrom", "createdTo"],
  updated: ["updatedFrom", "updatedTo"],
};

function queryHref(
  queryString: string,
  mutate: (params: URLSearchParams) => void,
): string {
  const params = new URLSearchParams(queryString);
  mutate(params);
  const next = params.toString();
  return next ? `/admin/products?${next}` : "/admin/products";
}

function filterHref(queryString: string, filter: ProductIndexActiveFilter): string {
  return queryHref(queryString, (params) => {
    for (const key of FILTER_PARAMS[filter.key] ?? [filter.key]) params.delete(key);
    params.delete("page");
  });
}

function pageHref(queryString: string, page: number): string {
  return queryHref(queryString, (params) => {
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
  });
}

export function ProductList({
  result,
  queryString,
}: {
  result: ProductIndexResult<ProductRow>;
  queryString: string;
}) {
  const { items, meta } = result;
  const first = items.length > 0 ? (meta.page - 1) * meta.pageSize + 1 : 0;
  const last = items.length > 0 ? first + items.length - 1 : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Showing {first}-{last} of <span className="font-medium text-slate-900">{result.meta.total}</span> products
        </p>
        {result.activeFilters.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {result.activeFilters.map((filter) => (
              <Link
                key={filter.key}
                href={filterHref(queryString, filter)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300"
              >
                {filter.label}: {filter.value} ×
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {items.length === 0 ? (
        <AdminEmpty
          title="No matching products"
          description="Adjust the current search or filters, or create a new Vault product."
        />
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[.1em] text-slate-400">
                <tr>
                  <th className="px-5 py-4">Product</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Prices</th>
                  <th className="px-5 py-4">Asset</th>
                  <th className="px-5 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((product) => {
                  const title =
                    product.translations.find((item) => item.locale === "en")?.title ??
                    product.slug;
                  const asset = product.assets[0];
                  return (
                    <tr key={product.id}>
                      <td className="px-5 py-5">
                        <p className="font-medium text-slate-950">{title}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {product.id} · {product.category}
                        </p>
                      </td>
                      <td className="px-5 py-5">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          {product.status}
                        </span>
                      </td>
                      <td className="px-5 py-5 text-slate-600">
                        {product.prices
                          .filter((item) => item.isActive)
                          .map((item) => item.currency)
                          .join(", ") || "Not priced"}
                      </td>
                      <td className="px-5 py-5 text-slate-600">
                        {asset ? `v${asset.version} · ${asset.status}` : "No asset"}
                      </td>
                      <td className="px-5 py-5 text-right">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="font-medium text-[#0064E0]"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {meta.totalPages > 1 ? (
        <nav className="flex items-center justify-between gap-3" aria-label="Product pagination">
          {meta.page > 1 ? (
            <Link
              href={pageHref(queryString, meta.page - 1)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-slate-500">
            Page {meta.page} of {meta.totalPages}
          </span>
          {meta.page < meta.totalPages ? (
            <Link
              href={pageHref(queryString, meta.page + 1)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Next
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
