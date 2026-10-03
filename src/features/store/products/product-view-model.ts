import type {
  CurrencyCode,
  Locale,
  ProductStatus,
} from "../../../domain/constants.ts";
import { formatMoney } from "../../../domain/money.ts";
import type { PublicProduct } from "../catalogue/types.ts";

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
  gallery: NonNullable<PublicProduct["gallery"]>;
  currency: CurrencyCode;
  locale: Locale;

  regularAmountMinor: number | null;
  saleAmountMinor: number | null;
  effectiveAmountMinor: number | null;

  formattedRegularPrice: string | null;
  formattedEffectivePrice: string | null;

  discountPercent: number | null;
  isOnSale: boolean;

  // Compatibility aliases remain effective-price aliases.
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
  const imagePath =
    product.imagePath ??
    "/brand/vault-logo.png";

  const cardImagePath =
    product.cardImagePath ??
    imagePath;

  const imageAlt =
    product.imageAlt ??
    product.title;

  const gallery =
    product.gallery ??
    [];

  const detail = product.priceDetails?.[currency];
  const compatibilityAmount = product.prices[currency];

  const effectiveAmountMinor =
    detail?.effectiveAmountMinor ??
    compatibilityAmount ??
    null;

  const regularAmountMinor =
    detail?.regularAmountMinor ??
    effectiveAmountMinor;

  const saleAmountMinor =
    detail?.saleAmountMinor ??
    null;

  const discountPercent =
    detail?.discountPercent ??
    null;

  const isOnSale =
    detail?.isOnSale === true;

  const priceAvailable =
    effectiveAmountMinor !== null;

  const purchaseAvailable =
    product.purchasable && priceAvailable;

  const formattedRegularPrice =
    regularAmountMinor === null
      ? null
      : formatMoney(
          regularAmountMinor,
          currency,
          locale,
        );

  const formattedEffectivePrice =
    effectiveAmountMinor === null
      ? null
      : formatMoney(
          effectiveAmountMinor,
          currency,
          locale,
        );

  return {
    id: product.id,
    slug: product.slug,
    category: product.category,
    featured: product.featured,
    status: product.status,
    title: product.title,
    shortDescription: product.shortDescription,
    description:
      product.description ??
      product.shortDescription,
    imagePath,
    cardImagePath,
    imageAlt,
    gallery,
    currency,
    locale,

    regularAmountMinor,
    saleAmountMinor,
    effectiveAmountMinor,

    formattedRegularPrice,
    formattedEffectivePrice,

    discountPercent,
    isOnSale,

    amountMinor: effectiveAmountMinor,
    formattedPrice: formattedEffectivePrice,

    purchaseAvailable,
    businessBenefits: product.businessBenefits,
    productivityBenefits:
      product.productivityBenefits,
  };
}
