import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/cms/admin-page-header";
import { ProductForm } from "@/components/cms/product-form";
import { getAdminBrands } from "@/lib/queries/cms";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const brands = await getAdminBrands();
  return (
    <div>
      <AdminPageHeader
        backHref="/admin/products"
        backLabel="Back to products"
        title="Add product"
        description="Add a new can with photos, strength and pricing."
      />
      <ProductForm brands={brands} />
    </div>
  );
}
