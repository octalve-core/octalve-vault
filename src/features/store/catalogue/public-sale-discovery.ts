import type { CurrencyCode } from "../../../domain/constants.ts";
import type { PublicProduct } from "./types.ts";

export function filterPublicProductsOnSale(
  products: readonly PublicProduct[],
  currency: CurrencyCode | null,
): PublicProduct[] {
  if (!currency) return [];

  return products.filter(
    (product) =>
      product.priceDetails?.[currency]?.isOnSale === true,
  );
}
