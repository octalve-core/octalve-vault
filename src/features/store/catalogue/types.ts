import type { CurrencyCode, ProductStatus } from "@/domain/constants";

export type PublicProductMedia = {
  id: string;
  imagePath: string;
  thumbnailPath: string;
  altText: string;
  position: number;
};

export type PublicProductPrice = {
  regularAmountMinor: number;
  saleAmountMinor: number | null;
  effectiveAmountMinor: number;
  discountPercent: number | null;
  isOnSale: boolean;
};

export type PublicProduct = {
  id: string;
  slug: string;
  category: string;
  imagePath: string | null;
  cardImagePath?: string | null;
  imageAlt?: string;
  gallery?: PublicProductMedia[];
  featured: boolean;
  status: ProductStatus;
  purchasable: boolean;
  title: string;
  shortDescription: string;
  description: string | null;
  businessBenefits: string[];
  productivityBenefits: string[];
  prices: Partial<Record<CurrencyCode, number>>;
  priceDetails?: Partial<Record<CurrencyCode, PublicProductPrice>>;
};
