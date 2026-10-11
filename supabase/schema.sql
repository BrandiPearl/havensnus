-- ============================================================
-- Haven Snus — Supabase Schema
-- ============================================================
-- Run this once in the Supabase SQL editor on a fresh project.
-- Product columns mirror the attributes on the source catalogue
-- (strength, flavour, pouch format, pouches per tin) so the
-- import script can populate them directly.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUM types
-- ============================================================

create type order_status as enum (
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
);

create type contact_status as enum ('new', 'read', 'replied', 'closed');

create type blog_post_status as enum ('draft', 'published', 'archived');

-- ============================================================
-- AUTHORS (for blog)
-- ============================================================

create table authors (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  bio         text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- BRANDS
-- ============================================================

create table brands (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  slug          text not null unique,
  description   text,
  logo_url      text,
  image_url     text,
  country       text,             -- e.g. "Sweden"
  position      int not null default 0,
  is_featured   boolean not null default false,
  is_active     boolean not null default true,
  seo_title     text,
  seo_desc      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- PRODUCTS
-- ============================================================

create table products (
  id                  uuid primary key default uuid_generate_v4(),
  slug                text not null unique,
  sku                 text not null unique,
  name                text not null,
  description         text,         -- sanitised HTML (p, h3, ul, li, strong, em)
  short_description   text,
  price               numeric(10, 2) not null,   -- AUD, per can
  compare_at_price    numeric(10, 2),            -- AUD, shown struck through
  brand               text references brands(slug) on update cascade on delete set null,
  product_line        text,         -- e.g. "ZYN Slim"
  tags                text[] not null default '{}',

  -- Pouch specs
  strength_mg         numeric(5, 1), -- nicotine per pouch, e.g. 16.5
  strength_level      text,         -- Light | Regular | Strong | Extra Strong | Ultra Strong | Extreme
  flavour             text,         -- e.g. "Black Menthol"
  flavour_family      text,         -- e.g. "Mint"
  pouch_format        text,         -- e.g. "Slim", "Mini"
  pouches_per_tin     int,

  -- Inventory
  stock_quantity      int,
  in_stock            boolean not null default true,

  -- Content flags
  is_featured         boolean not null default false,
  is_new              boolean not null default false,
  is_active           boolean not null default true,

  -- SEO
  seo_title           text,
  seo_description     text,
  seo_keywords        text[],

  -- Source tracking (for the import script)
  source_url          text,
  source_site         text,         -- 'snusdownunder' | 'manual'
  source_id           text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  unique (source_site, source_id)
);

create index products_brand_idx on products(brand);
create index products_strength_level_idx on products(strength_level);
create index products_flavour_family_idx on products(flavour_family);
create index products_in_stock_idx on products(in_stock);
create index products_is_featured_idx on products(is_featured);

-- ============================================================
-- PRODUCT IMAGES
-- ============================================================

create table product_images (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references products(id) on delete cascade,
  url         text not null,
  alt         text not null default '',
  position    int not null default 0,
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now()
);

create index product_images_product_id_idx on product_images(product_id);

-- ============================================================
-- PRODUCT FEATURES (bullet points)
-- ============================================================

create table product_features (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references products(id) on delete cascade,
  feature     text not null,
  position    int not null default 0
);

create index product_features_product_id_idx on product_features(product_id);

-- ============================================================
-- ORDERS (checkout submissions — AU and NZ only)
-- ============================================================

create table orders (
  id              uuid primary key default uuid_generate_v4(),
  reference       text not null unique,
  first_name      text not null,
  last_name       text not null,
  email           text not null,
  phone           text not null,
  address_line1   text not null,
  address_line2   text,
  suburb          text not null,
  state           text,             -- AU state / NZ region
  postcode        text not null,
  country         text not null check (country in ('AU', 'NZ')),
  items           jsonb not null,   -- [{ sku, name, qty, price }]
  item_count      int not null default 0,
  subtotal        numeric(10, 2) not null,   -- AUD
  shipping        numeric(10, 2) not null default 0,
  total           numeric(10, 2) not null,
  currency        text not null default 'AUD',
  display_total   text,             -- what the customer saw, e.g. "NZ$54.20"
  notes           text,
  age_confirmed   boolean not null default false,
  status          order_status not null default 'pending',
  tracking_number text,
  internal_notes  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index orders_status_idx on orders(status);
create index orders_created_at_idx on orders(created_at);

-- ============================================================
-- BLOG POSTS
-- ============================================================

create table blog_posts (
  id            uuid primary key default uuid_generate_v4(),
  slug          text not null unique,
  title         text not null,
  excerpt       text,
  content       text,
  cover_image   text,
  author_id     uuid references authors(id) on delete set null,
  category      text not null default 'General',
  tags          text[] not null default '{}',
  status        blog_post_status not null default 'draft',
  read_time     int,
  seo_title     text,
  seo_desc      text,
  seo_keywords  text[],
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index blog_posts_status_idx on blog_posts(status);
create index blog_posts_published_at_idx on blog_posts(published_at);

-- ============================================================
-- CONTACT MESSAGES
-- ============================================================

create table contact_messages (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  email       text not null,
  phone       text,
  subject     text,
  message     text not null,
  status      contact_status not null default 'new',
  created_at  timestamptz not null default now()
);

-- ============================================================
-- TESTIMONIALS
-- ============================================================

create table testimonials (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  location    text,
  rating      int not null default 5 check (rating between 1 and 5),
  review      text not null,
  product     text,             -- what they bought, e.g. "ZYN Cool Mint"
  avatar_url  text,
  is_featured boolean not null default false,
  is_active   boolean not null default true,
  date        date,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- CMS PAGES
-- ============================================================

create table cms_pages (
  id          uuid primary key default uuid_generate_v4(),
  slug        text not null unique,
  title       text not null,
  content     jsonb,
  seo_title   text,
  seo_desc    text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- SITE SETTINGS (key-value store for CMS)
-- ============================================================

create table site_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- UPDATED_AT triggers
-- ============================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger products_updated_at
  before update on products
  for each row execute function set_updated_at();

create trigger brands_updated_at
  before update on brands
  for each row execute function set_updated_at();

create trigger blog_posts_updated_at
  before update on blog_posts
  for each row execute function set_updated_at();

create trigger orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- The storefront reads with the anon key. All writes (CMS, checkout,
-- contact form, import script) go through the service role, which
-- bypasses RLS, so no public insert policies are needed.

alter table authors enable row level security;
alter table brands enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_features enable row level security;
alter table orders enable row level security;
alter table blog_posts enable row level security;
alter table contact_messages enable row level security;
alter table testimonials enable row level security;
alter table cms_pages enable row level security;
alter table site_settings enable row level security;

create policy "Public read authors"
  on authors for select using (true);

create policy "Public read brands"
  on brands for select using (is_active = true);

create policy "Public read products"
  on products for select using (is_active = true);

create policy "Public read product images"
  on product_images for select using (true);

create policy "Public read product features"
  on product_features for select using (true);

create policy "Public read published blog posts"
  on blog_posts for select using (status = 'published');

create policy "Public read active testimonials"
  on testimonials for select using (is_active = true);

create policy "Public read active cms pages"
  on cms_pages for select using (is_active = true);

create policy "Public read site settings"
  on site_settings for select using (true);

-- orders and contact_messages: no public policies (service role only).

-- ============================================================
-- IMAGES
-- ============================================================
-- Product images live in Cloudflare R2 (bucket: havensnusbucket),
-- served from R2_PUBLIC_URL. Supabase Storage is not used.
