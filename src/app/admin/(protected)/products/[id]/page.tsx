import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/features/admin/shared/admin-page-header";
import { ProductEditor } from "@/features/admin/products/product-editor";
import { hasPermission } from "@/domain/permissions";
import { requireAdminPage } from "@/server/auth/admin-page";
import { getAdminProduct } from "@/server/admin/products-service";
import { getAdminProductMedia } from "@/server/media/media-service";

export default async function AdminProductPage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminPage("product.read");
  const { id } = await params;
  const product = await getAdminProduct(id);
  if (!product) notFound();
  const productMedia = await getAdminProductMedia(id);

  const serialized = {
    ...product,
    assets: product.assets.map((asset) => ({
      ...asset,
      sizeBytes: asset.sizeBytes.toString(),
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
      publishedAt: asset.publishedAt?.toISOString() ?? null,
    })),
  };
  const title = product.translations.find((item) => item.locale === "en")?.title ?? product.slug;

  return (
    <>
      <AdminPageHeader eyebrow="Product" title={title} description="Review catalogue information, public media, translations, prices and verified private R2 assets." />
      <ProductEditor
        product={serialized}
        productMedia={productMedia}
        canEditProduct={hasPermission(auth.user.role, "product.write")}
        canEditPrice={hasPermission(auth.user.role, "product.price.write")}
        canPublish={hasPermission(auth.user.role, "product.publish")}
      />
    </>
  );
}
