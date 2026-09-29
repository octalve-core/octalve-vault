import Link from "next/link";

import { ProductCreatePageForm } from "@/features/admin/products/product-create-page-form";
import { AdminPageHeader } from "@/features/admin/shared/admin-page-header";
import { listAdminProductCategories } from "@/server/admin/products-service";
import { requireAdminPage } from "@/server/auth/admin-page";

export default async function NewAdminProductPage() {
  await requireAdminPage("product.write");
  const categories = await listAdminProductCategories();

  return (
    <>
      <AdminPageHeader
        eyebrow="Catalogue"
        title="New product"
        description="Create the draft product identity first. Localized copy, prices and private assets can be completed from the product editor after creation."
        action={
          <Link
            href="/admin/products"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to products
          </Link>
        }
      />
      <div className="mt-7 max-w-3xl">
        <ProductCreatePageForm categories={categories} />
      </div>
    </>
  );
}
