"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { useCurrency } from "@/components/currency/currency-provider";
import { OrderSummaryLines } from "@/components/cart/order-summary";
import { QtyInput } from "@/components/cart/qty-input";

export function CartView() {
  const { items, ready, setQty, removeItem, subtotal } = useCart();
  const { format } = useCurrency();

  if (!ready) {
    return <p className="text-sm text-slate-500">Loading cart…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <h2 className="text-lg font-bold text-slate-900">Your cart is empty</h2>
        <p className="mt-2 text-sm text-slate-500">Find your flavour and strength in the shop.</p>
        <Link href="/products" className="btn-primary mt-6 inline-flex px-5 py-2.5 text-sm">
          Shop pouches
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4">
            <Link href={`/product/${item.slug}`} className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-white sm:h-24 sm:w-24">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt={item.name} className="absolute inset-0 h-full w-full object-contain p-1.5" />
              ) : null}
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/product/${item.slug}`} className="font-semibold leading-snug text-slate-900 hover:text-orange-700">
                {item.name}
              </Link>
              <div className="mt-0.5 text-xs text-slate-500">{format(item.price)} per can</div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <QtyInput
                  size="sm"
                  value={item.qty}
                  onChange={(n) => setQty(item.id, n)}
                  label={`Quantity of ${item.name}`}
                />
                <div className="font-bold text-slate-900">{format(item.price * item.qty)}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="self-start p-2 text-slate-400 hover:text-red-600"
              aria-label={`Remove ${item.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-bold text-slate-900">Order summary</h2>
        <OrderSummaryLines subtotal={subtotal} />
        <Link href="/checkout" className="btn-primary mt-5 w-full justify-center py-3 text-sm">
          Continue to checkout
        </Link>
        <Link href="/products" className="mt-3 block text-center text-xs font-semibold text-slate-500 hover:text-orange-700">
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}
