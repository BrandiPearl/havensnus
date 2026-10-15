"use server";

import { revalidatePath } from "next/cache";
import { purgeStorefrontCache } from "@/lib/cache-purge";
import { redirect } from "next/navigation";
import {
  clearCmsSessionCookie,
  requireCmsSession,
  setCmsSessionCookie,
} from "@/lib/cms/auth";
import { expectedSessionToken } from "@/lib/cms/session";
import { BLOG_STATUSES, CONTACT_STATUSES, ORDER_STATUSES } from "@/lib/cms/constants";
import { bool, emptyToNull, lines, num, slugFrom, str, type ActionState } from "@/lib/cms/form";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailShell, mailConfigSummary, sendMail, staffInbox } from "@/lib/email/mailer";
import { contactStatusEmail, orderStatusEmail } from "@/lib/email/templates";

function adminOrThrow() {
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Supabase service role is not configured");
  }
  return admin;
}

function fail(error: string): ActionState {
  return { error };
}

function ok(success: string): ActionState {
  return { success };
}

/** Storefront pages are cached in R2; purge it so changes show on the next visit. */
async function revalidateStorefront() {
  await purgeStorefrontCache().catch((err) => console.error("purgeStorefrontCache:", err));
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const password = str(formData, "password");
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return fail("ADMIN_PASSWORD is not configured on the server.");
  }
  if (password !== expected) {
    return fail("That password is not correct.");
  }
  if (!(await expectedSessionToken())) {
    return fail("Could not start a CMS session.");
  }

  await setCmsSessionCookie();

  const next = str(formData, "next") || "/admin";
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logout() {
  await clearCmsSessionCookie();
  redirect("/admin/login");
}

export async function saveProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireCmsSession();
  const admin = adminOrThrow();

  const id = str(formData, "id");
  const name = str(formData, "name");
  const slug = slugFrom(formData);
  const sku = str(formData, "sku") || slug.toUpperCase().replace(/-/g, "").slice(0, 24);
  const price = num(formData, "price");
  const compareAt = num(formData, "compare_at_price");

  if (!name) return fail("Name is required.");
  if (!slug) return fail("Slug is required.");
  if (price == null || price < 0) return fail("Enter a valid price.");

  const payload = {
    name,
    slug,
    sku,
    description: str(formData, "description"),
    short_description: str(formData, "short_description"),
    price,
    compare_at_price: compareAt,
    brand: emptyToNull(str(formData, "brand")),
    product_line: emptyToNull(str(formData, "product_line")),
    tags: lines(formData, "tags").flatMap((line) =>
      line.split(",").map((tag) => tag.trim()).filter(Boolean)
    ),
    strength_mg: num(formData, "strength_mg"),
    strength_level: emptyToNull(str(formData, "strength_level")),
    flavour: emptyToNull(str(formData, "flavour")),
    flavour_family: emptyToNull(str(formData, "flavour_family")),
    pouch_format: emptyToNull(str(formData, "pouch_format")),
    pouches_per_tin: num(formData, "pouches_per_tin"),
    stock_quantity: num(formData, "stock_quantity"),
    is_featured: bool(formData, "is_featured"),
    is_new: bool(formData, "is_new"),
    in_stock: bool(formData, "in_stock"),
    is_active: bool(formData, "is_active"),
    seo_title: emptyToNull(str(formData, "seo_title")),
    seo_description: emptyToNull(str(formData, "seo_description")),
  };

  let productId = id;

  if (id) {
    const { error } = await admin.from("products").update(payload).eq("id", id);
    if (error) return fail(error.message);
  } else {
    const { data, error } = await admin
      .from("products")
      .insert({ ...payload, source_site: "manual" })
      .select("id")
      .single();
    if (error || !data) return fail(error?.message ?? "Could not create product.");
    productId = String(data.id);
  }

  const imageUrls = lines(formData, "images");
  const features = lines(formData, "features");

  const { error: imageDeleteError } = await admin.from("product_images").delete().eq("product_id", productId);
  if (imageDeleteError) return fail(imageDeleteError.message);

  if (imageUrls.length) {
    const { error } = await admin.from("product_images").insert(
      imageUrls.map((url, index) => ({
        product_id: productId,
        url,
        alt: `${name} photo ${index + 1}`,
        position: index,
        is_primary: index === 0,
      }))
    );
    if (error) return fail(error.message);
  }

  const { error: featureDeleteError } = await admin.from("product_features").delete().eq("product_id", productId);
  if (featureDeleteError) return fail(featureDeleteError.message);

  if (features.length) {
    const { error } = await admin.from("product_features").insert(
      features.map((feature, index) => ({
        product_id: productId,
        feature,
        position: index,
      }))
    );
    if (error) return fail(error.message);
  }

  await revalidateStorefront();
  redirect(`/admin/products/${productId}/edit`);
}

export async function deleteProduct(formData: FormData) {
  await requireCmsSession();
  const admin = adminOrThrow();
  const id = str(formData, "id");
  if (!id) return;
  const { error } = await admin.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await revalidateStorefront();
  redirect("/admin/products");
}

export async function saveBlogPost(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireCmsSession();
  const admin = adminOrThrow();

  const id = str(formData, "id");
  const title = str(formData, "title");
  const slug = slugFrom(formData, "title");
  const statusRaw = str(formData, "status");
  const status = BLOG_STATUSES.includes(statusRaw as (typeof BLOG_STATUSES)[number])
    ? statusRaw
    : "draft";

  if (!title) return fail("Title is required.");
  if (!slug) return fail("Slug is required.");

  const authorId = emptyToNull(str(formData, "author_id"));
  const payload = {
    title,
    slug,
    excerpt: str(formData, "excerpt"),
    content: str(formData, "content"),
    cover_image: emptyToNull(str(formData, "cover_image")),
    author_id: authorId,
    category: str(formData, "category") || "General",
    tags: lines(formData, "tags").flatMap((line) =>
      line.split(",").map((tag) => tag.trim()).filter(Boolean)
    ),
    status,
    read_time: num(formData, "read_time") ?? 5,
    seo_title: emptyToNull(str(formData, "seo_title")),
    seo_desc: emptyToNull(str(formData, "seo_desc")),
    published_at:
      status === "published" ? str(formData, "published_at") || new Date().toISOString() : emptyToNull(str(formData, "published_at")),
  };

  let postId = id;
  if (id) {
    const { error } = await admin.from("blog_posts").update(payload).eq("id", id);
    if (error) return fail(error.message);
  } else {
    const { data, error } = await admin.from("blog_posts").insert(payload).select("id").single();
    if (error || !data) return fail(error?.message ?? "Could not create post.");
    postId = String(data.id);
  }

  await revalidateStorefront();
  redirect(`/admin/blog/${postId}/edit`);
}

export async function deleteBlogPost(formData: FormData) {
  await requireCmsSession();
  const admin = adminOrThrow();
  const id = str(formData, "id");
  if (!id) return;
  const { error } = await admin.from("blog_posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await revalidateStorefront();
  redirect("/admin/blog");
}

export async function updateOrder(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireCmsSession();
  const admin = adminOrThrow();
  const id = str(formData, "id");
  const status = str(formData, "status");
  if (!id) return fail("Missing order.");
  if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) return fail("Pick a valid status.");

  const tracking = str(formData, "tracking_number");
  if (status === "shipped" && !tracking) return fail("Add a tracking number before marking the order shipped.");

  const { data: existing } = await admin
    .from("orders")
    .select("first_name, email, reference, status")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return fail("Order not found.");

  const { error } = await admin
    .from("orders")
    .update({
      status,
      tracking_number: emptyToNull(tracking),
      internal_notes: emptyToNull(str(formData, "internal_notes")),
    })
    .eq("id", id);
  if (error) return fail(error.message);

  let note = "Order saved.";
  if (existing.status !== status && status !== "pending" && bool(formData, "notify")) {
    const mail = orderStatusEmail({
      name: String(existing.first_name || "there"),
      reference: String(existing.reference),
      status,
      trackingNumber: tracking || undefined,
    });
    const result = await sendMail({ to: String(existing.email), ...mail });
    note = result.sent ? "Order saved and customer emailed." : "Order saved, but the email could not be sent.";
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return ok(note);
}

export async function updateContactStatus(formData: FormData) {
  await requireCmsSession();
  const admin = adminOrThrow();
  const id = str(formData, "id");
  const status = str(formData, "status");
  if (!id || !CONTACT_STATUSES.includes(status as (typeof CONTACT_STATUSES)[number])) return;
  const { data: existing } = await admin
    .from("contact_messages")
    .select("name, email")
    .eq("id", id)
    .maybeSingle();
  const { error } = await admin.from("contact_messages").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  if (existing?.email && (status === "replied" || status === "closed")) {
    const mail = contactStatusEmail({ name: String(existing.name || "there"), status });
    await sendMail({ to: String(existing.email), ...mail });
  }
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

export async function saveSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireCmsSession();
  const admin = adminOrThrow();

  const entries: [string, string][] = [
    ["business_name", str(formData, "business_name")],
    ["phone", str(formData, "phone")],
    ["email", str(formData, "email")],
    ["address", str(formData, "address")],
    ["seo_title", str(formData, "seo_title")],
    ["seo_description", str(formData, "seo_description")],
    ["announcement", str(formData, "announcement")],
    ["announcement_link_text", str(formData, "announcement_link_text")],
    ["announcement_link_url", str(formData, "announcement_link_url")],
  ];

  const rates: [string, number | null][] = [
    ["shipping_standard", num(formData, "shipping_standard")],
    ["shipping_express", num(formData, "shipping_express")],
    ["min_order", num(formData, "min_order")],
  ];
  for (const [key, value] of rates) {
    if (value == null || value < 0) return fail("Shipping amounts must be 0 or more.");
    const { error } = await admin.from("site_settings").upsert({ key, value }, { onConflict: "key" });
    if (error) return fail(error.message);
  }

  for (const [key, value] of entries) {
    const { error } = await admin.from("site_settings").upsert({ key, value }, { onConflict: "key" });
    if (error) return fail(error.message);
  }

  await revalidateStorefront();
  return ok("Settings saved.");
}

export async function saveTestimonial(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireCmsSession();
  const admin = adminOrThrow();

  const id = str(formData, "id");
  const name = str(formData, "name");
  const review = str(formData, "review");
  if (!name) return fail("Name is required.");
  if (!review) return fail("Review is required.");

  const payload = {
    name,
    location: emptyToNull(str(formData, "location")),
    rating: Math.min(5, Math.max(1, num(formData, "rating") ?? 5)),
    review,
    product: emptyToNull(str(formData, "product")),
    avatar_url: emptyToNull(str(formData, "avatar_url")),
    is_featured: bool(formData, "is_featured"),
    is_active: bool(formData, "is_active"),
    date: emptyToNull(str(formData, "date")),
  };

  if (id) {
    const { error } = await admin.from("testimonials").update(payload).eq("id", id);
    if (error) return fail(error.message);
  } else {
    const { error } = await admin.from("testimonials").insert(payload);
    if (error) return fail(error.message);
  }

  revalidatePath("/admin/testimonials");
  await revalidateStorefront();
  redirect("/admin/testimonials");
}

export async function deleteTestimonial(formData: FormData) {
  await requireCmsSession();
  const admin = adminOrThrow();
  const id = str(formData, "id");
  if (!id) return;
  const { error } = await admin.from("testimonials").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/testimonials");
  await revalidateStorefront();
  redirect("/admin/testimonials");
}

/** Clears every cached storefront page and data entry, e.g. after running the importer. */
export async function refreshSiteCache(): Promise<ActionState> {
  await requireCmsSession();
  const { purged } = await purgeStorefrontCache();
  return ok(`Site cache cleared (${purged} cached entries). Pages rebuild with fresh data on their next visit.`);
}

/** Sends a test email to the admin inbox and reports the exact SMTP result. */
export async function sendTestEmail(): Promise<ActionState> {
  await requireCmsSession();
  const config = mailConfigSummary();
  const result = await sendMail({
    to: staffInbox(),
    subject: "Haven Snus test email",
    html: emailShell("Test email", "<p style=\"margin:0;font-size:14px;\">If you can read this, order emails are working.</p>"),
    text: "If you can read this, order emails are working.",
  });
  const settings = `${config.user} via ${config.host}:${config.port}, password ${config.passwordLength} characters, sending to ${config.to}`;
  return result.sent
    ? ok(`Test email sent (${settings}). Check that inbox, including spam.`)
    : fail(`Sending failed: ${result.error ?? "unknown error"} (${settings}).`);
}
