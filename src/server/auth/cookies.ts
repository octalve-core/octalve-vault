export const ADMIN_SESSION_COOKIE = "octalve_admin_session";
export const CUSTOMER_SESSION_COOKIE = "octalve_vault_session";
export const CURRENCY_COOKIE = "octalve_currency";

export function secureSessionCookie(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
