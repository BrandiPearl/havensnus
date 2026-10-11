import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/ui/product-card";
import { getFeaturedProducts } from "@/lib/queries/products";

export async function FeaturedProducts() {
  const featured = await getFeaturedProducts(8);
  if (featured.length === 0) return null;

  return (
    <section className="section-block border-t border-slate-200">
      <div className="container-wide">
        <div className="section-intro flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div>
            <p className="eyebrow">Top sellers</p>
            <h2 className="section-heading">Customer favourites</h2>
            <p className="section-subheading">
              The cans our customers reorder most, in stock and ready to ship.
            </p>
          </div>
          <Link href="/products" className="link-arrow hidden sm:inline-flex">
            Shop all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {featured.map((product, i) => (
            <ProductCard key={product.id} product={product} priority={i < 4} />
          ))}
        </div>

        <div className="mt-8 sm:hidden">
          <Link href="/products" className="btn-secondary w-full">
            View all products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
