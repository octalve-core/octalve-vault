import type { CurrencyCode, ProductStatus } from "@/domain/constants";

export type PublicProduct = {
  id: string;
  slug: string;
  category: string;
  imagePath: string | null;
  featured: boolean;
  status: ProductStatus;
  purchasable: boolean;
  title: string;
  shortDescription: string;
  description: string | null;
  businessBenefits: string[];
  productivityBenefits: string[];
  prices: Partial<Record<CurrencyCode, number>>;
};
