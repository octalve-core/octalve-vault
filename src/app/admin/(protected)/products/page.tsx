import Link from "next/link";

import { hasPermission } from "@/domain/permissions";
import { ProductIndexControls } from "@/features/admin/products/product-index-controls";
import { ProductList } from "@/features/admin/products/product-list";
import { ProductSummary } from "@/features/admin/products/product-summary";
import { AdminPageHeader } from "@/features/admin/shared/admin-page-header";
import { toAdminUrlSearchParams } from "@/features/admin/shared/admin-search-params";
import { parseProductIndexParams } from "@/server/admin/products-index";
import {
  getAdminProductSummary,
  listAdminProductCategories,
  listAdminProducts,
} from "@/server/admin/products-service";
import { requireAdminPage } from "@/server/auth/admin-page";

type SearchParams = Record<
  string,
  string | string[] | undefined
>;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { user } = await requireAdminPage("product.read");
  const params = toAdminUrlSearchParams(await searchParams);
  const input = parseProductIndexParams(params);

  const [result, categories, summary] = await Promise.all([
    listAdminProducts(input),
    listAdminProductCategories(),
    getAdminProductSummary(),
  ]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Products"
        description="Search, filter and manage localized product copy, currency-specific prices and private versioned assets."
        action={
          hasPermission(user.role, "product.write") ? (
            <Link
              href="/admin/products/new"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-[#0064E0]"
            >
              New product
            </Link>
          ) : undefined
        }
      />

      <div className="mt-7 space-y-5">
        <ProductSummary summary={summary} />
        <ProductIndexControls
          input={input}
          categories={categories}
        />
        <ProductList
          result={result}
          queryString={params.toString()}
        />
      </div>
    </>
  );
}
