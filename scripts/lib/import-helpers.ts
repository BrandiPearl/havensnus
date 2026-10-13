/**
 * Shared pieces for the catalogue importers (import-products.ts,
 * import-snussie.ts): fetching, HTML clean-up, and mirroring images to R2.
 */

import * as cheerio from "cheerio";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";

// A plain, honest UA. Bot-style "(compatible; …)" strings get blocked by some WAFs.
export const HTTP_HEADERS = {
  "User-Agent": "HavenSnusImporter/1.0",
  Accept: "application/json",
};

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchWithRetry(url: string, init: RequestInit = {}, attempts = 3): Promise<Response> {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { ...init, headers: { ...HTTP_HEADERS, ...(init.headers ?? {}) } });
      if (!res.ok && res.status >= 500) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      if (i >= attempts) throw err;
      await sleep(1000 * i);
    }
  }
}

export function decode(html: string): string {
  return cheerio.load(`<div>${html}</div>`)("div").text().replace(/\s+/g, " ").trim();
}

/** Replace source shop names and domains with ours. */
export function rebrand(text: string): string {
  return text
    .replace(/snus\s*down\s*under/gi, "Haven Snus")
    .replace(/(?:https?:\/\/)?(?:www\.)?snusdownunder\.com/gi, "havensnus.com")
    .replace(/(?:https?:\/\/)?(?:www\.)?snussie\.com/gi, "havensnus.com")
    .replace(/\bsnussie\b/gi, "Haven Snus")
    // House style: no em dashes in copy.
    .replace(/\s*—\s*/g, ", ");
}

const ALLOWED_TAGS = new Set(["p", "h2", "h3", "h4", "ul", "ol", "li", "strong", "em", "br"]);

/** Keep simple structural markup only; drop links, scripts, attributes and the page title. */
export function sanitizeDescription(html: string): string {
  const $ = cheerio.load(`<div id="root">${html}</div>`);
  const root = $("#root");
  root.find("script, style, iframe, img, form, h1").remove();
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

export function firstParagraph(html: string): string {
  const $ = cheerio.load(html);
  const text = $("p").first().text() || $.root().text();
  const clean = rebrand(text.replace(/\s+/g, " ").trim());
  if (clean.length <= 220) return clean;
  const cut = clean.slice(0, 220);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

/** Our six-level scale, matching the ranges in the main catalogue. */
export function strengthLevelFor(mg: number | null): string | null {
  if (mg == null) return null;
  if (mg <= 3) return "Light";
  if (mg < 7) return "Regular";
  if (mg < 11) return "Strong";
  if (mg < 16) return "Extra Strong";
  if (mg < 25) return "Ultra Strong";
  return "Extreme";
}

export function buildFeatures(spec: {
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

// ─── R2 ──────────────────────────────────────────────────────────────────────

export function r2Client() {
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

/** Packshots are shown at most ~600px wide; 1000px covers 2x displays. */
const IMAGE_MAX_PX = 1000;

async function objectExists(s3: S3Client, bucket: string, key: string) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

/** Copy one source image into R2 as a web-sized WebP and return its public URL. */
export async function mirrorImage(s3: S3Client, src: string, slug: string, index: number): Promise<string> {
  const bucket = process.env.R2_BUCKET!;
  const publicUrl = process.env.R2_PUBLIC_URL!.replace(/\/$/, "");
  const key = `products/${slug}${index ? `-${index + 1}` : ""}.webp`;

  if (!(await objectExists(s3, bucket, key))) {
    const res = await fetch(src, { headers: { ...HTTP_HEADERS, Accept: "image/*" } });
    if (!res.ok) throw new Error(`image HTTP ${res.status}: ${src}`);
    const body = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize({ width: IMAGE_MAX_PX, height: IMAGE_MAX_PX, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
  }
  return `${publicUrl}/${key}`;
}

export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>) {
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
