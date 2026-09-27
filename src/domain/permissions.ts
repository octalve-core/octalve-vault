import type { AdminRole } from "./constants.ts";

export const PERMISSIONS = [
  "dashboard.read",
  "product.read",
  "product.write",
  "product.price.write",
  "product.publish",
  "order.read",
  "payment.read",
  "customer.read",
  "download.read",
  "download.revoke",
  "download.resend",
  "refund.read",
  "refund.create",
  "marketing.read",
  "marketing.write",
  "admin.read",
  "admin.write",
  "audit.read",
  "settings.read",
  "settings.write",
  "security.read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<AdminRole, readonly Permission[]> = {
  SUPER_ADMIN: PERMISSIONS,
  ADMIN: [
    "dashboard.read",
    "product.read",
    "product.write",
    "product.price.write",
    "product.publish",
    "order.read",
    "payment.read",
    "customer.read",
    "download.read",
    "download.revoke",
    "download.resend",
    "refund.read",
    "refund.create",
    "marketing.read",
    "marketing.write",
    "audit.read",
    "settings.read",
  ],
  CATALOG_MANAGER: [
    "dashboard.read",
    "product.read",
    "product.write",
    "product.price.write",
    "product.publish",
  ],
  SUPPORT: [
    "dashboard.read",
    "product.read",
    "order.read",
    "payment.read",
    "customer.read",
    "download.read",
    "download.revoke",
    "download.resend",
    "refund.read",
  ],
  AUDITOR: [
    "dashboard.read",
    "product.read",
    "order.read",
    "payment.read",
    "customer.read",
    "download.read",
    "refund.read",
    "marketing.read",
    "audit.read",
    "settings.read",
    "security.read",
  ],
};

export function permissionsForRole(role: AdminRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function hasPermission(role: AdminRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
