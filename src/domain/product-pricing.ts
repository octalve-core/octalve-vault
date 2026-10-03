export type EffectiveProductPrice = {
  regularAmountMinor: number;
  saleAmountMinor: number | null;
  effectiveAmountMinor: number;
  discountPercent: number | null;
  isOnSale: boolean;
};

export function resolveEffectiveProductPrice(input: {
  amountMinor: number;
  saleAmountMinor?: number | null;
}): EffectiveProductPrice {
  if (!Number.isSafeInteger(input.amountMinor) || input.amountMinor < 0) {
    throw new Error("Regular price must be a non-negative safe integer in minor units.");
  }

  const saleAmountMinor = input.saleAmountMinor ?? null;
  if (saleAmountMinor === null) {
    return {
      regularAmountMinor: input.amountMinor,
      saleAmountMinor: null,
      effectiveAmountMinor: input.amountMinor,
      discountPercent: null,
      isOnSale: false,
    };
  }

  if (
    !Number.isSafeInteger(saleAmountMinor) ||
    saleAmountMinor <= 0 ||
    saleAmountMinor >= input.amountMinor
  ) {
    throw new Error("Sale price must be a positive safe integer below the regular price.");
  }

  return {
    regularAmountMinor: input.amountMinor,
    saleAmountMinor,
    effectiveAmountMinor: saleAmountMinor,
    discountPercent: Math.round(
      ((input.amountMinor - saleAmountMinor) * 100) / input.amountMinor,
    ),
    isOnSale: true,
  };
}
