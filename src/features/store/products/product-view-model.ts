import type { CurrencyCode, Locale } from "../../../domain/constants.ts";
import { formatMoney } from "../../../domain/money.ts";
import type { PublicProduct } from "../catalogue/types.ts";

export type ProductViewModel = {
  id: string;
  slug: string;
  category: string;
  featured: boolean;
  title: string;
  shortDescription: string;
  description: string;
  imagePath: string;
  currency: CurrencyCode;
  amountMinor: number | null;
  formattedPrice: string | null;
  purchaseAvailable: boolean;
  businessBenefits: readonly string[];
  productivityBenefits: readonly string[];
};

export function toProductViewModel(
  product: PublicProduct,
  currency: CurrencyCode,
  locale: Locale,
): ProductViewModel {
  const amountMinor = product.prices[currency];
  const purchaseAvailable = amountMinor !== undefined;

  return {
    id: product.id,
    slug: product.slug,
    category: product.category,
    featured: product.featured,
    title: product.title,
    shortDescription: product.shortDescription,
    description: product.description ?? product.shortDescription,
    imagePath: product.imagePath ?? "/brand/vault-logo.png",
    currency,
    amountMinor: amountMinor ?? null,
    formattedPrice: purchaseAvailable ? formatMoney(amountMinor, currency, locale) : null,
    purchaseAvailable,
    businessBenefits: product.businessBenefits,
    productivityBenefits: product.productivityBenefits,
  };
}
