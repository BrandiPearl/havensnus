import type { Metadata } from "next";
import { getBrands } from "@/lib/queries/products";
import { BrandTile } from "@/components/ui/brand-tile";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Nicotine Pouch Brands",
  description:
    "Every nicotine pouch brand we stock, from ZYN and VELO to PABLO, KILLA, CUBA and XQS. Delivered across Australia and New Zealand.",
  alternates: { canonical: "/brands" },
};

export default async function BrandsPage() {
  const brands = await getBrands();
  const sorted = [...brands].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="bg-white">
      <div className="border-b border-slate-200 bg-slate-50">
        <div className="container-wide py-12 lg:py-14">
          <p className="eyebrow">Brands</p>
          <h1 className="display-lg text-slate-900">Every brand we stock</h1>
          <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-slate-600">
            {brands.length} nicotine pouch brands, from household names to small Swedish makers.
          </p>
        </div>
      </div>

      <div className="container-wide py-10">
        {sorted.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">Brands are on their way. Check back soon.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
            {sorted.map((brand, i) => (
              <BrandTile key={brand.id} brand={brand} priority={i < 10} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
