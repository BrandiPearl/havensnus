"use client";

import { useCurrency } from "@/components/currency/currency-provider";
import { useSettings } from "@/components/layout/settings-provider";
import { shippingFor } from "@/lib/shipping";

/** Subtotal, shipping and total, plus progress to free shipping. */
export function OrderSummaryLines({ subtotal }: { subtotal: number }) {
  const { format } = useCurrency();
  const settings = useSettings();
  const shipping = shippingFor(subtotal, settings);
  const remaining = settings.free_shipping_threshold - subtotal;
  const progress = settings.free_shipping_threshold > 0 ? Math.min(1, subtotal / settings.free_shipping_threshold) : 1;

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-slate-500">Subtotal</span>
        <span className="font-semibold text-slate-900">{format(subtotal)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-slate-500">Tracked shipping</span>
        <span className="font-semibold text-slate-900">{shipping === 0 ? "Free" : format(shipping)}</span>
      </div>
      <div className="flex items-center justify-between border-t border-slate-200 pt-3">
        <span className="font-semibold text-slate-900">Total (AUD)</span>
        <span className="font-display text-lg font-bold text-slate-900">{format(subtotal + shipping)}</span>
      </div>

      {settings.free_shipping_threshold > 0 && (
        <div className="pt-2">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-orange-600 transition-all" style={{ width: `${progress * 100}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {remaining > 0 ? (
              <>Add {format(remaining)} more for free shipping.</>
            ) : (
              <span className="font-semibold text-emerald-700">You&rsquo;ve unlocked free shipping.</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
