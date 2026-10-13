"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types";
import { ProductPhoto } from "./product-photo";

interface ProductGalleryProps {
  images: ProductImage[];
  name: string;
  isNew?: boolean;
  isPopular?: boolean;
  onSale?: boolean;
}

export function ProductGallery({ images, name, isNew = false, isPopular = false, onSale = false }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];
  const thumbs = images.slice(0, 8);

  return (
    <div className="space-y-3">
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-slate-200"
        style={{ aspectRatio: "1 / 1" }}
      >
        <ProductPhoto
          key={current?.url ?? "empty"}
          src={current?.url}
          alt={current?.alt || name}
          name={name}
          priority
        />
        {onSale && <span className="badge-sale absolute left-4 top-4">Sale!</span>}
        {(isNew || isPopular) && (
          <span className="badge-label absolute right-4 top-4">{isNew ? "Brand New" : "Popular"}</span>
        )}
      </div>

      {thumbs.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {thumbs.map((img, i) => (
            <button
              key={img.id || img.url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View photo ${i + 1}`}
              className={cn(
                "relative aspect-square w-full overflow-hidden rounded-lg border-2 transition-colors",
                i === active ? "border-orange-500" : "border-slate-200 hover:border-orange-300"
              )}
            >
              <ProductPhoto src={img.url} alt={img.alt || `${name} photo ${i + 1}`} name={name} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
