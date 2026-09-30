export type AdminSearchParamsRecord = Record<
  string,
  string | string[] | undefined
>;

export function toAdminUrlSearchParams(
  values: AdminSearchParamsRecord,
): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }

  return params;
}

export function adminIndexHref(
  basePath: string,
  queryString: string,
  options: {
    removeParams?: readonly string[];
    page?: number;
    resetPage?: boolean;
  },
): string {
  const params = new URLSearchParams(queryString);

  for (const key of options.removeParams ?? []) {
    params.delete(key);
  }

  if (options.resetPage) {
    params.delete("page");
  }

  if (options.page !== undefined) {
    if (options.page <= 1) params.delete("page");
    else params.set("page", String(options.page));
  }

  const next = params.toString();
  return next ? `${basePath}?${next}` : basePath;
}
