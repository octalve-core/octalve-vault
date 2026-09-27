import { redirect } from "next/navigation";
import { getCommerceSettings } from "@/server/settings/commerce-settings";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const settings = await getCommerceSettings();
  redirect(`/${settings.defaultLocale}`);
}
