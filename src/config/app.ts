import type { CurrencyCode, Locale } from "../domain/constants";

export const APP_NAME = "Octalve Vault";
export const DEFAULT_LOCALE: Locale = "en";
export const DEFAULT_CURRENCY: CurrencyCode = "NGN";
export const CUSTOMER_SESSION_TTL_SECONDS = 60 * 60 * 12;
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8;
export const DOWNLOAD_TICKET_TTL_SECONDS = 60 * 3;
export const OTP_TTL_SECONDS = 60 * 10;
export const OTP_MAX_ATTEMPTS = 6;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
