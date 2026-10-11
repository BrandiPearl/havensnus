"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import type { AdminBrand, AdminProductListItem } from "@/lib/queries/cms";
import { formatAud } from "@/lib/utils";

export function ProductsTable({ products, brands }: { products: AdminProductListItem[]; brands: AdminBrand[] }) {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      if (brand && product.brand !== brand) return false;
      if (status === "active" && !product.is_active) return false;
      if (status === "hidden" && product.is_active) return false;
      if (status === "out" && product.in_stock) return false;
      if (!needle) return true;
      return [product.name, product.sku, product.slug]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [products, query, brand, status]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          className="input text-sm py-2 max-w-xs"
        />
        <select value={brand} onChange={(e) => setBrand(e.target.value)} className="input text-sm py-2 w-auto">
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b.slug} value={b.slug}>
              {b.name}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input text-sm py-2 w-auto">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="hidden">Hidden</option>
          <option value="out">Out of stock</option>
        </select>
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} shown</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Product</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">SKU</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Strength</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Price</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Status</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900 leading-snug">{product.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5 hidden sm:block">
                    {brands.find((b) => b.slug === product.brand)?.name ?? product.brand}
                    {product.is_featured ? " · Featured" : ""}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500 hidden md:table-cell font-mono text-xs">{product.sku}</td>
                <td className="px-4 py-3 hidden lg:table-cell font-mono text-xs text-slate-600">
                  {product.strength_mg != null ? `${product.strength_mg}mg` : "–"}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-900">{formatAud(product.price)}</td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        product.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {product.is_active ? "Active" : "Hidden"}
                    </span>
                    {!product.in_stock ? (
                      <span className="text-xs text-slate-400">Sold out</span>
                    ) : product.stock_quantity != null ? (
                      <span className="text-xs text-slate-400">{product.stock_quantity} in stock</span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <Link
                      href={`/product/${product.slug}`}
                      target="_blank"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="p-8 text-sm text-slate-500">No products match that search.</p>
        ) : null}
      </div>
    </div>
  );
}
