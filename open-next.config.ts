import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";

/**
 * Cached pages live in R2 and are served without rendering, which keeps
 * requests inside the Workers free plan's 10ms CPU budget.
 *
 * Deliberately no Durable Objects: a DO-backed tag cache is consulted on
 * every cache hit and exhausted the free plan's 100k DO requests/day, which
 * took the site down. Time-based revalidation runs through the memory queue
 * (self-request via WORKER_SELF_REFERENCE), and CMS saves purge the R2 cache
 * directly (src/lib/cache-purge.ts) instead of relying on a tag cache.
 */
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: memoryQueue,
  // Serve cache hits before the Next.js server boots: the biggest CPU saving.
  enableCacheInterception: true,
});
