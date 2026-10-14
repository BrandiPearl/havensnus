"use client";

import Link from "next/link";
import { useCurrency } from "@/components/currency/currency-provider";
import { useSettings } from "@/components/layout/settings-provider";
import { minOrderShortfall } from "@/lib/shipping";

export function useMinOrder(subtotal: number) {
  const settings = useSettings();
  const shortfall = minOrderShortfall(subtotal, settings);
  return { minOrder: settings.min_order, shortfall, met: shortfall === 0 };
}

/** Shows how far the cart is from the minimum order, with a progress bar. */
export function MinOrderNotice({ subtotal }: { subtotal: number }) {
  const { format } = useCurrency();
  const { minOrder, shortfall, met } = useMinOrder(subtotal);
  if (met || minOrder <= 0) return null;
  const progress = Math.min(1, subtotal / minOrder);

  return (
    <div role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-3.5 text-sm text-slate-800">
      <p>
        Our minimum order is <strong>{format(minOrder)}</strong> before shipping. Add{" "}
        <strong>{format(shortfall)}</strong> more to check out.
      </p>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-amber-100">
        <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${progress * 100}%` }} />
      </div>
      <Link href="/products" className="mt-2.5 inline-block text-xs font-semibold text-orange-700 hover:underline">
        Keep shopping
      </Link>
    </div>
  );
}
