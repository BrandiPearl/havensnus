import { emailShell } from "@/lib/email/mailer";
import { formatAud } from "@/lib/utils";
import { absoluteUrl } from "@/lib/site";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rows(lines: string[]) {
  return lines
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 8px;font-size:14px;line-height:1.5;">${escapeHtml(line)}</p>`)
    .join("");
}

export type OrderEmailData = {
  reference: string;
  firstName: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  items: { name: string; sku: string; qty: number; price: number }[];
  subtotal: number;
  shipping: number;
  shippingMethod: string;
  total: number;
  displayTotal?: string;
  notes?: string;
};

function itemsTable(data: OrderEmailData) {
  const line = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:6px 0;font-size:14px;${bold ? "font-weight:700;" : "color:#4a5560;"}">${label}</td><td align="right" style="padding:6px 0;font-size:14px;${bold ? "font-weight:700;" : ""}">${value}</td></tr>`;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0 4px;">
      ${data.items
        .map(
          (item) =>
            `<tr><td style="padding:8px 0;border-bottom:1px solid #edf1f3;font-size:14px;">${item.qty} × ${escapeHtml(item.name)}</td><td align="right" style="padding:8px 0;border-bottom:1px solid #edf1f3;font-size:14px;white-space:nowrap;">${formatAud(item.price * item.qty)}</td></tr>`
        )
        .join("")}
      ${line("Subtotal", formatAud(data.subtotal))}
      ${line(escapeHtml(data.shippingMethod), formatAud(data.shipping))}
      ${line("Total (AUD)", formatAud(data.total), true)}
    </table>`;
}

function itemsText(data: OrderEmailData) {
  return [
    ...data.items.map((i) => `${i.qty} x ${i.name} (${i.sku}) ${formatAud(i.price * i.qty)}`),
    `Subtotal: ${formatAud(data.subtotal)}`,
    `${data.shippingMethod}: ${formatAud(data.shipping)}`,
    `Total (AUD): ${formatAud(data.total)}`,
  ].join("\n");
}

export function orderCustomerEmail(data: OrderEmailData) {
  const body = `
    <p style="margin:0 0 12px;font-size:14px;">Hi ${escapeHtml(data.firstName)},</p>
    <p style="margin:0 0 12px;font-size:14px;">Thanks for your order <strong>${escapeHtml(data.reference)}</strong>. We will email your payment details shortly. Your order ships with tracking as soon as payment is received.</p>
    ${itemsTable(data)}
    <p style="margin:16px 0 0;font-size:14px;"><strong>Ship to:</strong> ${escapeHtml(data.address)}</p>
    <p style="margin:16px 0 0;font-size:13px;color:#4a5560;">Questions? Just reply to this email.</p>
  `;
  return {
    subject: `Order ${data.reference} received · Haven Snus`,
    html: emailShell("Thanks for your order", body),
    text: `Hi ${data.firstName},\n\nThanks for your order ${data.reference}. We will email your payment details shortly, and your order ships with tracking once payment is received.\n\n${itemsText(data)}\n\nShip to: ${data.address}\n`,
  };
}

export function orderStaffEmail(data: OrderEmailData) {
  const body = `
    ${rows([
      `Reference: ${data.reference}`,
      `Customer: ${data.name}`,
      `Email: ${data.email}`,
      `Phone: ${data.phone}`,
      `Ship to: ${data.address}`,
    ])}
    ${itemsTable(data)}
    ${data.notes ? rows([`Notes: ${data.notes}`]) : ""}
    <p style="margin:18px 0 0;font-size:14px;">
      <a href="mailto:${escapeHtml(data.email)}?subject=${encodeURIComponent(`Your Haven Snus order ${data.reference}`)}" style="display:inline-block;background:#13806c;color:#ffffff;text-decoration:none;font-weight:700;padding:10px 16px;border-radius:6px;margin:0 8px 8px 0;">Reply to customer</a>
      <a href="tel:${escapeHtml(data.phone.replace(/[^\d+]/g, ""))}" style="display:inline-block;border:1px solid #13806c;color:#13806c;text-decoration:none;font-weight:700;padding:9px 16px;border-radius:6px;margin:0 8px 8px 0;">Call ${escapeHtml(data.phone)}</a>
    </p>
    <p style="margin:8px 0 0;font-size:13px;"><a href="${absoluteUrl("/admin/orders")}" style="color:#13806c;">Open orders in the CMS</a></p>
  `;
  return {
    subject: `New order ${data.reference} · ${formatAud(data.total)} · ${data.name}`,
    html: emailShell("New order", body),
    text: `New order ${data.reference}\n${data.name} · ${data.email} · ${data.phone}\n${data.address}\n\n${itemsText(data)}\n${data.notes ? `\nNotes: ${data.notes}\n` : ""}`,
  };
}

export function contactCustomerEmail(data: { name: string }) {
  const body = `
    <p style="margin:0 0 12px;font-size:14px;">Hi ${escapeHtml(data.name)},</p>
    <p style="margin:0;font-size:14px;">Thanks for getting in touch with Haven Snus. We usually reply within one business day.</p>
  `;
  return {
    subject: "We received your message · Haven Snus",
    html: emailShell("Message received", body),
    text: `Hi ${data.name},\n\nThanks for getting in touch. We usually reply within one business day.\n`,
  };
}

export function contactStaffEmail(data: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}) {
  const body = rows([
    `From: ${data.name}`,
    `Email: ${data.email}`,
    data.phone ? `Phone: ${data.phone}` : "",
    data.subject ? `Subject: ${data.subject}` : "",
    `Message: ${data.message}`,
  ]);
  return {
    subject: data.subject ? `Contact: ${data.subject}` : `Contact message from ${data.name}`,
    html: emailShell("New contact message", body),
    text: `${data.name} · ${data.email}\n${data.message}\n`,
  };
}

const ORDER_STATUS_COPY: Record<string, string> = {
  paid: "We have received your payment. Your order is now being packed.",
  processing: "Your order is being packed and will ship soon.",
  shipped: "Your order is on its way.",
  delivered: "Your order has been marked as delivered. Enjoy, and thanks for shopping with us.",
  cancelled: "Your order has been cancelled. If you did not expect this, reply to this email.",
  refunded: "Your refund has been processed. It can take a few business days to appear.",
};

export function orderStatusEmail(data: {
  name: string;
  reference: string;
  status: string;
  trackingNumber?: string;
}) {
  const message = ORDER_STATUS_COPY[data.status] ?? `Your order status is now ${data.status}.`;
  const tracking =
    data.status === "shipped" && data.trackingNumber
      ? `<p style="margin:12px 0 0;font-size:14px;"><strong>Tracking number:</strong> ${escapeHtml(data.trackingNumber)}</p>`
      : "";
  const body = `
    <p style="margin:0 0 12px;font-size:14px;">Hi ${escapeHtml(data.name)},</p>
    <p style="margin:0;font-size:14px;">${escapeHtml(message)}</p>
    ${tracking}
    <p style="margin:16px 0 0;font-size:13px;color:#4a5560;">Order reference: ${escapeHtml(data.reference)}</p>
  `;
  return {
    subject: `Order ${data.reference}: ${data.status} · Haven Snus`,
    html: emailShell("Order update", body),
    text: `Hi ${data.name},\n\n${message}\n${data.status === "shipped" && data.trackingNumber ? `Tracking number: ${data.trackingNumber}\n` : ""}\nOrder reference: ${data.reference}\n`,
  };
}

export function contactStatusEmail(data: { name: string; status: string }) {
  const copy: Record<string, string> = {
    replied: "We have replied to your message. If you do not see it, check your spam folder or reply here.",
    closed: "We have closed this conversation. Reply if you need anything else.",
  };
  const message = copy[data.status] ?? `Your message status is now ${data.status}.`;
  return {
    subject: "Update on your message · Haven Snus",
    html: emailShell("Message update", `<p style="margin:0 0 12px;font-size:14px;">Hi ${escapeHtml(data.name)},</p><p style="margin:0;font-size:14px;">${escapeHtml(message)}</p>`),
    text: `Hi ${data.name},\n\n${message}\n`,
  };
}
