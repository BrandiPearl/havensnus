import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductsClient } from "./products-client";
import { getBrands, getProducts } from "@/lib/queries/products";

export const metadata: Metadata = {
  title: "Shop Nicotine Pouches | ZYN, VELO, PABLO & More",
  description:
    "Shop 30+ nicotine pouch brands by strength, flavour and format. Tracked delivery across Australia and New Zealand.",
  alternates: { canonical: "/products" },
};

export default async function ProductsPage() {
  const [products, brands] = await Promise.all([getProducts(), getBrands()]);

  return (
    <Suspense fallback={<ProductsSkeleton />}>
      <ProductsClient products={products} brands={brands} />
    </Suspense>
  );
}

function ProductsSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-200 bg-slate-50">
        <div className="container-wide py-14">
          <div className="h-10 w-72 animate-pulse rounded-md bg-slate-200" />
          <div className="mt-4 h-4 w-28 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
      <div className="container-wide py-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-lg border border-slate-200">
              <div className="aspect-square bg-slate-100" />
              <div className="space-y-2 p-4">
                <div className="h-3 w-16 rounded bg-slate-100" />
                <div className="h-4 w-full rounded bg-slate-100" />
                <div className="mt-3 h-5 w-20 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
