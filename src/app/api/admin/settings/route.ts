import { NextResponse } from "next/server";
import { CURRENCIES, LOCALES } from "@/domain/constants";
import { prisma } from "@/lib/prisma";
import { getCommerceSettings } from "@/server/settings/commerce-settings";
import { requireAdminPermission } from "@/server/auth/admin-session";
import { adminError } from "@/server/admin/http";
import { writeAdminAudit } from "@/server/admin/audit";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireAdminPermission(request, "settings.read"); return NextResponse.json({ value: await getCommerceSettings() }); } catch (error) { return adminError(error); } }
export async function PUT(request: Request) {
  try {
    const auth = await requireAdminPermission(request, "settings.write"); const body = (await request.json()) as Record<string, unknown>;
    const defaultCurrency = typeof body.defaultCurrency === "string" ? body.defaultCurrency : ""; const defaultLocale = typeof body.defaultLocale === "string" ? body.defaultLocale : "";
    const enabledCurrencies = Array.isArray(body.enabledCurrencies) ? [...new Set(body.enabledCurrencies.filter((value): value is string => typeof value === "string"))] : [];
    const enabledLocales = Array.isArray(body.enabledLocales) ? [...new Set(body.enabledLocales.filter((value): value is string => typeof value === "string"))] : [];
    if (!(CURRENCIES as readonly string[]).includes(defaultCurrency) || !(LOCALES as readonly string[]).includes(defaultLocale)) throw new Error("Invalid default locale or currency.");
    if (!enabledCurrencies.length || enabledCurrencies.some((value) => !(CURRENCIES as readonly string[]).includes(value)) || !enabledCurrencies.includes(defaultCurrency)) throw new Error("Invalid enabled currencies.");
    if (!enabledLocales.length || enabledLocales.some((value) => !(LOCALES as readonly string[]).includes(value)) || !enabledLocales.includes(defaultLocale)) throw new Error("Invalid enabled locales.");
    const value = { defaultCurrency, defaultLocale, enabledCurrencies, enabledLocales };
    await prisma.storeSetting.upsert({ where: { key: "commerce" }, update: { value }, create: { key: "commerce", value } });
    await writeAdminAudit({ actorAdminId: auth.user.id, action: "STORE_SETTINGS_UPDATED", entityType: "StoreSetting", entityId: "commerce", metadata: value });
    return NextResponse.json({ value });
  } catch (error) { return adminError(error); }
}
