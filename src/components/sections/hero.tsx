import Link from "next/link";
import { getBrands, getFeaturedProducts, getLowestPrice, getProductsBySlugs } from "@/lib/queries/products";
import { getSiteSettings } from "@/lib/queries/settings";
import { HeroCopy } from "@/components/sections/hero-copy";
import { Price } from "@/components/currency/price";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

/**
 * Stage-lit hero: a fanned row of cans from different brands, each on its
 * own colour glow, over a near-black floor. Packshots here must have
 * transparent backgrounds (a white square would break the effect).
 */
const HERO_CANS: { slug: string; glow: string }[] = [
  { slug: "neafs-mango-ice-8mg", glow: "#f5a524" },
  { slug: "leo-blue-razz-ice-strong-12mg", glow: "#2f7bff" },
  { slug: "zyn-mini-dry-black-cherry-1-5mg", glow: "#e0217a" },
  { slug: "velo-purple-grape-17mg", glow: "#8b3dff" },
  { slug: "killa-extra-strong-cold-x-mint-12-8mg-2", glow: "#e5262b" },
];

// Per-slot layout, outside in: size, lift, tilt and stacking. Outer cans hide on phones.
const SLOTS = [
  "w-[24%] translate-y-[14%] -rotate-[10deg] z-10 -mr-[5%] hidden sm:block",
  "w-[34%] sm:w-[27%] translate-y-[6%] -rotate-[5deg] z-20 -mr-[6%]",
  "w-[44%] sm:w-[33%] z-30",
  "w-[34%] sm:w-[27%] translate-y-[6%] rotate-[5deg] z-20 -ml-[6%]",
  "w-[24%] translate-y-[14%] rotate-[10deg] z-10 -ml-[5%] hidden sm:block",
];

export async function Hero() {
  const [brands, curated, settings, lowest] = await Promise.all([
    getBrands(),
    getProductsBySlugs(HERO_CANS.map((c) => c.slug)),
    getSiteSettings(),
    getLowestPrice(),
  ]);

  // Fall back to featured cans if curated slugs disappear from the catalogue.
  let cans: (Product & { glow: string })[] = curated.map((p) => ({
    ...p,
    glow: HERO_CANS.find((c) => c.slug === p.slug)?.glow ?? "#13806c",
  }));
  if (cans.length < 5) {
    const extra = (await getFeaturedProducts(5)).filter((p) => !cans.some((c) => c.id === p.id));
    cans = [...cans, ...extra.map((p, i) => ({ ...p, glow: HERO_CANS[i % 5].glow }))].slice(0, 5);
  }

  const productCount = brands.reduce((sum, b) => sum + (b.product_count ?? 0), 0);
  const stats: { label: string; value: React.ReactNode; unit?: string }[] = [
    { label: "Brands", value: brands.length || "30", unit: "+" },
    { label: "Products", value: productCount || "500", unit: "" },
    { label: "Delivering", value: "Australia-wide" },
    {
      label: "Free shipping from",
      value: settings.free_shipping_threshold > 0 ? <Price amount={settings.free_shipping_threshold} /> : "Always",
    },
  ];

  return (
    <section className="relative isolate overflow-hidden bg-[#0a0d10]">
      {/* Colour glows, one per can, plus a soft floor light. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[78%]">
        {cans.map((can, i) => (
          <div
            key={can.id}
            className={cn("absolute top-[18%] h-[60%] w-[30%] rounded-full opacity-55 blur-[70px]", i % 4 === 0 && "hidden sm:block")}
            style={{ left: `${4 + i * 18}%`, background: can.glow }}
          />
        ))}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0a0d10] to-transparent" />
      </div>

      <div className="container-wide relative pt-8 sm:pt-10">
        {lowest != null && (
          <div className="absolute right-3 top-3 z-40 -rotate-[8deg] sm:right-10 sm:top-10">
            <div className="rounded-lg bg-[#e0217a] px-2.5 py-1.5 text-center shadow-[0_10px_30px_rgba(224,33,122,0.45)] sm:rounded-xl sm:px-6 sm:py-3">
              <div className="spec text-[0.625rem] uppercase tracking-[0.18em] text-white/80">From</div>
              <div className="font-display display-wide text-lg font-extrabold leading-none text-white sm:text-4xl">
                <Price amount={lowest} />
              </div>
              <div className="spec mt-0.5 text-[0.625rem] uppercase tracking-[0.14em] text-white/80">a can</div>
            </div>
          </div>
        )}

        {/* The can stage. */}
        <div className="mx-auto flex max-w-5xl items-center justify-center pb-6 pt-14 sm:pb-10 sm:pt-6">
          {cans.map((can, i) => (
            <Link
              key={can.id}
              href={`/product/${can.slug}`}
              aria-label={can.name}
              className={cn("group relative block shrink-0", SLOTS[i])}
            >
              <div
                className="animate-hero-float transition-transform duration-300 group-hover:-translate-y-2 group-hover:scale-[1.03]"
                style={{ animationDelay: `${i * 0.4}s` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={can.images[0]?.url}
                  alt={can.images[0]?.alt || can.name}
                  loading="eager"
                  fetchPriority={i === 2 ? "high" : undefined}
                  className="aspect-square w-full object-contain drop-shadow-[0_24px_30px_rgba(0,0,0,0.6)]"
                />
              </div>
            </Link>
          ))}
        </div>

        <HeroCopy />
      </div>

      <div className="relative mt-10 border-t border-white/12 bg-black/20 sm:mt-12">
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
                <dt className="spec text-[0.625rem] uppercase tracking-[0.18em] text-white/45">{stat.label}</dt>
                <dd className="mt-2 font-display display-wide text-xl font-extrabold leading-tight text-white sm:text-3xl sm:leading-none">
                  {stat.value}
                  {stat.unit && <span className="ml-0.5 text-lg font-medium text-orange-400">{stat.unit}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
