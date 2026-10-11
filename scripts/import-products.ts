/**
 * Product Importer - Haven Snus
 * =============================
 * Pulls the catalogue from snusdownunder.com (WooCommerce Store API),
 * copies product images into Cloudflare R2, and upserts the Supabase
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

import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const SOURCE_SITE = "snusdownunder";
const SOURCE_API = "https://www.snusdownunder.com/wp-json/wc/store/v1/products";
const CACHE_FILE = path.resolve(process.cwd(), "scripts/.cache/snusdownunder.json");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const FROM_CACHE = args.includes("--from-cache");
const SKIP_IMAGES = args.includes("--skip-images");
const LIMIT = Number(args.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? 0);

const HTTP_HEADERS = {
  "User-Agent": "HavenSnusImporter/1.0",
  Accept: "application/json",
};

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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

function decode(html: string): string {
  return cheerio.load(`<div>${html}</div>`)("div").text().replace(/\s+/g, " ").trim();
}

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

function rebrand(text: string): string {
  return text
    .replace(/snus\s*down\s*under/gi, "Haven Snus")
    .replace(/(?:https?:\/\/)?(?:www\.)?snusdownunder\.com/gi, "havensnus.com");
}

const ALLOWED_TAGS = new Set(["p", "h2", "h3", "h4", "ul", "ol", "li", "strong", "em", "br"]);

/** Keep simple structural markup only; drop links, scripts, attributes. */
function sanitizeDescription(html: string): string {
  const $ = cheerio.load(`<div id="root">${html}</div>`);
  const root = $("#root");
  root.find("script, style, iframe, img, form").remove();
  root.find("*").each((_, el) => {
    if (el.type !== "tag") return;
    const tag = el.tagName.toLowerCase();
    if (tag === "b") el.tagName = "strong";
    else if (tag === "i") el.tagName = "em";
    else if (!ALLOWED_TAGS.has(tag)) {
      $(el).replaceWith($(el).contents());
      return;
    }
    el.attribs = {};
  });
  root.find("p").each((_, el) => {
    if (!$(el).text().trim()) $(el).remove();
  });
  return rebrand(root.html() ?? "").trim();
}

function firstParagraph(html: string): string {
  const $ = cheerio.load(html);
  const text = $("p").first().text() || $.root().text();
  const clean = rebrand(text.replace(/\s+/g, " ").trim());
  if (clean.length <= 220) return clean;
  const cut = clean.slice(0, 220);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
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

function buildFeatures(spec: {
  strength?: string;
  level?: string;
  flavour?: string;
  family?: string;
  format?: string;
  perTin?: number | null;
}): string[] {
  const features: string[] = [];
  if (spec.strength) features.push(`${spec.strength} nicotine per pouch${spec.level ? ` (${spec.level})` : ""}`);
  if (spec.flavour) features.push(`${spec.flavour} flavour${spec.family ? `, ${spec.family.toLowerCase()} family` : ""}`);
  if (spec.format) features.push(`${spec.format} pouch format`);
  if (spec.perTin) features.push(`${spec.perTin} pouches per can`);
  features.push("Tobacco-free, white nicotine pouches");
  return features;
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
        stock_quantity: stockQuantity(p.stock_availability?.text ?? ""),
        in_stock: p.is_in_stock,
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

/** Feature two in-stock products from each of the biggest brands. */
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

// ─── R2 ──────────────────────────────────────────────────────────────────────

function r2Client() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error("R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY must be set");
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });
}

const CONTENT_TYPES: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  avif: "image/avif",
};

async function objectExists(s3: S3Client, bucket: string, key: string) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

/** Copy one source image into R2 and return its public URL. */
async function mirrorImage(s3: S3Client, src: string, slug: string, index: number): Promise<string> {
  const bucket = process.env.R2_BUCKET!;
  const publicUrl = process.env.R2_PUBLIC_URL!.replace(/\/$/, "");
  const ext = (new URL(src).pathname.split(".").pop() ?? "webp").toLowerCase();
  const key = `products/${slug}${index ? `-${index + 1}` : ""}.${ext}`;

  if (!(await objectExists(s3, bucket, key))) {
    const res = await fetch(src, { headers: { ...HTTP_HEADERS, Accept: "image/*" } });
    if (!res.ok) throw new Error(`image HTTP ${res.status}: ${src}`);
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: Buffer.from(await res.arrayBuffer()),
        ContentType: CONTENT_TYPES[ext] ?? res.headers.get("content-type") ?? "application/octet-stream",
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
  }
  return `${publicUrl}/${key}`;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>) {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i], i);
      }
    })
  );
  return results;
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
  pickFeatured(products);

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
