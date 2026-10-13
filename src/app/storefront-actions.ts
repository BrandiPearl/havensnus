"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail, staffInbox, isMailConfigured } from "@/lib/email/mailer";
import {
  contactCustomerEmail,
  contactStaffEmail,
  orderCustomerEmail,
  orderStaffEmail,
} from "@/lib/email/templates";
import { BUSINESS_EMAIL } from "@/lib/contact-info";
import { getSiteSettings } from "@/lib/queries/settings";
import { isShippingMethod, shippingFor, shippingLabel } from "@/lib/shipping";
import { MAX_QTY_PER_LINE, createOrderReference, type OrderInput } from "@/lib/orders";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown, max = 200) {
  return String(value ?? "").trim().slice(0, max);
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export async function submitOrder(
  input: OrderInput
): Promise<{ success: boolean; error?: string; reference?: string }> {
  const admin = createAdminClient();
  if (!admin) {
    return { success: false, error: `Checkout is unavailable right now. Email ${BUSINESS_EMAIL} to order.` };
  }

  const customer = {
    first_name: clean(input.first_name, 80),
    last_name: clean(input.last_name, 80),
    email: clean(input.email, 200).toLowerCase(),
    phone: clean(input.phone, 40),
    address_line1: clean(input.address_line1),
    address_line2: clean(input.address_line2) || null,
    suburb: clean(input.suburb, 100),
    state: clean(input.state, 60),
    postcode: clean(input.postcode, 10),
    notes: clean(input.notes, 2000) || null,
  };
  const country = input.country === "AU" ? "AU" : null;

  if (!country) return { success: false, error: "We currently ship within Australia only." };
  if (!customer.first_name || !customer.last_name) return { success: false, error: "Enter your full name." };
  if (!EMAIL_RE.test(customer.email)) return { success: false, error: "Enter a valid email address." };
  if (!customer.phone) return { success: false, error: "Enter a phone number for the courier." };
  if (!customer.address_line1 || !customer.suburb || !customer.postcode) {
    return { success: false, error: "Enter your full delivery address." };
  }
  if (!/^\d{4}$/.test(customer.postcode)) {
    return { success: false, error: "Enter a 4-digit Australian postcode." };
  }
  if (!input.age_confirmed) return { success: false, error: "Please confirm you are 18 or older." };
  if (!customer.state) return { success: false, error: "Select your state." };
  if (!isShippingMethod(input.shipping_method)) return { success: false, error: "Choose Standard or Express shipping." };
  const method = input.shipping_method;
  if (!input.prescription_confirmed) {
    return { success: false, error: "Australian orders require confirmation that you hold a valid prescription." };
  }

  // Merge duplicate lines and clamp quantities; prices always come from the database.
  const qtyById = new Map<string, number>();
  for (const item of input.items ?? []) {
    const qty = Math.floor(Number(item.qty));
    if (!item.id || !Number.isFinite(qty) || qty <= 0) continue;
    qtyById.set(item.id, Math.min(MAX_QTY_PER_LINE, (qtyById.get(item.id) ?? 0) + qty));
  }
  if (qtyById.size === 0) return { success: false, error: "Your cart is empty." };

  const { data: rows, error: productError } = await admin
    .from("products")
    .select("id, name, sku, price, in_stock, is_active")
    .in("id", [...qtyById.keys()]);
  if (productError) return { success: false, error: "Could not check stock. Please try again." };

  const items = [];
  for (const [id, qty] of qtyById) {
    const row = rows?.find((r) => r.id === id);
    if (!row || !row.is_active) return { success: false, error: "An item in your cart is no longer available. Please remove it and try again." };
    if (!row.in_stock) return { success: false, error: `${row.name} has just sold out. Please remove it to continue.` };
    items.push({ id, sku: String(row.sku), name: String(row.name), qty, price: Number(row.price) });
  }

  const settings = await getSiteSettings();
  const subtotal = round2(items.reduce((sum, i) => sum + i.price * i.qty, 0));
  const shipping = round2(shippingFor(method, settings));
  const total = round2(subtotal + shipping);
  const reference = createOrderReference();

  const { error: insertError } = await admin.from("orders").insert({
    reference,
    ...customer,
    country,
    items: items.map(({ sku, name, qty, price }) => ({ sku, name, qty, price })),
    item_count: items.reduce((sum, i) => sum + i.qty, 0),
    subtotal,
    shipping,
    total,
    currency: "AUD",
    display_total: clean(input.display_total, 40) || null,
    age_confirmed: true,
    internal_notes: `${shippingLabel(method)}. Customer confirmed a valid prescription at checkout.`,
    status: "pending",
  });
  if (insertError) {
    console.error("submitOrder insert:", insertError.message);
    return { success: false, error: "Could not place your order. Please try again." };
  }

  // The order is saved; email is best-effort so a mail outage never loses an order.
  if (isMailConfigured()) {
    const address = [customer.address_line1, customer.address_line2, customer.suburb, customer.state, customer.postcode, "Australia"]
      .filter(Boolean)
      .join(", ");
    const data = {
      reference,
      firstName: customer.first_name,
      name: `${customer.first_name} ${customer.last_name}`,
      email: customer.email,
      phone: customer.phone,
      address,
      items,
      subtotal,
      shipping,
      shippingMethod: shippingLabel(method),
      total,
      displayTotal: clean(input.display_total, 40) || undefined,
      notes: customer.notes ?? undefined,
    } as const;
    await Promise.all([
      sendMail({ to: customer.email, ...orderCustomerEmail(data) }),
      sendMail({ to: staffInbox(), ...orderStaffEmail(data), replyTo: customer.email }),
    ]);
  }

  return { success: true, reference };
}

export async function submitContactMessage(data: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  const message = {
    name: clean(data.name, 120),
    email: clean(data.email, 200),
    phone: clean(data.phone, 40) || null,
    subject: clean(data.subject, 200) || null,
    message: clean(data.message, 5000),
  };
  if (!message.name || !EMAIL_RE.test(message.email) || !message.message) {
    return { success: false, error: "Please fill in your name, a valid email and a message." };
  }

  const admin = createAdminClient();
  if (admin) {
    const { error } = await admin.from("contact_messages").insert({ ...message, status: "new" });
    if (error) {
      console.error("submitContactMessage:", error.message);
      return { success: false, error: "Could not send your message. Please try again." };
    }
  } else if (!isMailConfigured()) {
    return { success: false, error: `Messaging is unavailable right now. Email ${BUSINESS_EMAIL} instead.` };
  }

  if (isMailConfigured()) {
    const details = {
      name: message.name,
      email: message.email,
      phone: message.phone ?? undefined,
      subject: message.subject ?? undefined,
      message: message.message,
    };
    await Promise.all([
      sendMail({ to: message.email, ...contactCustomerEmail({ name: message.name }) }),
      sendMail({ to: staffInbox(), ...contactStaffEmail(details), replyTo: message.email }),
    ]);
  }

  return { success: true };
}
