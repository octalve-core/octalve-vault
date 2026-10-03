import {
  CURRENCIES,
  type CurrencyCode,
} from "../../../domain/constants.ts";
import { resolveEffectiveProductPrice } from "../../../domain/product-pricing.ts";
import type { PublicProductPrice } from "./types.ts";

const supportedCurrencies = new Set<string>(CURRENCIES);

function isCurrencyCode(value: string): value is CurrencyCode {
  return supportedCurrencies.has(value);
}

export function resolvePublicProductPrice(input: {
  amountMinor: number;
  saleAmountMinor: number | null;
}): PublicProductPrice | null {
  try {
    return resolveEffectiveProductPrice(input);
  } catch {
    return null;
  }
}

export function buildPublicPriceMaps(
  rows: readonly {
    currency: string;
    amountMinor: number;
    saleAmountMinor: number | null;
  }[],
): {
  prices: Partial<Record<CurrencyCode, number>>;
  priceDetails: Partial<Record<CurrencyCode, PublicProductPrice>>;
} {
  const prices: Partial<Record<CurrencyCode, number>> = {};
  const priceDetails: Partial<Record<CurrencyCode, PublicProductPrice>> = {};

  for (const row of rows) {
    if (!isCurrencyCode(row.currency)) continue;

    const resolved = resolvePublicProductPrice({
      amountMinor: row.amountMinor,
      saleAmountMinor: row.saleAmountMinor,
    });

    if (!resolved) continue;

    prices[row.currency] = resolved.effectiveAmountMinor;
    priceDetails[row.currency] = resolved;
  }

  return {
    prices,
    priceDetails,
  };
}
