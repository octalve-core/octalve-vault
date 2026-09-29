export function slugifyProductTitle(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100)
    .replace(/-+$/g, "");
}

export function normalizeProductCategory(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function categoryKey(value: string): string {
  return normalizeProductCategory(value).toLocaleLowerCase("en-US");
}

export function filterProductCategories(
  categories: readonly string[],
  query: string,
): string[] {
  const needle = categoryKey(query);
  const seen = new Set<string>();
  return categories
    .map(normalizeProductCategory)
    .filter(Boolean)
    .filter((category) => {
      const key = categoryKey(category);
      if (seen.has(key)) return false;
      seen.add(key);
      return !needle || key.includes(needle);
    })
    .slice(0, 8);
}

export function canAddProductCategory(
  categories: readonly string[],
  query: string,
): boolean {
  const normalized = normalizeProductCategory(query);
  if (!normalized) return false;
  const key = categoryKey(normalized);
  return !categories.some((category) => categoryKey(category) === key);
}
