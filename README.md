# Haven Snus

Storefront and CMS for havensnus.com: tobacco-free nicotine pouches for Australia and New Zealand.
Next.js 16 on Cloudflare Workers (OpenNext), Supabase for data, Cloudflare R2 for product images.

## Setup

1. Copy `.dev.vars.example` to `.env.local` and fill it in.
2. Run `supabase/schema.sql` once in the Supabase SQL editor.
3. `npm install`, then `npm run import` to load the catalogue.
4. `npm run dev` and open http://localhost:3000. The CMS is at `/admin`.

## Product import

`scripts/import-products.ts` pulls the catalogue from snusdownunder.com, converts images to WebP
(max 1000px) in R2, and upserts brands, products, images and features. Re-running it updates
products in place, matched on `(source_site, source_id)`.

- `npm run import` fetches and imports
- `npm run import:dry` fetches and prints a summary only
- `npm run import:cache` re-imports the last fetch

## How it works

- Prices are stored in AUD. NZ visitors see NZD at the daily rate from `/api/rates`.
- Checkout records an order in `orders` (no online payment). Prices and shipping are recalculated
  on the server. Staff mark orders paid and shipped in `/admin/orders`, which emails the customer.
- Shipping rates and the free-shipping threshold are edited in `/admin/settings`.
- Visitors confirm they are 18+ on first visit (`hs_age_ok` cookie). Australian orders also
  confirm a valid prescription at checkout.

## Caching (Workers free plan)

The free plan allows 10ms of CPU per request, which a Next.js render exceeds. So the storefront
is statically rendered and cached (ISR): pages are stored in R2 under `incremental-cache/` and
served before Next.js boots (`enableCacheInterception`). Pages refresh on their `revalidate`
interval, and CMS saves invalidate them immediately through the Durable Object tag cache.
Storefront code must not read `cookies()` or `headers()` (that makes a page dynamic again);
the age gate and currency are read in the browser instead. The CMS is `force-dynamic`.

## Deploy

`npm run deploy` builds with OpenNext and deploys the `havensnus` Worker. Set the same variables
as `.dev.vars.example` (except the `R2_*` ones) in the Cloudflare dashboard.
