import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Brand } from "@/types";
import { ProductPhoto } from "@/components/ui/product-photo";

export function BrandTile({ brand, priority = false }: { brand: Brand; priority?: boolean }) {
  return (
    <Link href={`/products?brand=${brand.slug}`} className="card-product group">
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "1 / 1" }}>
        <ProductPhoto
          src={brand.logo_url || brand.image_url}
          alt={`${brand.name} nicotine pouches`}
          name={brand.name}
          priority={priority}
          className="transition-transform duration-[600ms] ease-out group-hover:scale-[1.05]"
        />
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-4 py-3.5">
        <div className="min-w-0">
          <h3 className="truncate font-display text-[0.9375rem] font-bold tracking-tight text-slate-900 group-hover:text-orange-700">
            {brand.name}
          </h3>
          <p className="spec mt-0.5 text-[0.6875rem] text-slate-500">{brand.product_count} products</p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 -translate-x-1 text-slate-400 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
      </div>
    </Link>
  );
}
