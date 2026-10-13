import { revalidatePath } from "next/cache";

type R2ListResult = { objects: { key: string }[]; truncated: boolean; cursor?: string };
type R2BucketLike = {
  list(options: { prefix: string; cursor?: string; limit?: number }): Promise<R2ListResult>;
  delete(keys: string[]): Promise<void>;
};

const CACHE_PREFIX = "incremental-cache/";

/**
 * Drop every cached page and data entry so the storefront rebuilds with
 * fresh data on its next visit. On Cloudflare the cache lives in R2 and
 * there is no tag cache, so revalidatePath alone would not reach it.
 */
export async function purgeStorefrontCache(): Promise<{ purged: number }> {
  // Still useful under `next dev` / `next start`, where Next manages the cache.
  revalidatePath("/", "layout");

  let bucket: R2BucketLike | undefined;
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    bucket = (env as unknown as { NEXT_INC_CACHE_R2_BUCKET?: R2BucketLike }).NEXT_INC_CACHE_R2_BUCKET;
  } catch {
    return { purged: 0 };
  }
  if (!bucket) return { purged: 0 };

  let purged = 0;
  let cursor: string | undefined;
  do {
    const page = await bucket.list({ prefix: CACHE_PREFIX, cursor, limit: 1000 });
    const keys = page.objects.map((o) => o.key);
    if (keys.length) {
      await bucket.delete(keys);
      purged += keys.length;
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);

  return { purged };
}
