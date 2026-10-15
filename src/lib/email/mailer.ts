import nodemailer from "nodemailer";

import { BUSINESS_EMAIL } from "@/lib/contact-info";

function fromAddress() {
  const user = process.env.SMTP_USER || BUSINESS_EMAIL;
  return process.env.MAIL_FROM || `Haven Snus <${user}>`;
}

export function staffInbox() {
  return process.env.MAIL_TO || process.env.SMTP_USER || BUSINESS_EMAIL;
}

/**
 * Resend (HTTPS API) is preferred when RESEND_API_KEY is set: Cloudflare
 * Workers cannot open sockets to Cloudflare-proxied hosts such as
 * smtp.hostinger.com, so SMTP only works for providers outside Cloudflare.
 */
function resendKey() {
  return process.env.RESEND_API_KEY || "";
}

export function isMailConfigured() {
  return Boolean(resendKey() || (process.env.SMTP_USER && process.env.SMTP_PASS));
}

async function sendViaResend(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}) {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromAddress(),
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        ...(options.replyTo ? { reply_to: options.replyTo } : {}),
      }),
    });
    if (res.ok) return { sent: true as const };
    const detail = await res.text().catch(() => "");
    console.error("sendMail (Resend):", res.status, detail);
    return { sent: false as const, error: `Resend ${res.status}: ${detail.slice(0, 300)}` };
  } catch (error) {
    console.error("sendMail (Resend):", error);
    return { sent: false as const, error: error instanceof Error ? error.message : String(error) };
  }
}

function transporter() {
  const user = process.env.SMTP_USER;
  const pass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user, pass },
  });
}

export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<{ sent: boolean; error?: string }> {
  if (resendKey()) return sendViaResend(options);
  const transport = transporter();
  if (!transport) {
    console.warn("Email skipped: SMTP_USER / SMTP_PASS are not set.");
    return { sent: false, error: "SMTP_USER / SMTP_PASS are not set on the server." };
  }

  try {
    await transport.sendMail({
      from: fromAddress(),
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    });
    return { sent: true };
  } catch (error) {
    console.error("sendMail:", error);
    return { sent: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** Mail settings as the running server sees them, minus the password. */
export function mailConfigSummary() {
  const pass = process.env.SMTP_PASS || "";
  return {
    provider: resendKey() ? "Resend API" : "SMTP",
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    user: process.env.SMTP_USER || "(not set)",
    from: fromAddress(),
    to: staffInbox(),
    passwordLength: pass.replace(/\s+/g, "").length,
  };
}

export function emailShell(title: string, bodyHtml: string) {
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f6f8f9;font-family:Arial,sans-serif;color:#131a20;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #dce2e6;">
          <tr>
            <td style="background:#131a20;padding:18px 24px;color:#ffffff;font-size:18px;font-weight:700;">
              Haven <span style="color:#3fb39b;">Snus</span>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <h1 style="margin:0 0 16px;font-size:20px;">${title}</h1>
              ${bodyHtml}
              <p style="margin:24px 0 0;font-size:13px;color:#64748b;">
                Haven Snus · havensnus.com · ${BUSINESS_EMAIL}<br />
                Nicotine products are for adults 18+ only.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
