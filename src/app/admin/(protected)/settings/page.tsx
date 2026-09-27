import { SettingsForm } from "@/features/admin/settings/settings-form";
import { AdminPageHeader } from "@/features/admin/shared/admin-page-header";
import { requireAdminPage } from "@/server/auth/admin-page";
import { hasPermission } from "@/domain/permissions";
import { getCommerceSettings } from "@/server/settings/commerce-settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const { user } = await requireAdminPage("settings.read");
  const value = await getCommerceSettings();
  return (
    <>
      <AdminPageHeader eyebrow="Configuration" title="Store settings" description="Operational commerce settings live in the database; secrets remain only in deployment environment variables." />
      <div className="mt-7"><SettingsForm value={value} canWrite={hasPermission(user.role, "settings.write")} /></div>
    </>
  );
}
