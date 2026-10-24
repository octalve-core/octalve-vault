import { redirect } from "next/navigation";
import { DEFAULT_COMMERCE_SETTINGS } from "@/domain/commerce-settings";
import { getCommerceSettings } from "@/server/settings/commerce-settings";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  let settings = DEFAULT_COMMERCE_SETTINGS;
  try {
    settings = await getCommerceSettings();
  } catch {
    // Keep the public shell reachable while the database is temporarily unavailable.
  }
  redirect(`/${settings.defaultLocale}`);
}
