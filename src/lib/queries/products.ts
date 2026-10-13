/**
 * Product and brand queries (anon key, RLS-filtered to active rows).
 * Returns empty results when Supabase is not configured.
 */

import type { Brand, Product, ProductImage } from "@/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { selectProductImages } from "@/lib/product-image";

/** Listing columns: everything a card or filter needs, without the long description. */
const LIST_SELECT = `id, slug, sku, name, price, compare_at_price, brand, product_line,
  strength_mg, strength_level, flavour, flavour_family, pouch_format, pouches_per_tin,
  stock_quantity, in_stock, is_featured, is_new, created_at,
  brands(name), product_images(id, url, alt, position, is_primary)`;

const DETAIL_SELECT = `*, brands(name), product_images(*), product_features(*)`;

async function db() {
  const { createPublicClient } = await import("@/lib/supabase/public");
  return createPublicClient();
}

function text(value: unknown) {
  return value == null ? undefined : String(value);
}

function mapRow(row: Record<string, unknown>): Product {
  const images = selectProductImages(
    ((row.product_images as Record<string, unknown>[]) ?? []).map(
      (img): ProductImage => ({
        id: String(img.id ?? ""),
        url: String(img.url ?? ""),
        alt: String(img.alt ?? ""),
        position: Number(img.position ?? 0),
        is_primary: Boolean(img.is_primary),
      })
    )
  );

  const features = ((row.product_features as Record<string, unknown>[]) ?? [])
    .sort((a, b) => Number(a.position) - Number(b.position))
    .map((f) => String(f.feature ?? "").trim())
    .filter(Boolean);

  const brand = row.brands as { name?: string } | null;

  return {
    id: String(row.id ?? ""),
    slug: String(row.slug ?? ""),
    sku: String(row.sku ?? ""),
    name: String(row.name ?? ""),
    description: String(row.description ?? ""),
    short_description: String(row.short_description ?? ""),
    price: Number(row.price ?? 0),
    compare_at_price: row.compare_at_price ? Number(row.compare_at_price) : undefined,
    brand: text(row.brand),
    brand_name: brand?.name ?? undefined,
    product_line: text(row.product_line),
    tags: (row.tags as string[]) ?? [],
    images,
    features,
    strength_mg: row.strength_mg != null ? Number(row.strength_mg) : undefined,
    strength_level: text(row.strength_level),
    flavour: text(row.flavour),
    flavour_family: text(row.flavour_family),
    pouch_format: text(row.pouch_format),
    pouches_per_tin: row.pouches_per_tin != null ? Number(row.pouches_per_tin) : undefined,
    stock_quantity: row.stock_quantity != null ? Number(row.stock_quantity) : undefined,
    in_stock: Boolean(row.in_stock),
    is_featured: Boolean(row.is_featured),
    is_new: Boolean(row.is_new),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
    seo: row.seo_title
      ? {
          title: String(row.seo_title),
          description: text(row.seo_description),
          keywords: (row.seo_keywords as string[]) ?? undefined,
        }
      : undefined,
  };
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await db();

  const { data, error } = await supabase
    .from("products")
    .select(LIST_SELECT)
    .eq("is_active", true)
    .eq("is_featured", true)
    .eq("in_stock", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getFeaturedProducts:", error.message);
    return [];
  }
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

/** Whole active catalogue; the shop page filters client-side. */
export async function getProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await db();

  const { data, error } = await supabase
    .from("products")
    .select(LIST_SELECT)
    .eq("is_active", true)
    .order("in_stock", { ascending: false })
    .order("is_featured", { ascending: false })
    .order("name", { ascending: true })
    .limit(2000);

  if (error) {
    console.error("getProducts:", error.message);
    return [];
  }
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await db();

  const { data, error } = await supabase
    .from("products")
    .select(DETAIL_SELECT)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  return mapRow(data as Record<string, unknown>);
}

/** Same brand first (in stock), then same flavour family. */
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await db();

  const base = () =>
    supabase
      .from("products")
      .select(LIST_SELECT)
      .eq("is_active", true)
      .eq("in_stock", true)
      .neq("id", product.id)
      .limit(limit);

  const sameBrand = product.brand ? (await base().eq("brand", product.brand)).data ?? [] : [];
  let rows = sameBrand;
  if (rows.length < limit && product.flavour_family) {
    const seen = new Set(rows.map((r) => r.id));
    const more = (await base().eq("flavour_family", product.flavour_family)).data ?? [];
    rows = [...rows, ...more.filter((r) => !seen.has(r.id))];
  }
  return rows.slice(0, limit).map((row) => mapRow(row as Record<string, unknown>));
}

/** Active brands with product counts and a cover image from an in-stock product. */
export async function getBrands(): Promise<Brand[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await db();

  const [brandsRes, productsRes] = await Promise.all([
    supabase
      .from("brands")
      .select("id, name, slug, description, logo_url, image_url, position, is_featured")
      .eq("is_active", true)
      .order("position", { ascending: true }),
    supabase
      .from("products")
      .select("brand, in_stock, product_images(url, is_primary, position)")
      .eq("is_active", true)
      .limit(2000),
  ]);

  if (brandsRes.error) {
    console.error("getBrands:", brandsRes.error.message);
    return [];
  }

  const counts: Record<string, number> = {};
  const covers: Record<string, string> = {};
  for (const row of productsRes.data ?? []) {
    const slug = String(row.brand ?? "");
    counts[slug] = (counts[slug] ?? 0) + 1;
    if (covers[slug] || !row.in_stock) continue;
    const images = (row.product_images as { url: string; is_primary: boolean; position: number }[]) ?? [];
    const primary = images.find((i) => i.is_primary) ?? images[0];
    if (primary?.url) covers[slug] = primary.url;
  }

  return (brandsRes.data ?? [])
    .map((row) => ({
      id: String(row.id),
      name: String(row.name),
      slug: String(row.slug),
      description: text(row.description),
      logo_url: text(row.logo_url),
      image_url: text(row.image_url) ?? covers[String(row.slug)],
      position: Number(row.position ?? 0),
      is_featured: Boolean(row.is_featured),
      product_count: counts[String(row.slug)] ?? 0,
    }))
    .filter((b) => b.product_count > 0);
}

export async function getProductSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await db();
  const { data, error } = await supabase
    .from("products")
    .select("slug, updated_at")
    .eq("is_active", true)
    .limit(2000);

  if (error || !data) return [];
  return data.map((row) => ({
    slug: String(row.slug),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  }));
}

export type NavBrand = { name: string; slug: string };

/** Featured brands for the header menu (cheap: no product scan). */
export async function getNavBrands(limit = 12): Promise<NavBrand[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await db();
  const { data, error } = await supabase
    .from("brands")
    .select("name, slug")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("position", { ascending: true })
    .limit(limit);
  if (error) return [];
  return (data ?? []).map((row) => ({ name: String(row.name), slug: String(row.slug) }));
}

/** Products by slug, in the order given (missing or inactive slugs are skipped). */
export async function getProductsBySlugs(slugs: string[]): Promise<Product[]> {
  if (!isSupabaseConfigured() || slugs.length === 0) return [];
  const supabase = await db();
  const { data, error } = await supabase
    .from("products")
    .select(LIST_SELECT)
    .eq("is_active", true)
    .in("slug", slugs);
  if (error) return [];
  const bySlug = new Map((data ?? []).map((row) => [String(row.slug), mapRow(row as Record<string, unknown>)]));
  return slugs.map((s) => bySlug.get(s)).filter((p): p is Product => Boolean(p));
}

/** Lowest active price, for "From $x" messaging. */
export async function getLowestPrice(): Promise<number | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await db();
  const { data } = await supabase
    .from("products")
    .select("price")
    .eq("is_active", true)
    .gt("price", 0)
    .order("price", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data ? Number(data.price) : null;
}
