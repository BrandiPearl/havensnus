"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ShoppingCart } from "lucide-react";
import type { Product } from "@/types";
import { ProductPhoto } from "./product-photo";
import { StrengthDots } from "./strength-dots";
import { Price } from "@/components/currency/price";
import { useCart } from "@/components/cart/cart-provider";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

/**
 * Packshot with Sale / Brand New / Popular badges, then brand, flavour,
 * strength and price, with Add to cart on the card itself. Only the photo
 * and title are links, so the button is not nested inside an anchor.
 */
export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const image = product.images[0];
  const href = `/product/${product.slug}`;
  const onSale = Boolean(product.compare_at_price && product.compare_at_price > product.price);
  const label = product.is_new ? "Brand New" : product.is_featured ? "Popular" : null;

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 1800);
    return () => window.clearTimeout(timer);
  }, [added]);

  function add() {
    addItem({
      id: product.id,
      slug: product.slug,
      name: product.name,
      sku: product.sku,
      price: product.price,
      image: image?.url,
    });
    setAdded(true);
  }

  return (
    <div className="card-product group">
      <Link href={href} className="relative block w-full shrink-0 overflow-hidden" style={{ aspectRatio: "1 / 1" }}>
        <ProductPhoto
          src={image?.url}
          alt={image?.alt || product.name}
          name={product.name}
          priority={priority}
          className="transition-transform duration-[600ms] ease-out group-hover:scale-[1.05]"
        />
        {onSale && <span className="badge-sale absolute left-2.5 top-2.5">Sale!</span>}
        {label && <span className="badge-label absolute right-2.5 top-2.5">{label}</span>}
      </Link>

      <div className="flex flex-1 flex-col border-t border-slate-200 p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="spec truncate text-[0.625rem] uppercase tracking-[0.16em] text-slate-500">
            {product.brand_name ?? product.brand}
          </span>
          {product.strength_mg != null && (
            <span className="spec shrink-0 text-[0.6875rem] font-medium text-slate-700">{product.strength_mg}mg</span>
          )}
        </div>

        <Link href={href} className="mt-1.5">
          <h3 className="font-display text-[0.9375rem] font-bold leading-snug tracking-tight text-slate-900 line-clamp-2 transition-colors hover:text-orange-700">
            {product.flavour ?? product.name}
          </h3>
        </Link>
        {product.flavour && (
          <p className="mt-0.5 truncate text-xs text-slate-500">{product.product_line ?? product.name}</p>
        )}

        <div className="mt-auto pt-3">
          <StrengthDots level={product.strength_level} />
          <div className="mt-3 flex flex-wrap items-baseline gap-x-2 border-t border-slate-200 pt-3">
            {onSale && (
              <span className="spec text-xs text-slate-400">
                <Price amount={product.compare_at_price!} original />
              </span>
            )}
            <span className="font-display text-lg font-bold tabular text-slate-900">
              <Price amount={product.price} />
            </span>
          </div>
          <button
            type="button"
            onClick={add}
            disabled={!product.in_stock}
            aria-label={`Add ${product.name} to cart`}
            className={cn(
              "mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold transition-colors",
              added ? "bg-emerald-600 text-white" : "bg-orange-600 text-white hover:bg-orange-700",
              "disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            )}
          >
            {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
            {added ? "Added" : product.in_stock ? "Add to cart" : "Unavailable"}
          </button>
        </div>
      </div>
    </div>
  );
}
