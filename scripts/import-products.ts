/**
 * Product Importer - Haven Snus
 * =============================
 * Pulls the catalogue from snusdownunder.com (WooCommerce Store API),
 * copies product images into Cloudflare R2 (as WebP, max 1000px), and upserts the Supabase
 * `brands`, `products`, `product_images`, and `product_features` tables.
 *
 * Safe to re-run: products are matched on (source_site, source_id) and
 * images already in R2 are not uploaded again.
 *
 * Usage:
 *   npm run import              # fetch, upload images, seed database
 *   npm run import:dry          # fetch + map only, print a summary
 *   npm run import:cache        # reuse the last fetch instead of hitting the site
 *   npx tsx scripts/import-products.ts --limit=10 --skip-images
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * and the R2_* variables.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import {
  HTTP_HEADERS,
  buildFeatures,
  decode,
  firstParagraph,
  mapLimit,
  mirrorImage,
  r2Client,
  rebrand,
  sanitizeDescription,
  sleep,
} from "./lib/import-helpers";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const SOURCE_SITE = "snusdownunder";
const SOURCE_API = "https://www.snusdownunder.com/wp-json/wc/store/v1/products";
const CACHE_FILE = path.resolve(process.cwd(), "scripts/.cache/snusdownunder.json");
const BADGE_CACHE_FILE = path.resolve(process.cwd(), "scripts/.cache/snusdownunder-badges.json");
const LISTING_URL = "https://www.snusdownunder.com/buy-nicotine-pouches/";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const FROM_CACHE = args.includes("--from-cache");
const SKIP_IMAGES = args.includes("--skip-images");
// The shop sells everything as available by default; pass --real-stock to mirror the source's stock.
const REAL_STOCK = args.includes("--real-stock");
const LIMIT = Number(args.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? 0);

// Brand display names where the slug alone does not give the right casing.
const BRAND_NAMES: Record<string, string> = {
  "kelly-white": "Kelly White",
  "juice-head": "Juice Head",
  "white-fox": "White Fox",
  "stockholm-white": "Stockholm White",
  sting: "STNG",
};

// ─── Source types ────────────────────────────────────────────────────────────

interface SourceTerm { name: string; slug: string }
interface SourceProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  sku: string;
  short_description: string;
  description: string;
  prices: { price: string; regular_price: string; currency_minor_unit: number };
  images: { src: string; alt: string }[];
  brands: { slug: string }[];
  attributes: { name: string; terms: SourceTerm[] }[];
  is_in_stock: boolean;
  stock_availability: { text: string };
}

// ─── Mapped types ────────────────────────────────────────────────────────────

interface MappedBrand { slug: string; name: string }
interface MappedProduct {
  row: Record<string, unknown>;
  images: { src: string; alt: string }[];
  features: string[];
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string, attempts = 3): Promise<{ data: T; totalPages: number }> {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers: HTTP_HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return {
        data: (await res.json()) as T,
        totalPages: Number(res.headers.get("x-wp-totalpages") ?? 1),
      };
    } catch (err) {
      if (i >= attempts) throw err;
      await sleep(1000 * i);
    }
  }
}

async function fetchCatalogue(): Promise<SourceProduct[]> {
  if (FROM_CACHE) {
    if (!fs.existsSync(CACHE_FILE)) throw new Error(`No cache at ${CACHE_FILE}. Run without --from-cache first.`);
    console.log(`Using cached catalogue: ${CACHE_FILE}`);
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  }

  const all: SourceProduct[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await fetchJson<SourceProduct[]>(`${SOURCE_API}?per_page=100&page=${page}`);
    totalPages = res.totalPages;
    all.push(...res.data);
    console.log(`  page ${page}/${totalPages} - ${all.length} products`);
    page++;
    await sleep(500);
  } while (page <= totalPages);

  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(all));
  return all;
}

// ─── Mapping helpers ─────────────────────────────────────────────────────────

/** "ZYN SLIM – COOL MINT 6MG" → "ZYN Slim – Cool Mint 6mg" (brand keeps its casing). */
function tidyName(name: string, brand: MappedBrand | null): string {
  let s = name
    .toLowerCase()
    .replace(/(^|[\s(/-])([a-z])/g, (_, pre: string, c: string) => pre + c.toUpperCase())
    .replace(/(\d)\s?mg\b/gi, "$1mg");
  if (brand && s.toLowerCase().startsWith(brand.name.toLowerCase())) {
    s = brand.name + s.slice(brand.name.length);
  }
  return s;
}

function attr(p: SourceProduct, name: string): string | undefined {
  return p.attributes.find((a) => a.name === name)?.terms[0]?.name?.trim() || undefined;
}

function brandFrom(p: SourceProduct): MappedBrand | null {
  const raw = p.brands[0]?.slug;
  if (!raw) return null;
  const slug = raw.replace(/-nicotine-(pouches|products)$/, "");
  const name =
    BRAND_NAMES[slug] ??
    slug
      .split("-")
      .map((w) => w.toUpperCase())
      .join(" ");
  return { slug, name };
}

function money(minor: string, unit: number): number {
  return Number(minor) / 10 ** unit;
}

function stockQuantity(text: string): number | null {
  const m = text.match(/(\d+)\s+in stock/i);
  return m ? Number(m[1]) : null;
}

function strengthMg(text?: string): number | null {
  const m = text?.match(/([\d.]+)/);
  return m ? Number(m[1]) : null;
}

function mapProduct(p: SourceProduct): { product: MappedProduct; brand: MappedBrand | null } | null {
  const unit = p.prices.currency_minor_unit ?? 2;
  const price = money(p.prices.price, unit);
  // Skip promotional freebies (FREE TIN etc.) and anything without pouch attributes.
  if (price <= 0 || p.attributes.length === 0) return null;

  const regular = money(p.prices.regular_price, unit);
  const brand = brandFrom(p);
  const name = tidyName(decode(p.name), brand);
  const description = sanitizeDescription(p.description || p.short_description);
  const short = p.short_description ? decode(rebrand(p.short_description)) : firstParagraph(description);

  const strength = attr(p, "Strength");
  const level = attr(p, "Strength level");
  const flavour = attr(p, "Flavour");
  const family = attr(p, "Flavour family");
  const format = attr(p, "Pouch format");
  const perTin = Number(attr(p, "Pouches per tin")) || null;
  const line = attr(p, "Product line");

  return {
    brand,
    product: {
      row: {
        slug: p.slug,
        sku: p.sku || `sdu-${p.id}`,
        name,
        description,
        short_description: short,
        price,
        compare_at_price: regular > price ? regular : null,
        brand: brand?.slug ?? null,
        product_line: line ?? null,
        tags: [family, level, format].filter(Boolean).map((t) => t!.toLowerCase()),
        strength_mg: strengthMg(strength),
        strength_level: level ?? null,
        flavour: flavour ?? null,
        flavour_family: family ?? null,
        pouch_format: format ?? null,
        pouches_per_tin: perTin,
        stock_quantity: REAL_STOCK ? stockQuantity(p.stock_availability?.text ?? "") : null,
        in_stock: REAL_STOCK ? p.is_in_stock : true,
        is_active: true,
        seo_title: `${name} | Haven Snus`,
        seo_description: short.slice(0, 160),
        source_url: p.permalink,
        source_site: SOURCE_SITE,
        source_id: String(p.id),
      },
      images: p.images.map((img) => ({ src: img.src, alt: decode(img.alt || name) })),
      features: buildFeatures({ strength, level, flavour, family, format, perTin }),
    },
  };
}

type Badge = "Brand New" | "Popular";

/**
 * The Store API does not expose the shop's "Brand New" / "Popular" labels, so
 * read them from the paginated listing HTML (`post-<id>` + `product-badge`).
 */
async function fetchBadges(): Promise<Record<string, Badge>> {
  if (FROM_CACHE && fs.existsSync(BADGE_CACHE_FILE)) {
    return JSON.parse(fs.readFileSync(BADGE_CACHE_FILE, "utf8"));
  }
  const badges: Record<string, Badge> = {};
  for (let page = 1; page <= 100; page++) {
    const res = await fetch(page === 1 ? LISTING_URL : `${LISTING_URL}page/${page}/`, {
      headers: { ...HTTP_HEADERS, Accept: "text/html" },
    });
    if (!res.ok) break;
    const html = await res.text();
    const items = [
      ...html.matchAll(
        /<li class="product type-product post-(\d+)[^"]*"[^>]*>\s*<a[^>]*>(?:<span class="product-badge">([^<]+)<\/span>)?/g
      ),
    ];
    if (items.length === 0) break;
    for (const [, id, label] of items) {
      const badge = label?.trim();
      if (badge === "Brand New" || badge === "Popular") badges[id] = badge;
    }
    await sleep(400);
  }
  fs.mkdirSync(path.dirname(BADGE_CACHE_FILE), { recursive: true });
  fs.writeFileSync(BADGE_CACHE_FILE, JSON.stringify(badges));
  return badges;
}

/** Fallback when no badges are found: two in-stock products from each of the biggest brands. */
function pickFeatured(products: MappedProduct[]) {
  const byBrand = new Map<string, MappedProduct[]>();
  for (const p of products) {
    const b = String(p.row.brand ?? "");
    if (!b || !p.row.in_stock || p.images.length === 0) continue;
    byBrand.set(b, [...(byBrand.get(b) ?? []), p]);
  }
  const top = [...byBrand.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 6);
  for (const [, list] of top) for (const p of list.slice(0, 2)) p.row.is_featured = true;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Fetching catalogue from snusdownunder.com…");
  let source = await fetchCatalogue();
  if (LIMIT > 0) source = source.slice(0, LIMIT);

  const brands = new Map<string, MappedBrand>();
  const products: MappedProduct[] = [];
  let skipped = 0;
  for (const p of source) {
    const mapped = mapProduct(p);
    if (!mapped) {
      skipped++;
      continue;
    }
    if (mapped.brand) brands.set(mapped.brand.slug, mapped.brand);
    products.push(mapped.product);
  }
  console.log("Reading Brand New / Popular labels…");
  const badges = await fetchBadges().catch((err) => {
    console.warn(`  could not read labels: ${(err as Error).message}`);
    return {} as Record<string, Badge>;
  });
  for (const p of products) {
    const badge = badges[String(p.row.source_id)];
    p.row.is_new = badge === "Brand New";
    p.row.is_featured = badge === "Popular";
  }
  const labelled = Object.keys(badges).length;
  console.log(`  ${labelled} labelled products`);
  if (!products.some((p) => p.row.is_featured)) pickFeatured(products);

  const inStock = products.filter((p) => p.row.in_stock).length;
  console.log(
    `\nMapped ${products.length} products (${inStock} in stock), ${brands.size} brands, skipped ${skipped}.`
  );

  if (DRY_RUN) {
    console.log("\nSample:");
    console.log(JSON.stringify({ ...products[0], row: { ...products[0].row, description: "…" } }, null, 2));
    console.log("\nNames:", products.slice(0, 40).filter((_, i) => i % 4 === 0).map((p) => p.row.name).join(" | "));
    console.log("\nDescription:", String(products[0].row.description).slice(0, 600));
    console.log("\nBrands:", [...brands.values()].map((b) => b.name).join(", "));
    console.log("\nDry run - nothing uploaded or written.");
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Brands, ordered by catalogue size so the biggest show first.
  const brandCounts = new Map<string, number>();
  for (const p of products) {
    const b = String(p.row.brand ?? "");
    brandCounts.set(b, (brandCounts.get(b) ?? 0) + 1);
  }
  const brandRows = [...brands.values()]
    .sort((a, b) => (brandCounts.get(b.slug) ?? 0) - (brandCounts.get(a.slug) ?? 0))
    .map((b, i) => ({
      slug: b.slug,
      name: b.name,
      position: i,
      is_featured: i < 8,
      seo_title: `${b.name} Nicotine Pouches | Haven Snus`,
    }));
  const { error: brandError } = await supabase.from("brands").upsert(brandRows, { onConflict: "slug" });
  if (brandError) throw new Error(`brands: ${brandError.message}`);
  console.log(`Upserted ${brandRows.length} brands.`);

  const s3 = SKIP_IMAGES ? null : r2Client();
  let done = 0;
  let failed = 0;

  // Supabase network failures come back with an empty message; surface whatever detail exists.
  const dbError = (label: string, error: { message?: string; details?: string; code?: string }) =>
    new Error(`${label}: ${error.message || error.details || error.code || "network error"}`);

  async function importOne(p: MappedProduct) {
    const slug = String(p.row.slug);
    const { data, error } = await supabase
      .from("products")
      .upsert(p.row, { onConflict: "source_site,source_id" })
      .select("id")
      .single();
    if (error || !data) throw dbError("product", error ?? { message: "no id returned" });
    const productId = data.id as string;

    if (s3 && p.images.length > 0) {
      const urls = await Promise.all(p.images.map((img, i) => mirrorImage(s3, img.src, slug, i)));
      await supabase.from("product_images").delete().eq("product_id", productId);
      const { error: imgError } = await supabase.from("product_images").insert(
        urls.map((u, i) => ({
          product_id: productId,
          url: u,
          alt: p.images[i].alt,
          position: i,
          is_primary: i === 0,
        }))
      );
      if (imgError) throw dbError("images", imgError);
    }

    await supabase.from("product_features").delete().eq("product_id", productId);
    const { error: featError } = await supabase.from("product_features").insert(
      p.features.map((feature, i) => ({ product_id: productId, feature, position: i }))
    );
    if (featError) throw dbError("features", featError);
  }

  await mapLimit(products, 4, async (p) => {
    for (let attempt = 1; ; attempt++) {
      try {
        await importOne(p);
        done++;
        if (done % 25 === 0) console.log(`  ${done}/${products.length}`);
        return;
      } catch (err) {
        if (attempt < 3) {
          await sleep(2000 * attempt);
          continue;
        }
        failed++;
        const e = err as Error & { cause?: { code?: string; message?: string } };
        const cause = e.cause ? ` (${e.cause.code ?? e.cause.message})` : "";
        console.error(`  ✗ ${p.row.slug}: ${e.message}${cause}`);
        return;
      }
    }
  });

  console.log(`\nDone. ${done} imported, ${failed} failed.`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
