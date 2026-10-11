"use client";

import Link from "next/link";
import type { Product } from "@/types";
import { ProductPhoto } from "./product-photo";
import { StrengthDots } from "./strength-dots";
import { Price } from "@/components/currency/price";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

/** Packshot on white, then brand, name, strength scale and price per can. */
export function ProductCard({ product, priority = false }: ProductCardProps) {
  const image = product.images[0];
  const hasDiscount = Boolean(
    product.compare_at_price && product.compare_at_price > product.price
  );

  return (
    <Link href={`/product/${product.slug}`} className="card-product group">
      <div className="relative w-full shrink-0 overflow-hidden" style={{ aspectRatio: "1 / 1" }}>
        <ProductPhoto
          src={image?.url}
          alt={image?.alt || product.name}
          name={product.name}
          priority={priority}
          className="transition-transform duration-[600ms] ease-out group-hover:scale-[1.05]"
        />

        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.is_new && <span className="badge-orange">New</span>}
          {!product.in_stock && <span className="badge-slate">Sold out</span>}
        </div>
      </div>

      <div className="flex flex-1 flex-col border-t border-slate-200 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="spec truncate text-[0.625rem] uppercase tracking-[0.16em] text-slate-500">
            {product.brand_name ?? product.brand}
          </span>
          {product.strength_mg != null && (
            <span className="spec shrink-0 text-[0.6875rem] font-medium text-slate-700">
              {product.strength_mg}mg
            </span>
          )}
        </div>

        <h3 className="mt-1.5 font-display text-[0.9375rem] font-bold leading-snug tracking-tight text-slate-900 line-clamp-2 transition-colors group-hover:text-orange-700">
          {product.flavour ?? product.name}
        </h3>
        {product.flavour && (
          <p className="mt-0.5 truncate text-xs text-slate-500">{product.product_line ?? product.name}</p>
        )}

        <div className="mt-auto pt-4">
          <StrengthDots level={product.strength_level} />
          <div className="mt-3 flex items-baseline gap-2 border-t border-slate-200 pt-3">
            <span className="font-display text-lg font-bold tabular text-slate-900">
              <Price amount={product.price} />
            </span>
            {hasDiscount && (
              <span className="spec text-xs text-slate-400">
                <Price amount={product.compare_at_price!} original />
              </span>
            )}
            <span className="ml-auto hidden text-[0.6875rem] text-slate-400 sm:inline">per can</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
