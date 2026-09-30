import Link from "next/link";
import type { ReactNode } from "react";

import type {
  ResourceIndexActiveFilter,
  ResourceIndexMeta,
} from "@/server/admin/resource-index";
import { adminIndexHref } from "./admin-search-params";

export function AdminIndexResults({
  basePath,
  queryString,
  meta,
  activeFilters,
  noun,
  children,
}: {
  basePath: string;
  queryString: string;
  meta: ResourceIndexMeta;
  activeFilters: ResourceIndexActiveFilter[];
  noun: string;
  children: ReactNode;
}) {
  const first = meta.total > 0 ? (meta.page - 1) * meta.pageSize + 1 : 0;
  const last = meta.total > 0 ? Math.min(first + meta.pageSize - 1, meta.total) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Showing {first}-{last} of{" "}
          <span className="font-medium text-slate-900">{meta.total}</span>{" "}
          {noun}
        </p>

        {activeFilters.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <Link
                key={`${filter.key}:${filter.value}`}
                href={adminIndexHref(basePath, queryString, {
                  removeParams: filter.params,
                  resetPage: true,
                })}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300"
              >
                {filter.label}: {filter.value} ×
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {children}

      {meta.totalPages > 1 ? (
        <nav
          className="flex items-center justify-between gap-3"
          aria-label={`${noun} pagination`}
        >
          {meta.page > 1 ? (
            <Link
              href={adminIndexHref(basePath, queryString, {
                page: meta.page - 1,
              })}
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
              href={adminIndexHref(basePath, queryString, {
                page: meta.page + 1,
              })}
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
