/**
 * Seed the launch blog articles (scripts/blog-posts.ts).
 *
 * Builds a cover image for each post from catalogue packshots, uploads it to
 * R2 under blog/, and upserts the author and posts by slug. Safe to re-run.
 *
 *   npm run seed:blog
 */

import { createClient } from "@supabase/supabase-js";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp, { type OverlayOptions } from "sharp";
import * as dotenv from "dotenv";
import * as path from "path";
import { SEED_POSTS, type SeedPost } from "./blog-posts";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const env = process.env;
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID!, secretAccessKey: env.R2_SECRET_ACCESS_KEY! },
});

const W = 1600;
const H = 900;
const MAX_TILE = 520;
const MARGIN = 140;

/** First in-stock packshot for each brand. */
async function packshots(brands: string[]): Promise<string[]> {
  const urls: string[] = [];
  for (const brand of brands) {
    const { data } = await supabase
      .from("products")
      .select("product_images(url, is_primary)")
      .eq("brand", brand)
      .eq("in_stock", true)
      .eq("is_active", true)
      .limit(3);
    const images = (data ?? []).flatMap((row) => (row.product_images as { url: string; is_primary: boolean }[]) ?? []);
    const url = (images.find((i) => i.is_primary) ?? images[0])?.url;
    if (url) urls.push(url);
  }
  return urls;
}

/** White rounded tiles with a soft shadow, fanned across a tinted background. */
async function buildCover(post: SeedPost): Promise<Buffer> {
  const urls = await packshots(post.coverBrands);
  if (urls.length === 0) throw new Error(`no packshots for ${post.slug}`);

  const gap = 60;
  // Fit every tile inside the frame, with room left for 16:9 card crops.
  const TILE = Math.min(MAX_TILE, Math.floor((W - 2 * MARGIN - (urls.length - 1) * gap) / urls.length));
  const inset = Math.round(TILE * 0.09);
  const total = urls.length * TILE + (urls.length - 1) * gap;
  const startX = Math.round((W - total) / 2);
  const tiles: OverlayOptions[] = [];

  for (const [i, url] of urls.entries()) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`image ${res.status}: ${url}`);
    const can = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(TILE - 2 * inset, TILE - 2 * inset, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toBuffer();
    const x = startX + i * (TILE + gap);
    const y = Math.round((H - TILE) / 2) + (urls.length > 1 && i % 2 === 1 ? 36 : -18);
    const shadow = Buffer.from(
      `<svg width="${TILE + 80}" height="${TILE + 80}"><defs><filter id="b"><feGaussianBlur stdDeviation="18"/></filter></defs><rect x="40" y="58" width="${TILE}" height="${TILE}" rx="40" fill="#131a20" fill-opacity="0.16" filter="url(#b)"/></svg>`
    );
    const tile = Buffer.from(`<svg width="${TILE}" height="${TILE}"><rect width="${TILE}" height="${TILE}" rx="40" fill="#ffffff"/></svg>`);
    tiles.push({ input: shadow, left: x - 40, top: y - 40 });
    tiles.push({ input: tile, left: x, top: y });
    tiles.push({ input: can, left: x + inset, top: y + inset });
  }

  return sharp({ create: { width: W, height: H, channels: 3, background: post.coverTint } })
    .composite(tiles)
    .webp({ quality: 84 })
    .toBuffer();
}

function readTime(content: string) {
  return Math.max(2, Math.round(content.split(/\s+/).length / 200));
}

async function main() {
  const { data: author, error: authorError } = await supabase
    .from("authors")
    .upsert(
      { slug: "haven-snus-team", name: "Haven Snus Team", bio: "Pouch fans in Australia and New Zealand" },
      { onConflict: "slug" }
    )
    .select("id")
    .single();
  if (authorError || !author) throw new Error(`author: ${authorError?.message}`);

  const publicUrl = env.R2_PUBLIC_URL!.replace(/\/$/, "");

  for (const post of SEED_POSTS) {
    const key = `blog/${post.slug}.webp`;
    await s3.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET!,
        Key: key,
        Body: await buildCover(post),
        ContentType: "image/webp",
        CacheControl: "public, max-age=86400",
      })
    );

    const published = new Date(Date.now() - post.daysAgo * 24 * 60 * 60 * 1000);
    published.setUTCHours(0, 0, 0, 0);

    const { error } = await supabase.from("blog_posts").upsert(
      {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        cover_image: `${publicUrl}/${key}`,
        author_id: author.id,
        category: post.category,
        tags: post.tags,
        status: "published",
        read_time: readTime(post.content),
        seo_title: `${post.title} | Haven Snus`,
        seo_desc: post.excerpt,
        published_at: published.toISOString(),
      },
      { onConflict: "slug" }
    );
    if (error) throw new Error(`${post.slug}: ${error.message}`);
    console.log(`✓ ${post.slug}`);
  }
  console.log(`\nSeeded ${SEED_POSTS.length} posts.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
