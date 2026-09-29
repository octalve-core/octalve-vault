export const ADMIN_PAGE_SIZES = [10, 25, 50, 100] as const;
export type AdminPageSize = (typeof ADMIN_PAGE_SIZES)[number];

export type ResourceIndexBase<TSort extends string> = {
  query: string;
  page: number;
  pageSize: AdminPageSize;
  sort: TSort;
};

export type ParsedDateRange = {
  from?: Date;
  toExclusive?: Date;
};

export type ResourceIndexMeta = {
  page: number;
  pageSize: AdminPageSize;
  total: number;
  totalPages: number;
};

export function normalizeSearchText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, 200);
}

export function parsePage(value: unknown): number {
  const parsed = typeof value === "string" || typeof value === "number" ? Number(value) : NaN;
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

export function parsePageSize(value: unknown): AdminPageSize {
  const parsed = typeof value === "string" || typeof value === "number" ? Number(value) : NaN;
  return (ADMIN_PAGE_SIZES as readonly number[]).includes(parsed) ? (parsed as AdminPageSize) : 25;
}

export function parseSort<TSort extends string>(
  value: unknown,
  allowed: readonly TSort[],
  fallback: TSort,
): TSort {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as TSort)
    : fallback;
}

function parseDateOnly(value: unknown): Date | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Invalid date filter.");
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("Invalid date filter.");
  }
  return date;
}

export function parseDateRange(from: unknown, to: unknown): ParsedDateRange {
  const parsedFrom = parseDateOnly(from);
  const parsedTo = parseDateOnly(to);
  const toExclusive = parsedTo
    ? new Date(parsedTo.getTime() + 24 * 60 * 60 * 1000)
    : undefined;

  if (parsedFrom && toExclusive && parsedFrom.getTime() >= toExclusive.getTime()) {
    throw new Error("Invalid date range.");
  }

  return { from: parsedFrom, toExclusive };
}

export function paginationMeta(
  page: number,
  pageSize: AdminPageSize,
  total: number,
): ResourceIndexMeta {
  if (!Number.isSafeInteger(total) || total < 0) throw new Error("Invalid result count.");
  return {
    page,
    pageSize,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
  };
}
