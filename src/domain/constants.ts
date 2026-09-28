export const LOCALES = ["en", "fr", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const CURRENCIES = ["NGN", "USD", "GBP", "EUR"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export const PAYMENT_PROVIDERS = ["PAYSTACK", "FLUTTERWAVE"] as const;
export type PaymentProviderId = (typeof PAYMENT_PROVIDERS)[number];

export const PAYMENT_ENVIRONMENTS = ["TEST", "LIVE"] as const;
export type PaymentEnvironment = (typeof PAYMENT_ENVIRONMENTS)[number];

export const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "CATALOG_MANAGER",
  "SUPPORT",
  "AUDITOR",
] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "COMING_SOON", "ARCHIVED"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const ASSET_STATUSES = ["UPLOADING", "READY", "PUBLISHED", "RETIRED", "FAILED"] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];
