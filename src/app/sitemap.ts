import type { MetadataRoute } from "next";
import { publicEnv } from "@/config/env.public";
import { prisma } from "@/lib/prisma";
import { getCommerceSettings } from "@/server/settings/commerce-settings";

export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> { const base = publicEnv.appUrl.replace(/\/$/, ""); let slugs: string[] = []; try { slugs = (await prisma.product.findMany({ where: { status: "ACTIVE" }, select: { slug: true } })).map((item) => item.slug); } catch { slugs = []; } const settings = await getCommerceSettings(); const staticPaths = ["", "/products", "/privacy", "/terms", "/refund-policy", "/digital-product-license"]; return settings.enabledLocales.flatMap((locale) => [...staticPaths.map((path) => ({ url: `${base}/${locale}${path}`, lastModified: new Date(), changeFrequency: path === "" || path === "/products" ? "weekly" as const : "monthly" as const, priority: path === "" ? 1 : path === "/products" ? .9 : .3 })), ...slugs.map((slug) => ({ url: `${base}/${locale}/products/${slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: .7 }))]); }
