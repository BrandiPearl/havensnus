import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductsClient } from "./products-client";
import { ProductCard } from "@/components/ui/product-card";
import { getBrands, getProducts } from "@/lib/queries/products";
import type { Product } from "@/types";

export const metadata: Metadata = {
  title: "Shop Nicotine Pouches | ZYN, VELO, PABLO & More",
  description:
    "Shop 30+ nicotine pouch brands by strength, flavour and format. Tracked delivery across Australia and New Zealand.",
  alternates: { canonical: "/products" },
};

// Cached and shared by every visitor; refreshed every 10 minutes or when the CMS saves.
export const revalidate = 600;

/** Only what a card and the filters need, to keep the cached page small. */
function lean(p: Product): Product {
  return {
    ...p,
    description: "",
    short_description: "",
    tags: [],
    features: [],
    seo: undefined,
    updated_at: "",
    images: p.images.slice(0, 1).map((img) => ({ ...img, id: "" })),
  };
}

export default async function ProductsPage() {
  const [products, brands] = await Promise.all([getProducts(), getBrands()]);
  const catalog = products.map(lean);

  return (
    // The filters read the URL in the browser, so the server renders this
    // fallback (heading and first page of products) into the cached HTML.
    <Suspense fallback={<ProductsFallback products={catalog} />}>
      <ProductsClient products={catalog} brands={brands} />
    </Suspense>
  );
}

function ProductsFallback({ products }: { products: Product[] }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-200 bg-slate-50">
        <div className="container-wide py-12 lg:py-14">
          <p className="eyebrow">Shop</p>
          <h1 className="display-lg text-slate-900">Nicotine Pouches</h1>
          <p className="spec mt-5 text-[0.8125rem] uppercase tracking-[0.14em] text-slate-500">
            {products.length} products
          </p>
        </div>
      </div>
      <div className="container-wide py-8">
        <div className="flex gap-8">
          <div className="hidden w-60 flex-shrink-0 lg:block" />
          <div className="min-w-0 flex-1">
            <div className="mb-6 h-10" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
              {products.slice(0, 48).map((product, i) => (
                <ProductCard key={product.id} product={product} priority={i < 8} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
