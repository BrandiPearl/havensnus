import type { ProductImage } from "@/types";

export function isUsableProductImage(url: string | undefined | null): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  if (u.endsWith(".svg")) return false;
  return u.startsWith("http://") || u.startsWith("https://") || u.startsWith("/");
}

/** Sort by position, drop unusable or duplicate URLs, and mark the first as primary. */
export function selectProductImages(images: ProductImage[]): ProductImage[] {
  const seen = new Set<string>();
  return [...images]
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.position - b.position)
    .filter((img) => {
      if (!isUsableProductImage(img.url) || seen.has(img.url)) return false;
      seen.add(img.url);
      return true;
    })
    .map((img, i) => ({ ...img, is_primary: i === 0 }));
}
