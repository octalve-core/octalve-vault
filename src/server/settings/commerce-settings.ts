import { resolveCommerceSettings } from "../../domain/commerce-settings.ts";
export type { CommerceSettings } from "../../domain/commerce-settings.ts";

export async function getCommerceSettings() {
  const { prisma } = await import("../../lib/prisma");
  const setting = await prisma.storeSetting.findUnique({ where: { key: "commerce" }, select: { value: true } });
  return resolveCommerceSettings(setting?.value ?? null);
}
