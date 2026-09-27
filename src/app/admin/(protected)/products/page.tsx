import { AdminPageHeader } from "@/features/admin/shared/admin-page-header";
import { ProductCreateForm } from "@/features/admin/products/product-create-form";
import { ProductList } from "@/features/admin/products/product-list";
import { requireAdminPage } from "@/server/auth/admin-page";
import { listAdminProducts } from "@/server/admin/products-service";
import { hasPermission } from "@/domain/permissions";

export default async function AdminProductsPage() {
  const { user } = await requireAdminPage("product.read");
  const products = await listAdminProducts();
  return <><AdminPageHeader eyebrow="Catalogue" title="Products" description="Manage localized product copy, currency-specific prices and private versioned assets." action={hasPermission(user.role, "product.write") ? <ProductCreateForm /> : undefined} /><div className="mt-7"><ProductList products={products} /></div></>;
}
