import Link from "next/link";
import { getBrands, getFeaturedProducts } from "@/lib/queries/products";
import { getSiteSettings } from "@/lib/queries/settings";
import { HeroCopy } from "@/components/sections/hero-copy";
import { ProductPhoto } from "@/components/ui/product-photo";
import { Price } from "@/components/currency/price";

/**
 * Ink hero: display type on the left, a loose stack of in-stock cans on the
 * right, and a spec rail at the base. Packshots sit on white tiles because
 * half the catalogue photography has a white (not transparent) background.
 */
export async function Hero() {
  const [brands, featured, settings] = await Promise.all([
    getBrands(),
    getFeaturedProducts(4),
    getSiteSettings(),
  ]);
  const productCount = brands.reduce((sum, b) => sum + (b.product_count ?? 0), 0);

  const stats: { label: string; value: React.ReactNode; unit?: string }[] = [
    { label: "Brands", value: brands.length || "30", unit: "+" },
    { label: "Products", value: productCount || "490", unit: "" },
    { label: "Delivering to", value: "AU · NZ" },
    {
      label: "Free shipping from",
      value:
        settings.free_shipping_threshold > 0 ? (
          <Price amount={settings.free_shipping_threshold} />
        ) : (
          "Always"
        ),
    },
  ];

  return (
    <section className="relative isolate overflow-hidden bg-slate-900">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60rem 36rem at 85% 10%, rgba(19,128,108,0.42), transparent 60%), radial-gradient(40rem 30rem at 0% 100%, rgba(19,128,108,0.16), transparent 60%)",
        }}
      />

      <div className="container-wide grid items-center gap-10 pb-12 pt-14 sm:pt-16 lg:grid-cols-12 lg:gap-8 lg:pb-16 lg:pt-20">
        <div className="lg:col-span-7">
          <HeroCopy />
        </div>

        {featured.length > 0 && (
          <div className="lg:col-span-5">
            <div className="mx-auto grid max-w-md grid-cols-2 gap-3 sm:gap-4 lg:max-w-none">
              {featured.slice(0, 4).map((product, i) => (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  className={[
                    "group relative block overflow-hidden rounded-2xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.35)] transition-transform duration-300 hover:-translate-y-1",
                    i % 2 === 1 ? "translate-y-6" : "",
                  ].join(" ")}
                  style={{ aspectRatio: "1 / 1" }}
                >
                  <ProductPhoto
                    src={product.images[0]?.url}
                    alt={product.images[0]?.alt || product.name}
                    name={product.name}
                    priority
                  />
                  <span className="spec absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/90 to-transparent px-3 pb-2.5 pt-6 text-[0.625rem] tracking-[0.08em] text-slate-600">
                    {product.brand_name} · {product.strength_mg}mg
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative border-t border-white/12 bg-slate-900/35">
        <div className="container-wide">
          <dl className="grid grid-cols-2 sm:grid-cols-4">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={[
                  "py-4 sm:py-5",
                  i % 2 === 1 ? "pl-6 border-l border-white/12" : "",
                  i > 0 ? "sm:pl-8 sm:border-l sm:border-white/12" : "",
                  i === 2 ? "border-l-0 pl-0 sm:pl-8 sm:border-l" : "",
                  i >= 2 ? "border-t border-white/12 sm:border-t-0" : "",
                ].join(" ")}
              >
                <dt className="spec text-[0.625rem] uppercase tracking-[0.18em] text-white/45">
                  {stat.label}
                </dt>
                <dd className="mt-2 font-display display-wide text-2xl font-extrabold leading-none text-white sm:text-3xl">
                  {stat.value}
                  {stat.unit && (
                    <span className="ml-0.5 text-lg font-medium text-orange-400">{stat.unit}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
