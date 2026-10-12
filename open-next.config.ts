import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import doShardedTagCache from "@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache";

/**
 * Cached pages live in R2 and are served without rendering, which keeps
 * requests inside the Workers free plan's 10ms CPU budget. Durable Objects
 * (SQLite, available on the free plan) handle background revalidation and
 * the tags that the CMS's revalidatePath() calls invalidate.
 */
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: "long-lived" }),
  queue: doQueue,
  tagCache: doShardedTagCache({ baseShardSize: 4 }),
  // Serve cache hits before the Next.js server boots: the biggest CPU saving.
  enableCacheInterception: true,
});
