import type { ParsedDateRange, ResourceIndexActiveFilter } from "./resource-index.ts";

export function optionalEnumParam<T extends string>(
  value: string | null,
  allowed: readonly T[],
  message: string,
): T | undefined {
  if (!value) return undefined;
  if (!(allowed as readonly string[]).includes(value)) throw new Error(message);
  return value as T;
}

export function optionalBooleanParam(
  value: string | null,
  message: string,
): boolean | undefined {
  if (!value) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(message);
}

export function rangeWhere(
  range: ParsedDateRange,
): { gte?: Date; lt?: Date } | undefined {
  if (!range.from && !range.toExclusive) return undefined;
  return {
    ...(range.from ? { gte: range.from } : {}),
    ...(range.toExclusive ? { lt: range.toExclusive } : {}),
  };
}

export function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function dateRangeFilter(
  key: string,
  label: string,
  params: [string, string],
  range: ParsedDateRange,
): ResourceIndexActiveFilter | undefined {
  if (!range.from && !range.toExclusive) return undefined;
  return {
    key,
    label,
    value: `${range.from ? dateOnly(range.from) : "…"} – ${
      range.toExclusive
        ? dateOnly(new Date(range.toExclusive.getTime() - 86_400_000))
        : "…"
    }`,
    params,
  };
}
