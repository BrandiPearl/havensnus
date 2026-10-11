"use client";

import { useActionState, useMemo, useState } from "react";
import { saveProduct, deleteProduct } from "@/app/(cms)/admin/actions";
import { FLAVOUR_FAMILIES, POUCH_FORMATS, STRENGTH_LEVELS } from "@/lib/cms/constants";
import type { ActionState } from "@/lib/cms/form";
import type { AdminBrand, AdminProduct } from "@/lib/queries/cms";
import { slugify } from "@/lib/utils";
import { FormAlert } from "@/components/cms/form-alert";

export function ProductForm({ product, brands }: { product?: AdminProduct; brands: AdminBrand[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveProduct, null);
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const slugLocked = Boolean(product);

  const derivedSlug = useMemo(() => (slugLocked ? slug : slugify(name) || slug), [name, slug, slugLocked]);

  return (
    <form action={action} className="space-y-6 max-w-4xl">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <FormAlert state={state} />

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Basics</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name">
            <input name="name" className="input" required value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Slug">
            <input
              name="slug"
              className="input font-mono text-xs"
              value={slugLocked ? slug : derivedSlug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </Field>
          <Field label="SKU">
            <input name="sku" className="input font-mono text-xs" defaultValue={product?.sku} placeholder="Auto from slug if empty" />
          </Field>
          <Field label="Brand">
            <select name="brand" className="input" defaultValue={product?.brand ?? ""}>
              <option value="">No brand</option>
              {brands.map((brand) => (
                <option key={brand.slug} value={brand.slug}>
                  {brand.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Price per can (AUD)">
            <input name="price" type="number" min="0" step="0.01" className="input" required defaultValue={product?.price ?? ""} />
          </Field>
          <Field label="Was price (shows as sale)">
            <input
              name="compare_at_price"
              type="number"
              min="0"
              step="0.01"
              className="input"
              defaultValue={product?.compare_at_price ?? ""}
            />
          </Field>
        </div>
        <Field label="Short description">
          <textarea name="short_description" className="input min-h-20" rows={3} defaultValue={product?.short_description} />
        </Field>
        <Field label="Description (HTML: p, h3, ul, li, strong)">
          <textarea name="description" className="input min-h-40 font-mono text-xs" rows={10} defaultValue={product?.description} />
        </Field>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Images and features</h2>
        <Field label="Image URLs (one per line)">
          <textarea
            name="images"
            className="input font-mono text-xs min-h-32"
            rows={6}
            defaultValue={product?.images.map((img) => img.url).join("\n")}
          />
        </Field>
        <Field label="Features (one per line)">
          <textarea name="features" className="input min-h-32" rows={6} defaultValue={product?.features.join("\n")} />
        </Field>
        <Field label="Tags (comma or line separated)">
          <input name="tags" className="input" defaultValue={product?.tags.join(", ")} />
        </Field>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Pouch details</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Nicotine (mg per pouch)">
            <input name="strength_mg" type="number" min="0" step="0.1" className="input" defaultValue={product?.strength_mg ?? ""} />
          </Field>
          <Field label="Strength level">
            <Select name="strength_level" options={STRENGTH_LEVELS} value={product?.strength_level} />
          </Field>
          <Field label="Pouches per can">
            <input name="pouches_per_tin" type="number" min="0" step="1" className="input" defaultValue={product?.pouches_per_tin ?? ""} />
          </Field>
          <Field label="Flavour">
            <input name="flavour" className="input" placeholder="e.g. Cool Mint" defaultValue={product?.flavour} />
          </Field>
          <Field label="Flavour family">
            <Select name="flavour_family" options={FLAVOUR_FAMILIES} value={product?.flavour_family} />
          </Field>
          <Field label="Pouch format">
            <Select name="pouch_format" options={POUCH_FORMATS} value={product?.pouch_format} />
          </Field>
          <Field label="Product line">
            <input name="product_line" className="input" placeholder="e.g. ZYN Slim" defaultValue={product?.product_line} />
          </Field>
          <Field label="Stock quantity">
            <input name="stock_quantity" type="number" min="0" step="1" className="input" defaultValue={product?.stock_quantity ?? ""} />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Flags and SEO</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Check name="is_active" label="Active on site" defaultChecked={product?.is_active ?? true} />
          <Check name="in_stock" label="In stock" defaultChecked={product?.in_stock ?? true} />
          <Check name="is_featured" label="Featured" defaultChecked={product?.is_featured} />
          <Check name="is_new" label="New" defaultChecked={product?.is_new} />
        </div>
        <Field label="SEO title">
          <input name="seo_title" className="input" defaultValue={product?.seo_title} />
        </Field>
        <Field label="SEO description">
          <textarea name="seo_description" className="input" rows={3} defaultValue={product?.seo_description} />
        </Field>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary text-sm py-2 px-4" disabled={pending}>
          {pending ? "Saving…" : product ? "Save product" : "Create product"}
        </button>
        {product ? (
          <button
            formAction={deleteProduct}
            className="btn-secondary text-sm py-2 px-4 text-red-600"
            onClick={(event) => {
              if (!confirm("Delete this product? This cannot be undone.")) event.preventDefault();
            }}
          >
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="rounded border-slate-300" />
      {label}
    </label>
  );
}

/** Keeps a legacy value selectable even if it is not in the preset list. */
function Select({ name, options, value }: { name: string; options: readonly string[]; value?: string }) {
  const all = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <select name={name} className="input" defaultValue={value ?? ""}>
      <option value="">Not set</option>
      {all.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
