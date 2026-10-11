import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getBrands } from "@/lib/queries/products";
import { BrandTile } from "@/components/ui/brand-tile";

export async function BrandsGrid() {
  const brands = await getBrands();
  if (brands.length === 0) return null;
  const featured = brands.filter((b) => b.is_featured).slice(0, 8);
  const shown = featured.length >= 4 ? featured : brands.slice(0, 8);

  return (
    <section className="section-block">
      <div className="container-wide">
        <div className="section-intro flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div>
            <p className="eyebrow">Shop by brand</p>
            <h2 className="section-heading">The brands you know</h2>
          </div>
          <p className="max-w-sm text-[0.9375rem] leading-relaxed text-slate-600">
            {brands.length} brands from Sweden and beyond, from everyday ZYN to
            extreme-strength PABLO and KILLA.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {shown.map((brand, i) => (
            <BrandTile key={brand.id} brand={brand} priority={i < 4} />
          ))}
        </div>

        <div className="mt-8 border-t border-slate-200 pt-5">
          <Link href="/brands" className="link-arrow">
            See all {brands.length} brands
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
