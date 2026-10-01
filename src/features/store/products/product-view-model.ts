import type { CurrencyCode, Locale, ProductStatus } from "../../../domain/constants.ts";
import { formatMoney } from "../../../domain/money.ts";
import type { PublicProduct, PublicProductMedia } from "../catalogue/types.ts";

export type ProductViewModel = {
  id: string;
  slug: string;
  category: string;
  featured: boolean;
  status: ProductStatus;
  title: string;
  shortDescription: string;
  description: string;
  imagePath: string;
  cardImagePath: string;
  imageAlt: string;
  gallery: readonly PublicProductMedia[];
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
  const priceAvailable = amountMinor !== undefined;
  const purchaseAvailable = product.purchasable && priceAvailable;
  const imagePath = product.imagePath ?? "/brand/vault-logo.png";
  return {
    id: product.id,
    slug: product.slug,
    category: product.category,
    featured: product.featured,
    status: product.status,
    title: product.title,
    shortDescription: product.shortDescription,
    description: product.description ?? product.shortDescription,
    imagePath,
    cardImagePath: product.cardImagePath ?? imagePath,
    imageAlt: product.imageAlt ?? product.title,
    gallery: product.gallery ?? [],
    currency,
    amountMinor: amountMinor ?? null,
    formattedPrice: priceAvailable ? formatMoney(amountMinor, currency, locale) : null,
    purchaseAvailable,
    businessBenefits: product.businessBenefits,
    productivityBenefits: product.productivityBenefits,
  };
}
