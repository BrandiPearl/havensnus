import { createAdminClient } from "@/lib/supabase/admin";

export type OrderItem = { sku: string; name: string; qty: number; price: number };

export type AdminOrder = {
  id: string;
  reference: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
  items: OrderItem[];
  item_count: number;
  subtotal: number;
  shipping: number;
  total: number;
  display_total: string;
  notes: string;
  status: string;
  tracking_number: string;
  internal_notes: string;
  created_at: string;
};

export type ContactListItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
};

export type AdminProductListItem = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  brand: string;
  strength_mg: number | null;
  price: number;
  stock_quantity: number | null;
  in_stock: boolean;
  is_active: boolean;
  is_featured: boolean;
};

export type AdminProduct = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  description: string;
  short_description: string;
  price: number;
  compare_at_price: number | null;
  brand: string;
  product_line: string;
  tags: string[];
  strength_mg: number | null;
  strength_level: string;
  flavour: string;
  flavour_family: string;
  pouch_format: string;
  pouches_per_tin: number | null;
  stock_quantity: number | null;
  is_featured: boolean;
  is_new: boolean;
  in_stock: boolean;
  is_active: boolean;
  seo_title: string;
  seo_description: string;
  images: { url: string; alt: string }[];
  features: string[];
};

export type AdminBrand = { slug: string; name: string };

export type AdminTestimonial = {
  id: string;
  name: string;
  location: string;
  rating: number;
  review: string;
  product: string;
  avatar_url: string;
  is_featured: boolean;
  is_active: boolean;
  date: string;
};

export type AdminAuthor = {
  id: string;
  name: string;
};

function text(value: unknown) {
  return value == null ? "" : String(value);
}

function numOrNull(value: unknown) {
  return value == null || value === "" ? null : Number(value);
}

function mapOrder(row: Record<string, unknown>): AdminOrder {
  return {
    id: String(row.id),
    reference: text(row.reference),
    first_name: text(row.first_name),
    last_name: text(row.last_name),
    email: text(row.email),
    phone: text(row.phone),
    address_line1: text(row.address_line1),
    address_line2: text(row.address_line2),
    suburb: text(row.suburb),
    state: text(row.state),
    postcode: text(row.postcode),
    country: text(row.country),
    items: Array.isArray(row.items)
      ? (row.items as Record<string, unknown>[]).map((i) => ({
          sku: text(i.sku),
          name: text(i.name),
          qty: Number(i.qty ?? 0),
          price: Number(i.price ?? 0),
        }))
      : [],
    item_count: Number(row.item_count ?? 0),
    subtotal: Number(row.subtotal ?? 0),
    shipping: Number(row.shipping ?? 0),
    total: Number(row.total ?? 0),
    display_total: text(row.display_total),
    notes: text(row.notes),
    status: text(row.status) || "pending",
    tracking_number: text(row.tracking_number),
    internal_notes: text(row.internal_notes),
    created_at: text(row.created_at),
  };
}

export async function getOrders(limit = 100, status?: string): Promise<AdminOrder[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  let query = admin.from("orders").select("*").order("created_at", { ascending: false }).limit(limit);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;

  if (error) {
    console.error("getOrders:", error.message);
    return [];
  }
  return (data ?? []).map((row) => mapOrder(row as Record<string, unknown>));
}

export async function getContactMessages(limit = 50): Promise<ContactListItem[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("contact_messages")
    .select("id, name, email, phone, subject, message, status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getContactMessages:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: text(row.name),
    email: text(row.email),
    phone: text(row.phone),
    subject: text(row.subject),
    message: text(row.message),
    status: text(row.status) || "new",
    created_at: text(row.created_at),
  }));
}

export async function getAdminStats() {
  const admin = createAdminClient();
  const empty = { products: 0, inStock: 0, pendingOrders: 0, orders: 0, revenue30d: 0, newMessages: 0, posts: 0 };
  if (!admin) return empty;

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [products, inStock, pending, orders, recent, messages, posts] = await Promise.all([
    admin.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
    admin.from("products").select("id", { count: "exact", head: true }).eq("is_active", true).eq("in_stock", true),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("orders").select("id", { count: "exact", head: true }),
    admin.from("orders").select("total, status").gte("created_at", since).limit(5000),
    admin.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
    admin.from("blog_posts").select("id", { count: "exact", head: true }),
  ]);

  const revenue30d = (recent.data ?? [])
    .filter((o) => !["pending", "cancelled", "refunded"].includes(String(o.status)))
    .reduce((sum, o) => sum + Number(o.total ?? 0), 0);

  return {
    products: products.count ?? 0,
    inStock: inStock.count ?? 0,
    pendingOrders: pending.count ?? 0,
    orders: orders.count ?? 0,
    revenue30d,
    newMessages: messages.count ?? 0,
    posts: posts.count ?? 0,
  };
}

export async function getAdminProducts(): Promise<AdminProductListItem[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("products")
    .select("id, slug, sku, name, brand, strength_mg, price, stock_quantity, in_stock, is_active, is_featured")
    .order("name", { ascending: true })
    .limit(2000);

  if (error) {
    console.error("getAdminProducts:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    slug: text(row.slug),
    sku: text(row.sku),
    name: text(row.name),
    brand: text(row.brand),
    strength_mg: numOrNull(row.strength_mg),
    price: Number(row.price ?? 0),
    stock_quantity: numOrNull(row.stock_quantity),
    in_stock: Boolean(row.in_stock),
    is_active: Boolean(row.is_active),
    is_featured: Boolean(row.is_featured),
  }));
}

export async function getAdminBrands(): Promise<AdminBrand[]> {
  const admin = createAdminClient();
  if (!admin) return [];
  const { data, error } = await admin.from("brands").select("slug, name").order("name");
  if (error) {
    console.error("getAdminBrands:", error.message);
    return [];
  }
  return (data ?? []).map((row) => ({ slug: text(row.slug), name: text(row.name) }));
}

export async function getAdminProduct(id: string): Promise<AdminProduct | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("products")
    .select("*, product_images(*), product_features(*)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("getAdminProduct:", error.message);
    return null;
  }

  const row = data as Record<string, unknown>;
  const images = ((row.product_images as Record<string, unknown>[]) ?? [])
    .sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0))
    .map((img) => ({ url: text(img.url), alt: text(img.alt) }));

  const features = ((row.product_features as Record<string, unknown>[]) ?? [])
    .sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0))
    .map((item) => text(item.feature))
    .filter(Boolean);

  return {
    id: String(row.id ?? ""),
    slug: text(row.slug),
    sku: text(row.sku),
    name: text(row.name),
    description: text(row.description),
    short_description: text(row.short_description),
    price: Number(row.price ?? 0),
    compare_at_price: numOrNull(row.compare_at_price),
    brand: text(row.brand),
    product_line: text(row.product_line),
    tags: (row.tags as string[]) ?? [],
    strength_mg: numOrNull(row.strength_mg),
    strength_level: text(row.strength_level),
    flavour: text(row.flavour),
    flavour_family: text(row.flavour_family),
    pouch_format: text(row.pouch_format),
    pouches_per_tin: numOrNull(row.pouches_per_tin),
    stock_quantity: numOrNull(row.stock_quantity),
    is_featured: Boolean(row.is_featured),
    is_new: Boolean(row.is_new),
    in_stock: Boolean(row.in_stock),
    is_active: row.is_active !== false,
    seo_title: text(row.seo_title),
    seo_description: text(row.seo_description),
    images,
    features,
  };
}

export async function getAuthors(): Promise<AdminAuthor[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data, error } = await admin.from("authors").select("id, name").order("name");
  if (error) {
    console.error("getAuthors:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({ id: String(row.id), name: text(row.name) }));
}

function mapTestimonial(row: Record<string, unknown>): AdminTestimonial {
  return {
    id: String(row.id),
    name: text(row.name),
    location: text(row.location),
    rating: Number(row.rating ?? 5),
    review: text(row.review),
    product: text(row.product),
    avatar_url: text(row.avatar_url),
    is_featured: Boolean(row.is_featured),
    is_active: row.is_active !== false,
    date: text(row.date),
  };
}

export async function getAdminTestimonials(): Promise<AdminTestimonial[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data, error } = await admin.from("testimonials").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("getAdminTestimonials:", error.message);
    return [];
  }
  return (data ?? []).map((row) => mapTestimonial(row as Record<string, unknown>));
}

export async function getAdminTestimonial(id: string): Promise<AdminTestimonial | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin.from("testimonials").select("*").eq("id", id).maybeSingle();
  if (error || !data) {
    if (error) console.error("getAdminTestimonial:", error.message);
    return null;
  }
  return mapTestimonial(data as Record<string, unknown>);
}
