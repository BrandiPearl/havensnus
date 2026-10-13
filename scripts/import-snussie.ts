/**
 * Brand Importer - snussie.com
 * ============================
 * Adds a brand's range from snussie.com (Lightspeed eCom, read through its
 * `?format=json` endpoints) as single cans, with our own pricing.
 *
 * Usage:
 *   npm run import:snussie                         # GARANT, $13.99 (was $14.99)
 *   npm run import:snussie -- --dry-run
 *   npx tsx scripts/import-snussie.ts --brand=garant --price=13.99 --was=14.99
 *
 * Products are matched on (source_site = 'snussie', source_id), so re-running
 * updates them in place. Requires the same .env.local as import-products.ts.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import {
  buildFeatures,
  decode,
  fetchWithRetry,
  mapLimit,
  mirrorImage,
  r2Client,
  rebrand,
  sanitizeDescription,
  sleep,
  strengthLevelFor,
} from "./lib/import-helpers";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const SOURCE_SITE = "snussie";
const BASE = "https://www.snussie.com/en";
// Lightspeed serves product images by file id from the shop's CDN folder.
const IMAGE_BASE = "https://cdn.webshopapp.com/shops/280978/files";

const args = process.argv.slice(2);
const arg = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const DRY_RUN = args.includes("--dry-run");
const BRAND = (arg("brand") ?? "garant").toLowerCase();
const PRICE = Number(arg("price") ?? 13.99);
const WAS = Number(arg("was") ?? 14.99);

type ListItem = { id: number; url: string; title: string };
type Spec = { title: string; value: string | number };
type Detail = {
  id: number;
  url: string;
  title: string;
  description: string;
  content: string;
  images: string[];
  specs: Record<string, Spec>;
  brand: { title: string };
  variants: Record<string, { title: string }>;
};

const titleCase = (s: string) =>
  s.toLowerCase().replace(/(^|[\s/-])([a-z])/g, (_, pre: string, c: string) => pre + c.toUpperCase());

/** Map a flavour name onto the flavour families used across the shop. */
function flavourFamily(flavour: string): string {
  const f = flavour.toLowerCase();
  if (/cola|energy/.test(f)) return "Cola/Energy";
  if (/mango|pineapple|passion|tropical|coconut|guava|papaya/.test(f)) return "Tropical";
  if (/citrus|lemon|lime|orange|grapefruit/.test(f)) return "Citrus";
  if (/berry|cherry|grape|currant/.test(f)) return "Berry";
  if (/peach|apricot|appricot|melon|apple|pear|fruit/.test(f)) return "Fruit";
  if (/menthol|freeze|frost|ice cool|ice$/.test(f) && !/mint|peppermint|wintergreen/.test(f)) return "Menthol/Ice";
  if (/mint|peppermint|spearmint|wintergreen/.test(f)) return "Mint";
  return "Other";
}

async function getJson<T>(url: string): Promise<T | null> {
  const res = await fetchWithRetry(url);
  if (!res.ok) return null;
  return (await res.json()) as T;
}

async function listBrand(): Promise<ListItem[]> {
  const items = new Map<number, ListItem>();
  for (let page = 1; page <= 20; page++) {
    const data = await getJson<{ collection: { products: Record<string, ListItem> | [] } }>(
      `${BASE}/brands/${BRAND}/page${page}.html?format=json&limit=24`
    );
    const products = Object.values(data?.collection?.products ?? {});
    const before = items.size;
    for (const p of products) items.set(p.id, p);
    if (products.length === 0 || items.size === before) break;
    await sleep(400);
  }
  return [...items.values()];
}

function spec(d: Detail, title: string): string {
  return String(Object.values(d.specs ?? {}).find((s) => s.title === title)?.value ?? "").trim();
}

function mapDetail(raw: Detail) {
  // Some titles carry a localised suffix, e.g. "GARANT Cherry Medium | Nicotinezakje".
  const d = { ...raw, title: raw.title.split("|")[0].trim() };
  const brandName = d.brand?.title || BRAND.toUpperCase();
  const mg = Number(spec(d, "NICOTINE (MG) PER POUCH")) || null;
  const perTin = Number(spec(d, "POUCHES PER CAN")) || null;
  const format = titleCase(spec(d, "FORMAT")) || (/mini/i.test(d.title) ? "Mini" : "Slim");
  const level = strengthLevelFor(mg);

  // "GARANT Ice Peach Extreme" -> "Ice Peach"; fall back to the FLAVOUR spec ("GARANT Extreme" -> "Mint").
  const fromTitle = d.title
    .replace(new RegExp(`^${brandName}\\s*`, "i"), "")
    .replace(/\b(extreme|medium|strong|mini|slim)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const flavour = fromTitle ? titleCase(fromTitle).replace(/Appricot/, "Apricot") : titleCase(spec(d, "FLAVOUR")) || "Original";
  const lineWord = /mini/i.test(d.title) ? "Mini" : /medium/i.test(d.title) ? "Medium" : /extreme/i.test(d.title) ? "Extreme" : "";
  const name = `${d.title.replace(/Appricot/, "Apricot")}${mg ? ` ${mg}mg` : ""}`;
  const slug = `${d.url.replace(/\.html$/, "")}${mg ? `-${String(mg).replace(".", "-")}mg` : ""}`;
  const description = sanitizeDescription(d.content || `<p>${d.description}</p>`);
  const family = flavourFamily(flavour);

  return {
    row: {
      slug,
      sku: `snussie-${d.id}`,
      name,
      description,
      short_description: decode(rebrand(d.description || "")),
      price: PRICE,
      compare_at_price: WAS > PRICE ? WAS : null,
      brand: BRAND,
      product_line: [brandName, lineWord].filter(Boolean).join(" "),
      tags: [family, level, format].filter(Boolean).map((t) => String(t).toLowerCase()),
      strength_mg: mg,
      strength_level: level,
      flavour,
      flavour_family: family,
      pouch_format: format,
      pouches_per_tin: perTin,
      stock_quantity: null,
      in_stock: true,
      is_new: true,
      is_active: true,
      seo_title: `${name} | Haven Snus`,
      seo_description: decode(rebrand(d.description || "")).slice(0, 160),
      source_url: `${BASE}/${d.url}`,
      source_site: SOURCE_SITE,
      source_id: String(d.id),
    },
    images: (d.images ?? []).map((id) => ({ src: `${IMAGE_BASE}/${id}/image.jpg`, alt: `${name} nicotine pouches can` })),
    features: buildFeatures({
      strength: mg ? `${mg} mg` : undefined,
      level: level ?? undefined,
      flavour,
      family,
      format,
      perTin,
    }),
    brandName,
  };
}

async function main() {
  console.log(`Listing ${BRAND.toUpperCase()} on snussie.com…`);
  const list = await listBrand();
  console.log(`  ${list.length} listed`);

  const details: Detail[] = [];
  for (const item of list) {
    const data = await getJson<{ product: Detail }>(`${BASE}/${item.url}?format=json`);
    if (data?.product) details.push(data.product);
    await sleep(300);
  }

  // Single cans only: skip multipacks and bundles.
  const singles = details.filter((d) => !/\b(\d+\s*-?\s*pack|multipack|bundle|box)\b/i.test(d.title));
  const mapped = singles.map(mapDetail).filter((p) => p.images.length > 0 && p.row.strength_mg);
  console.log(`  ${mapped.length} single cans to import (skipped ${details.length - mapped.length})`);

  if (DRY_RUN) {
    for (const p of mapped) {
      console.log(`  ${p.row.name} | ${p.row.flavour} (${p.row.flavour_family}) | ${p.row.strength_level} | ${p.row.pouch_format} | ${p.row.pouches_per_tin}/can`);
    }
    console.log("\nDry run - nothing uploaded or written.");
    return;
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

  const brandName = mapped[0]?.brandName ?? BRAND.toUpperCase();
  const { data: existingBrand } = await supabase.from("brands").select("slug").eq("slug", BRAND).maybeSingle();
  if (!existingBrand) {
    const { error } = await supabase.from("brands").insert({
      slug: BRAND,
      name: brandName,
      position: 100,
      seo_title: `${brandName} Nicotine Pouches | Haven Snus`,
    });
    if (error) throw new Error(`brand: ${error.message}`);
  }

  const s3 = r2Client();
  let done = 0;
  let failed = 0;
  await mapLimit(mapped, 4, async (p) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .upsert(p.row, { onConflict: "source_site,source_id" })
        .select("id")
        .single();
      if (error || !data) throw new Error(error?.message || "no id returned");

      const urls = await Promise.all(p.images.map((img, i) => mirrorImage(s3, img.src, String(p.row.slug), i)));
      await supabase.from("product_images").delete().eq("product_id", data.id);
      await supabase.from("product_images").insert(
        urls.map((url, i) => ({ product_id: data.id, url, alt: p.images[i].alt, position: i, is_primary: i === 0 }))
      );
      await supabase.from("product_features").delete().eq("product_id", data.id);
      await supabase
        .from("product_features")
        .insert(p.features.map((feature, i) => ({ product_id: data.id, feature, position: i })));
      done++;
    } catch (err) {
      failed++;
      console.error(`  ✗ ${p.row.slug}: ${(err as Error).message}`);
    }
  });

  console.log(`\nDone. ${done} imported, ${failed} failed.`);
  console.log("Use CMS → Settings → Refresh site cache to show them on the live site straight away.");
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
