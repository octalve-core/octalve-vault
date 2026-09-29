import { hasPermission } from "@/domain/permissions";
import { ProductCreateForm } from "@/features/admin/products/product-create-form";
import { ProductIndexControls } from "@/features/admin/products/product-index-controls";
import { ProductList } from "@/features/admin/products/product-list";
import { AdminPageHeader } from "@/features/admin/shared/admin-page-header";
import {
  listAdminProductCategories,
  listAdminProducts,
} from "@/server/admin/products-service";
import { parseProductIndexParams } from "@/server/admin/products-index";
import { requireAdminPage } from "@/server/auth/admin-page";

type SearchParams = Record<string, string | string[] | undefined>;

function toUrlSearchParams(values: SearchParams): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }
  return params;
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { user } = await requireAdminPage("product.read");
  const params = toUrlSearchParams(await searchParams);
  const input = parseProductIndexParams(params);
  const [result, categories] = await Promise.all([
    listAdminProducts(input),
    listAdminProductCategories(),
  ]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Products"
        description="Search, filter and manage localized product copy, currency-specific prices and private versioned assets."
        action={
          hasPermission(user.role, "product.write") ? <ProductCreateForm /> : undefined
        }
      />
      <div className="mt-7 space-y-5">
        <ProductIndexControls input={input} categories={categories} />
        <ProductList result={result} queryString={params.toString()} />
      </div>
    </>
  );
}
