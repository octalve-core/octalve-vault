import type { CurrencyCode } from "@/domain/constants";

export type PublicProduct = {
  id: string;
  slug: string;
  category: string;
  imagePath: string | null;
  featured: boolean;
  title: string;
  shortDescription: string;
  description: string | null;
  businessBenefits: string[];
  productivityBenefits: string[];
  prices: Partial<Record<CurrencyCode, number>>;
};
