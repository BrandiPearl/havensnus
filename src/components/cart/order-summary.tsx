"use client";

import { useCurrency } from "@/components/currency/currency-provider";
import { useSettings } from "@/components/layout/settings-provider";
import { shippingFor, shippingLabel, type ShippingMethod } from "@/lib/shipping";

/**
 * Subtotal, shipping and total. Without a method (on the cart page) shipping
 * is shown as chosen at checkout, starting from the standard rate.
 */
export function OrderSummaryLines({ subtotal, method }: { subtotal: number; method?: ShippingMethod }) {
  const { format } = useCurrency();
  const settings = useSettings();
  const shipping = method ? shippingFor(method, settings) : null;

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-slate-500">Subtotal</span>
        <span className="font-semibold text-slate-900">{format(subtotal)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-slate-500">{method ? shippingLabel(method) : "Shipping"}</span>
        <span className="font-semibold text-slate-900">
          {shipping != null ? format(shipping) : `From ${format(settings.shipping_standard)}`}
        </span>
      </div>
      <div className="flex items-center justify-between border-t border-slate-200 pt-3">
        <span className="font-semibold text-slate-900">{shipping != null ? "Total (AUD)" : "Subtotal (AUD)"}</span>
        <span className="font-display text-lg font-bold text-slate-900">{format(subtotal + (shipping ?? 0))}</span>
      </div>
      {shipping == null && (
        <p className="text-xs text-slate-500">Choose Standard or Express shipping at checkout.</p>
      )}
    </div>
  );
}
