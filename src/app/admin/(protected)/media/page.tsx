import { AdminPageHeader } from "@/features/admin/shared/admin-page-header";
import { MediaLibrary } from "@/features/admin/media/media-library";
import { getAdminMediaSummary, listAdminMedia, parseMediaIndexParams } from "@/server/admin/media-index";
import { requireAdminPage } from "@/server/auth/admin-page";

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage("product.write");
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== undefined) params.set(key, value);
  }
  const input = parseMediaIndexParams(params);
  const [result, summary] = await Promise.all([
    listAdminMedia(input),
    getAdminMediaSummary(),
  ]);
  return (
    <>
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Media Library"
        description="Manage public merchandising images separately from private downloadable product files."
      />
      <div className="mt-7">
        <MediaLibrary
          items={result.items}
          summary={summary}
          meta={result.meta}
          query={input.q}
          status={input.status}
          usage={input.usage}
          sort={input.sort}
        />
      </div>
    </>
  );
}
