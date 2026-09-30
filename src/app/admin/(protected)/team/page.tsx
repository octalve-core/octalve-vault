import { hasPermission } from "@/domain/permissions";
import { AdminIndexResults } from "@/features/admin/shared/admin-index-results";
import { AdminPageHeader } from "@/features/admin/shared/admin-page-header";
import { TeamIndexControls } from "@/features/admin/shared/admin-resource-controls";
import { TeamSummary } from "@/features/admin/shared/admin-resource-summaries";
import { toAdminUrlSearchParams } from "@/features/admin/shared/admin-search-params";
import { TeamManager } from "@/features/admin/team/team-manager";
import { parseTeamIndexParams } from "@/server/admin/team-index";
import {
  getAdminTeamSummary,
  listAdminTeam,
} from "@/server/admin/team-service";
import { requireAdminPage } from "@/server/auth/admin-page";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminTeamPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { user } = await requireAdminPage("admin.read");
  const params = toAdminUrlSearchParams(await searchParams);
  const input = parseTeamIndexParams(params);
  const [result, summary] = await Promise.all([
    listAdminTeam(input),
    getAdminTeamSummary(),
  ]);
  const users = result.items.map((item) => ({
    ...item,
    lastLoginAt: item.lastLoginAt?.toISOString() ?? null,
  }));

  return (
    <>
      <AdminPageHeader eyebrow="Access control" title="Team" description="Role-based administration with revocable server-side sessions." />
      <div className="mt-7 space-y-5">
        <TeamSummary summary={summary} />
        <TeamIndexControls input={input} />
        <AdminIndexResults basePath="/admin/team" queryString={params.toString()} meta={result.meta} activeFilters={result.activeFilters} noun="team members">
          <TeamManager users={users} canWrite={hasPermission(user.role, "admin.write")} />
        </AdminIndexResults>
      </div>
    </>
  );
}
