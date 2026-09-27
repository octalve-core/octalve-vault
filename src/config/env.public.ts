export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://vault.octalve.com",
  downloadsUrl:
    process.env.NEXT_PUBLIC_DOWNLOADS_URL || "https://downloads.octalve.com",
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
} as const;
