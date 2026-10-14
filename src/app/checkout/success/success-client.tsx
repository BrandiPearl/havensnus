"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import { useCurrency } from "@/components/currency/currency-provider";
import { useSettings } from "@/components/layout/settings-provider";
import { LAST_ORDER_KEY, orderEmailBody, type LastOrder } from "@/lib/last-order";

const noop = () => () => {};

function readLastOrder(): string {
  try {
    return window.sessionStorage.getItem(LAST_ORDER_KEY) ?? "";
  } catch {
    return "";
  }
}

/**
 * After checkout, prompt the customer to email us their order so the
 * conversation starts in our inbox. Opens their mail app once, with a
 * button as a fallback.
 */
export function CheckoutSuccess() {
  const ref = useSearchParams().get("ref");
  const { email } = useSettings();
  const { format } = useCurrency();
  const raw = useSyncExternalStore(noop, readLastOrder, () => "");
  const opened = useRef(false);

  let order: LastOrder | null = null;
  try {
    const parsed = raw ? (JSON.parse(raw) as LastOrder) : null;
    order = parsed && parsed.reference === ref ? parsed : null;
  } catch {
    order = null;
  }

  const subject = `Order ${ref ?? ""}`.trim();
  const body = order ? orderEmailBody(order, format) : `Hi Haven Snus,\n\nI have just placed order ${ref ?? ""}. Please send me the payment details.\n`;
  const href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  useEffect(() => {
    if (!order || opened.current) return;
    opened.current = true;
    // Only once per order: mark it so a refresh does not reopen the mail app.
    try {
      if (window.sessionStorage.getItem(`${LAST_ORDER_KEY}_opened`) === order.reference) return;
      window.sessionStorage.setItem(`${LAST_ORDER_KEY}_opened`, order.reference);
    } catch {
      // Storage blocked: still offer the button.
    }
    window.location.href = href;
  }, [order, href]);

  if (!ref) return null;

  return (
    <div className="mt-6">
      <p className="text-sm font-semibold text-orange-700">Reference {ref}</p>

      <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50/60 p-5 text-left">
        <h2 className="font-display text-base font-bold text-slate-900">Next step: email us your order</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          Your email app should have opened with your order filled in. Send it to <strong>{email}</strong> and
          we will reply with payment details. If it did not open, use the button below.
        </p>
        {order && (
          <ul className="mt-3 space-y-1 border-t border-orange-200 pt-3 text-sm text-slate-700">
            {order.items.map((i) => (
              <li key={i.name} className="flex justify-between gap-3">
                <span>
                  {i.qty} × {i.name}
                </span>
                <span className="shrink-0">{format(i.price * i.qty)}</span>
              </li>
            ))}
            <li className="flex justify-between gap-3 text-slate-500">
              <span>{order.shippingLabel}</span>
              <span>{format(order.shipping)}</span>
            </li>
            <li className="flex justify-between gap-3 font-bold text-slate-900">
              <span>Total (AUD)</span>
              <span>{format(order.total)}</span>
            </li>
          </ul>
        )}
        <a href={href} className="btn-primary mt-4 w-full justify-center py-3">
          <Mail className="h-4 w-4" />
          Email us this order
        </a>
      </div>
    </div>
  );
}
