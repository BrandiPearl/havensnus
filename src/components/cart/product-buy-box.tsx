"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Minus, Plus } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { cn } from "@/lib/utils";

type ProductInput = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  price: number;
  image?: string;
  in_stock: boolean;
};

const QUICK_QTY = [1, 5, 10];

export function ProductBuyBox({ product }: { product: ProductInput }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function add() {
    addItem(
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        sku: product.sku,
        price: product.price,
        image: product.image,
      },
      qty
    );
    setAdded(true);
  }

  if (!product.in_stock) {
    return (
      <div className="mt-7 flex flex-col gap-3">
        <button type="button" className="btn-primary w-full py-3.5 text-base" disabled>
          Sold out
        </button>
        <Link href="/contact" className="text-center text-sm text-slate-600 hover:text-orange-700">
          Ask us when it&rsquo;s back in stock
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-7 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="spec mr-1 text-[0.625rem] uppercase tracking-[0.14em] text-slate-500">Cans</span>
        {QUICK_QTY.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => {
              setQty(n);
              setAdded(false);
            }}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors",
              qty === n
                ? "border-orange-600 bg-orange-50 text-orange-800"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            )}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="inline-flex items-center rounded-lg border border-slate-200">
          <button
            type="button"
            className="p-3 text-slate-600 hover:text-slate-900"
            aria-label="Decrease quantity"
            onClick={() => {
              setQty((n) => Math.max(1, n - 1));
              setAdded(false);
            }}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center text-sm font-semibold tabular" aria-live="polite">{qty}</span>
          <button
            type="button"
            className="p-3 text-slate-600 hover:text-slate-900"
            aria-label="Increase quantity"
            onClick={() => {
              setQty((n) => Math.min(99, n + 1));
              setAdded(false);
            }}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <button type="button" className="btn-primary flex-1 py-3.5 text-base" onClick={add}>
          {added ? (
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Added to cart
            </span>
          ) : (
            "Add to cart"
          )}
        </button>
      </div>

      {added ? (
        <div className="flex gap-3">
          <Link href="/cart" className="btn-secondary flex-1 py-3 text-center">
            View cart
          </Link>
          <button type="button" className="btn-primary flex-1 py-3" onClick={() => router.push("/checkout")}>
            Checkout
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="btn-secondary w-full py-3.5 text-base"
          onClick={() => {
            add();
            router.push("/checkout");
          }}
        >
          Buy now
        </button>
      )}
    </div>
  );
}
