"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/ui/product-card";
import { StrengthDots } from "@/components/ui/strength-dots";
import { cn } from "@/lib/utils";
import { STRENGTH_LEVELS, facetSlug, strengthRank } from "@/lib/catalog";
import type { Brand, FilterState, Product, SortOption } from "@/types";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "strength-asc", label: "Strength: low to high" },
  { value: "strength-desc", label: "Strength: high to low" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "newest", label: "Newest" },
  { value: "az", label: "A–Z" },
];

const PAGE_SIZE = 48;

type Facet = { value: string; label: string; count: number };

function listParam(params: URLSearchParams, key: string) {
  return (params.get(key) ?? "").split(",").map((v) => v.trim()).filter(Boolean);
}

function filtersFromParams(params: URLSearchParams): FilterState {
  const sort = params.get("sort") as SortOption | null;
  return {
    brands: listParam(params, "brand"),
    strengths: listParam(params, "strength"),
    flavours: listParam(params, "flavour"),
    formats: listParam(params, "format"),
    inStock: params.get("stock") === "1",
    search: params.get("q") || undefined,
    sort: sort && SORT_OPTIONS.some((o) => o.value === sort) ? sort : "featured",
  };
}

function paramsFromFilters(f: FilterState) {
  const params = new URLSearchParams();
  if (f.brands.length) params.set("brand", f.brands.join(","));
  if (f.strengths.length) params.set("strength", f.strengths.join(","));
  if (f.flavours.length) params.set("flavour", f.flavours.join(","));
  if (f.formats.length) params.set("format", f.formats.join(","));
  if (f.inStock) params.set("stock", "1");
  if (f.search) params.set("q", f.search);
  if (f.sort !== "featured") params.set("sort", f.sort);
  return params.toString();
}

function facetCounts(products: Product[], pick: (p: Product) => string | undefined): Map<string, Facet> {
  const map = new Map<string, Facet>();
  for (const p of products) {
    const label = pick(p);
    if (!label) continue;
    const value = facetSlug(label);
    const facet = map.get(value) ?? { value, label, count: 0 };
    facet.count++;
    map.set(value, facet);
  }
  return map;
}

export function ProductsClient({ products: catalog, brands }: { products: Product[]; brands: Brand[] }) {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<FilterState>(() => filtersFromParams(searchParams));
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Follow navigations from the header menu and search dialog (adjust state during render).
  const paramsKey = searchParams.toString();
  const [syncedKey, setSyncedKey] = useState(paramsKey);
  if (paramsKey !== syncedKey) {
    const next = filtersFromParams(searchParams);
    setSyncedKey(paramsKey);
    setFilters(next);
    setSearchInput(next.search ?? "");
  }

  // "Show more" resets whenever the filters change.
  const filterKey = paramsFromFilters(filters);
  const [page, setPage] = useState({ key: filterKey, count: PAGE_SIZE });
  const visible = page.key === filterKey ? page.count : PAGE_SIZE;

  // Keep the URL shareable without triggering a server round trip.
  useEffect(() => {
    const url = filterKey ? `/products?${filterKey}` : "/products";
    if (url !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", url);
    }
  }, [filterKey]);

  const facets = useMemo(() => {
    const brandFacets = new Map<string, Facet>(
      brands.map((b) => [b.slug, { value: b.slug, label: b.name, count: 0 }])
    );
    for (const p of catalog) {
      if (!p.brand) continue;
      const f = brandFacets.get(p.brand) ?? { value: p.brand, label: p.brand_name ?? p.brand, count: 0 };
      f.count++;
      brandFacets.set(p.brand, f);
    }
    const strengths = facetCounts(catalog, (p) => p.strength_level);
    return {
      brands: [...brandFacets.values()].filter((f) => f.count > 0),
      strengths: STRENGTH_LEVELS.map((level) => strengths.get(facetSlug(level))).filter(Boolean) as Facet[],
      flavours: [...facetCounts(catalog, (p) => p.flavour_family).values()].sort((a, b) => b.count - a.count),
      formats: [...facetCounts(catalog, (p) => p.pouch_format).values()].sort((a, b) => b.count - a.count),
    };
  }, [catalog, brands]);

  const filtered = useMemo(() => {
    const has = (list: string[], label?: string) => list.length === 0 || (label ? list.includes(facetSlug(label)) : false);
    let products = catalog.filter(
      (p) =>
        (filters.brands.length === 0 || (p.brand ? filters.brands.includes(p.brand) : false)) &&
        has(filters.strengths, p.strength_level) &&
        has(filters.flavours, p.flavour_family) &&
        has(filters.formats, p.pouch_format) &&
        (!filters.inStock || p.in_stock)
    );

    if (filters.search) {
      const terms = filters.search.toLowerCase().split(/\s+/).filter(Boolean);
      products = products.filter((p) => {
        const hay = [p.name, p.brand_name, p.flavour, p.flavour_family, p.strength_level, p.pouch_format, p.sku, `${p.strength_mg}mg`]
          .join(" ")
          .toLowerCase();
        return terms.every((t) => hay.includes(t));
      });
    }

    const sorted = [...products];
    switch (filters.sort) {
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "strength-asc":
        sorted.sort((a, b) => (a.strength_mg ?? 99) - (b.strength_mg ?? 99) || strengthRank(a.strength_level) - strengthRank(b.strength_level));
        break;
      case "strength-desc":
        sorted.sort((a, b) => (b.strength_mg ?? 0) - (a.strength_mg ?? 0));
        break;
      case "newest":
        sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
        break;
      case "az":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // Server order: in stock, then featured, then name.
        break;
    }
    return sorted;
  }, [catalog, filters]);

  const labelFor = (list: Facet[], value: string) => list.find((f) => f.value === value)?.label ?? value;
  const remove = (key: "brands" | "strengths" | "flavours" | "formats", value: string) =>
    setFilters((p) => ({ ...p, [key]: p[key].filter((v) => v !== value) }));

  const chips = [
    ...filters.brands.map((v) => ({ key: `b-${v}`, label: labelFor(facets.brands, v), onRemove: () => remove("brands", v) })),
    ...filters.strengths.map((v) => ({ key: `s-${v}`, label: labelFor(facets.strengths, v), onRemove: () => remove("strengths", v) })),
    ...filters.flavours.map((v) => ({ key: `f-${v}`, label: labelFor(facets.flavours, v), onRemove: () => remove("flavours", v) })),
    ...filters.formats.map((v) => ({ key: `p-${v}`, label: labelFor(facets.formats, v), onRemove: () => remove("formats", v) })),
    ...(filters.inStock ? [{ key: "stock", label: "In stock", onRemove: () => setFilters((p) => ({ ...p, inStock: false })) }] : []),
    ...(filters.search
      ? [{ key: "q", label: `“${filters.search}”`, onRemove: () => { setSearchInput(""); setFilters((p) => ({ ...p, search: undefined })); } }]
      : []),
  ];

  const singleBrand = filters.brands.length === 1 ? labelFor(facets.brands, filters.brands[0]) : null;
  const heading = singleBrand ? `${singleBrand} Nicotine Pouches` : "Nicotine Pouches";

  function clearAll() {
    setSearchInput("");
    setFilters({ brands: [], strengths: [], flavours: [], formats: [], inStock: false, sort: filters.sort });
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-200 bg-slate-50">
        <div className="container-wide py-12 lg:py-14">
          <p className="eyebrow">Shop</p>
          <h1 className="display-lg text-slate-900">{heading}</h1>
          <p className="spec mt-5 text-[0.8125rem] uppercase tracking-[0.14em] text-slate-500">
            {filtered.length} of {catalog.length} products
          </p>

          {chips.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {chips.map((chip) => (
                <FilterChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
              ))}
              <button onClick={clearAll} className="text-xs font-semibold text-slate-500 underline-offset-4 hover:text-slate-900 hover:underline">
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="container-wide py-8">
        <div className="flex gap-8">
          <aside className="hidden w-60 flex-shrink-0 lg:block">
            <FilterSidebar filters={filters} setFilters={setFilters} facets={facets} />
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {chips.length > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-xs font-semibold text-white">
                    {chips.length}
                  </span>
                )}
              </button>

              <form
                className="flex min-w-[180px] max-w-sm flex-1 items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setFilters((p) => ({ ...p, search: searchInput.trim() || undefined }));
                }}
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search flavour, brand, mg…"
                    className="input py-2 pl-9 text-sm"
                    aria-label="Search products"
                  />
                </div>
              </form>

              <div className="ml-auto flex items-center gap-2">
                <span className="hidden text-xs text-slate-500 sm:block">Sort by</span>
                <select
                  value={filters.sort}
                  onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value as SortOption }))}
                  className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-orange-400 focus:outline-none"
                  aria-label="Sort products"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-sm text-slate-500">No pouches match these filters.</p>
                <button onClick={clearAll} className="btn-secondary mt-4 px-4 py-2 text-sm">
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
                  {filtered.slice(0, visible).map((product, i) => (
                    <ProductCard key={product.id} product={product} priority={i < 8} />
                  ))}
                </div>
                {visible < filtered.length && (
                  <div className="mt-10 text-center">
                    <button className="btn-secondary px-6 py-3" onClick={() => setPage({ key: filterKey, count: visible + PAGE_SIZE })}>
                      Show more ({filtered.length - visible} left)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute bottom-0 right-0 top-0 flex w-80 max-w-[85vw] flex-col bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <h2 className="font-semibold text-slate-900">Filters</h2>
              <button onClick={() => setSidebarOpen(false)} className="rounded-md p-1 hover:bg-slate-100" aria-label="Close filters">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <FilterSidebar filters={filters} setFilters={setFilters} facets={facets} />
            </div>
            <div className="border-t border-slate-200 p-4">
              <button className="btn-primary w-full" onClick={() => setSidebarOpen(false)}>
                Show {filtered.length} products
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type Facets = { brands: Facet[]; strengths: Facet[]; flavours: Facet[]; formats: Facet[] };

function FilterSidebar({
  filters,
  setFilters,
  facets,
}: {
  filters: FilterState;
  setFilters: Dispatch<SetStateAction<FilterState>>;
  facets: Facets;
}) {
  const toggle = (key: "brands" | "strengths" | "flavours" | "formats", value: string) =>
    setFilters((p) => ({
      ...p,
      [key]: p[key].includes(value) ? p[key].filter((v) => v !== value) : [...p[key], value],
    }));

  return (
    <div className="space-y-7">
      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={filters.inStock}
          onChange={(e) => setFilters((p) => ({ ...p, inStock: e.target.checked }))}
          className="h-4 w-4 rounded border-slate-300 accent-orange-600"
        />
        In stock only
      </label>

      <FacetGroup title="Strength">
        {facets.strengths.map((f) => (
          <FacetOption
            key={f.value}
            label={f.label}
            count={f.count}
            checked={filters.strengths.includes(f.value)}
            onChange={() => toggle("strengths", f.value)}
            extra={<StrengthDots level={f.label} />}
          />
        ))}
      </FacetGroup>

      <FacetGroup title="Brand" collapsible={facets.brands.length > 10}>
        {facets.brands.map((f) => (
          <FacetOption
            key={f.value}
            label={f.label}
            count={f.count}
            checked={filters.brands.includes(f.value)}
            onChange={() => toggle("brands", f.value)}
          />
        ))}
      </FacetGroup>

      <FacetGroup title="Flavour">
        {facets.flavours.map((f) => (
          <FacetOption
            key={f.value}
            label={f.label}
            count={f.count}
            checked={filters.flavours.includes(f.value)}
            onChange={() => toggle("flavours", f.value)}
          />
        ))}
      </FacetGroup>

      <FacetGroup title="Pouch format">
        {facets.formats.map((f) => (
          <FacetOption
            key={f.value}
            label={f.label}
            count={f.count}
            checked={filters.formats.includes(f.value)}
            onChange={() => toggle("formats", f.value)}
          />
        ))}
      </FacetGroup>
    </div>
  );
}

function FacetGroup({
  title,
  collapsible = false,
  children,
}: {
  title: string;
  collapsible?: boolean;
  children: React.ReactNode[];
}) {
  const [expanded, setExpanded] = useState(false);
  const items = collapsible && !expanded ? children.slice(0, 10) : children;
  return (
    <div>
      <h3 className="spec mb-3 text-[0.625rem] uppercase tracking-[0.16em] text-slate-500">{title}</h3>
      <ul className="space-y-0.5">{items}</ul>
      {collapsible && (
        <button
          className="mt-2 px-2 text-xs font-semibold text-orange-700 hover:text-orange-600"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show fewer" : `Show all ${children.length}`}
        </button>
      )}
    </div>
  );
}

function FacetOption({
  label,
  count,
  checked,
  onChange,
  extra,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <li>
      <label
        className={cn(
          "flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
          checked ? "bg-orange-50 font-semibold text-orange-800" : "text-slate-700 hover:bg-slate-50"
        )}
      >
        <input type="checkbox" checked={checked} onChange={onChange} className="h-3.5 w-3.5 accent-orange-600" />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {extra}
        <span className="spec text-[0.6875rem] text-slate-400">{count}</span>
      </label>
    </li>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
      {label}
      <button onClick={onRemove} className="text-slate-400 transition-colors hover:text-slate-700" aria-label={`Remove ${label}`}>
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
