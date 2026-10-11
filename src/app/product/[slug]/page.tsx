import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/ui/product-card";
import { ProductGallery } from "@/components/ui/product-gallery";
import { StrengthDots } from "@/components/ui/strength-dots";
import { ProductBuyBox } from "@/components/cart/product-buy-box";
import { Price } from "@/components/currency/price";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries/products";
import { getSiteSettings } from "@/lib/queries/settings";
import { facetSlug } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/site";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  return {
    title: { absolute: product.seo?.title ?? `${product.name} | Haven Snus` },
    description: product.seo?.description ?? product.short_description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.short_description,
      images: product.images[0] ? [{ url: product.images[0].url, alt: product.images[0].alt }] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, settings] = await Promise.all([getRelatedProducts(product, 4), getSiteSettings()]);
  const hero = product.images[0];

  const hasDiscount = Boolean(product.compare_at_price && product.compare_at_price > product.price);
  const discountPct = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0;

  const specs: [string, React.ReactNode][] = [
    ["Brand", product.brand_name ? <Link href={`/products?brand=${product.brand}`} className="underline decoration-slate-300 underline-offset-4 hover:text-orange-700">{product.brand_name}</Link> : null],
    ["Product line", product.product_line],
    ["Nicotine", product.strength_mg != null ? `${product.strength_mg}mg per pouch` : null],
    ["Strength", product.strength_level ? (
      <span className="inline-flex items-center gap-2.5">
        {product.strength_level}
        <StrengthDots level={product.strength_level} />
      </span>
    ) : null],
    ["Flavour", product.flavour],
    ["Flavour family", product.flavour_family],
    ["Pouch format", product.pouch_format],
    ["Pouches per can", product.pouches_per_tin],
    ["SKU", <span key="sku" className="spec text-xs">{product.sku}</span>],
  ];
  const specRows = specs.filter(([, v]) => v != null && v !== "");

  const lowStock = product.in_stock && product.stock_quantity != null && product.stock_quantity > 0 && product.stock_quantity <= 10;

  return (
    <div className="bg-white">
      <div className="border-b border-slate-200 bg-slate-50">
        <div className="container-wide py-3">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500" aria-label="Breadcrumb">
            <Link href="/" className="transition-colors hover:text-slate-700">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/products" className="transition-colors hover:text-slate-700">Shop</Link>
            {product.brand && (
              <>
                <ChevronRight className="h-3 w-3" />
                <Link href={`/products?brand=${product.brand}`} className="transition-colors hover:text-slate-700">
                  {product.brand_name ?? product.brand}
                </Link>
              </>
            )}
            <ChevronRight className="h-3 w-3" />
            <span className="max-w-[220px] truncate font-medium text-slate-900">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container-wide py-10 lg:py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 xl:gap-16">
          <ProductGallery images={product.images} name={product.name} isNew={product.is_new} />

          <div>
            <div className="spec text-[0.6875rem] uppercase tracking-[0.16em] text-orange-700">
              {[product.brand_name, product.pouch_format].filter(Boolean).join(" · ")}
            </div>

            <h1 className="mt-2 font-display text-2xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-[2rem]">
              {product.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
              {product.strength_level && (
                <span className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <StrengthDots level={product.strength_level} size="md" />
                  {product.strength_level}
                </span>
              )}
              {product.strength_mg != null && (
                <span className="spec text-sm font-medium text-slate-900">{product.strength_mg}mg / pouch</span>
              )}
              {product.flavour_family && (
                <Link
                  href={`/products?flavour=${facetSlug(product.flavour_family)}`}
                  className="badge hover:bg-slate-200"
                >
                  {product.flavour_family}
                </Link>
              )}
            </div>

            {product.short_description && (
              <p className="mt-5 text-[0.9375rem] leading-relaxed text-slate-600">{product.short_description}</p>
            )}

            <div className="mt-6 flex items-baseline gap-3">
              <span className="font-display text-3xl font-extrabold text-slate-900">
                <Price amount={product.price} />
              </span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-slate-400">
                    <Price amount={product.compare_at_price!} original />
                  </span>
                  <span className="badge-red">Save {discountPct}%</span>
                </>
              )}
              <span className="text-sm text-slate-500">per can</span>
            </div>

            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className={cn("h-2 w-2 rounded-full", product.in_stock ? "bg-emerald-500" : "bg-slate-300")} />
              <span className={product.in_stock ? "font-medium text-emerald-700" : "text-slate-500"}>
                {product.in_stock
                  ? lowStock
                    ? `Only ${product.stock_quantity} left in stock`
                    : "In stock, ready to ship"
                  : "Sold out"}
              </span>
            </div>

            <ProductBuyBox
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                sku: product.sku,
                price: product.price,
                image: hero?.url,
                in_stock: product.in_stock,
              }}
            />

            <dl className="mt-7 w-full border-t border-slate-200 pt-5">
              {[
                {
                  icon: Truck,
                  term: "Delivery",
                  detail:
                    settings.free_shipping_threshold > 0 ? (
                      <>Tracked to AU & NZ. Free over <Price amount={settings.free_shipping_threshold} /></>
                    ) : (
                      "Tracked to AU & NZ"
                    ),
                },
                { icon: PackageCheck, term: "Packaging", detail: "Plain, discreet outer box" },
                { icon: ShieldCheck, term: "Contents", detail: "Tobacco-free nicotine pouches. 18+ only" },
              ].map(({ icon: Icon, term, detail }, i) => (
                <div key={term} className={cn("flex items-baseline gap-4 py-2.5", i > 0 && "border-t border-slate-100")}>
                  <Icon className="h-3.5 w-3.5 flex-shrink-0 translate-y-0.5 text-orange-600" strokeWidth={1.75} />
                  <dt className="spec w-24 flex-shrink-0 text-[0.625rem] uppercase tracking-[0.16em] text-slate-500">{term}</dt>
                  <dd className="text-[0.8125rem] text-slate-700">{detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="mt-16 border-t border-slate-200 pt-12">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-14">
            <div className="lg:col-span-2">
              <h2 className="mb-4 font-display text-xl font-bold text-slate-900">About this can</h2>
              {product.description ? (
                <div
                  className="prose-info max-w-none text-[0.9375rem] leading-relaxed text-slate-600"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                <p className="text-[0.9375rem] leading-relaxed text-slate-600">{product.short_description}</p>
              )}
            </div>

            <div>
              <h2 className="mb-4 font-display text-xl font-bold text-slate-900">Specifications</h2>
              <dl className="m-0">
                {specRows.map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
                    <dt className="text-sm text-slate-500">{label}</dt>
                    <dd className="text-right text-sm font-medium text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 rounded-lg bg-slate-50 p-4 text-xs leading-relaxed text-slate-500">
                Warning: this product contains nicotine, which is a highly addictive substance. Not for
                use by people under 18, or by anyone who is pregnant or breastfeeding.
              </p>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-16 border-t border-slate-200 pt-12">
            <h2 className="mb-6 font-display text-xl font-bold text-slate-900">
              {product.brand_name ? `More from ${product.brand_name}` : "You might also like"}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.short_description,
            sku: product.sku,
            image: hero?.url ? [hero.url] : undefined,
            brand: product.brand_name ? { "@type": "Brand", name: product.brand_name } : undefined,
            offers: {
              "@type": "Offer",
              price: product.price.toFixed(2),
              priceCurrency: "AUD",
              availability: product.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              url: absoluteUrl(`/product/${product.slug}`),
            },
          }).replace(/</g, "\\u003c"),
        }}
      />
    </div>
  );
}
