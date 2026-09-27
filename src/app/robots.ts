import type { MetadataRoute } from "next";
import { publicEnv } from "@/config/env.public";
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/en/vault", "/fr/vault", "/ar/vault", "/en/cart", "/fr/cart", "/ar/cart", "/en/checkout", "/fr/checkout", "/ar/checkout", "/en/payment", "/fr/payment", "/ar/payment"] }, sitemap: `${publicEnv.appUrl.replace(/\/$/, "")}/sitemap.xml` }; }
