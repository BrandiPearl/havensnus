"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { useCurrency } from "@/components/currency/currency-provider";
import { useSettings } from "@/components/layout/settings-provider";
import { OrderSummaryLines } from "@/components/cart/order-summary";
import { submitOrder } from "@/app/storefront-actions";
import { AU_STATES, NZ_REGIONS, shippingFor, type ShippingCountry } from "@/lib/shipping";

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  suburb: string;
  state: string;
  postcode: string;
  notes: string;
};

const EMPTY: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  suburb: "",
  state: "",
  postcode: "",
  notes: "",
};

export function CheckoutForm() {
  const router = useRouter();
  const { items, ready, subtotal, clear } = useCart();
  const { format, country: detected } = useCurrency();
  const settings = useSettings();
  const [country, setCountry] = useState<ShippingCountry>(detected === "NZ" ? "NZ" : "AU");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [prescriptionConfirmed, setPrescriptionConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!items.length) return;
    setError("");
    setLoading(true);
    const total = subtotal + shippingFor(subtotal, country, settings);
    const result = await submitOrder({
      ...form,
      country,
      age_confirmed: ageConfirmed,
      prescription_confirmed: prescriptionConfirmed,
      display_total: format(total),
      items: items.map((item) => ({ id: item.id, qty: item.qty })),
    }).catch(() => ({ success: false as const, error: "Could not reach the server. Please try again.", reference: undefined }));
    setLoading(false);
    if (!result.success || !result.reference) {
      setError(result.error ?? "Could not place this order. Please try again.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    clear();
    router.push(`/checkout/success?ref=${encodeURIComponent(result.reference)}`);
  }

  if (!ready) return <p className="text-sm text-slate-500">Loading checkout…</p>;

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <h2 className="text-lg font-bold text-slate-900">Nothing to check out</h2>
        <p className="mt-2 text-sm text-slate-500">Add some pouches to your cart first.</p>
        <Link href="/products" className="btn-primary mt-6 inline-flex px-5 py-2.5 text-sm">
          Shop pouches
        </Link>
      </div>
    );
  }

  const regions = country === "AU" ? AU_STATES : NZ_REGIONS;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
        {error ? (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <fieldset className="space-y-4">
          <legend className="mb-1 text-sm font-bold text-slate-900">Contact</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" name="first_name" value={form.first_name} onChange={handleChange} autoComplete="given-name" required />
            <Field label="Last name" name="last_name" value={form.last_name} onChange={handleChange} autoComplete="family-name" required />
            <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} autoComplete="email" required />
            <Field label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange} autoComplete="tel" required />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-1 text-sm font-bold text-slate-900">Delivery address</legend>
          <div>
            <span className="label">Country</span>
            <div className="grid grid-cols-2 gap-2">
              {(["AU", "NZ"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  aria-pressed={country === code}
                  onClick={() => {
                    setCountry(code);
                    setForm((prev) => ({ ...prev, state: "" }));
                  }}
                  className={
                    country === code
                      ? "rounded-md border border-orange-600 bg-orange-50 px-3 py-2.5 text-sm font-semibold text-orange-800"
                      : "rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-700 hover:border-slate-300"
                  }
                >
                  {code === "AU" ? "Australia" : "New Zealand"}
                </button>
              ))}
            </div>
          </div>
          <Field label="Street address" name="address_line1" value={form.address_line1} onChange={handleChange} autoComplete="address-line1" required />
          <Field label="Apartment, unit, etc. (optional)" name="address_line2" value={form.address_line2} onChange={handleChange} autoComplete="address-line2" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={country === "AU" ? "Suburb" : "Suburb / town"} name="suburb" value={form.suburb} onChange={handleChange} autoComplete="address-level2" required />
            <div>
              <label className="label" htmlFor="state">
                {country === "AU" ? "State" : "Region"}
              </label>
              <select id="state" name="state" className="input" value={form.state} onChange={handleChange} required={country === "AU"} autoComplete="address-level1">
                <option value="">Select</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <Field
              label="Postcode"
              name="postcode"
              value={form.postcode}
              onChange={handleChange}
              autoComplete="postal-code"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              required
            />
          </div>
        </fieldset>

        <div>
          <label className="label" htmlFor="notes">
            Order notes (optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className="input"
            value={form.notes}
            onChange={handleChange}
            placeholder="Delivery instructions or anything we should know."
          />
        </div>

        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <Check checked={ageConfirmed} onChange={setAgeConfirmed}>
            I confirm I am 18 years of age or older.
          </Check>
          {country === "AU" && (
            <Check checked={prescriptionConfirmed} onChange={setPrescriptionConfirmed}>
              I hold a valid prescription for nicotine products, as required for personal importation into Australia.
            </Check>
          )}
        </div>

        <button type="submit" className="btn-primary w-full justify-center py-3.5" disabled={loading}>
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Placing order…
            </span>
          ) : (
            "Place order"
          )}
        </button>
        <p className="text-center text-xs leading-relaxed text-slate-500">
          No payment is taken now. We will email your payment details, and your order ships with tracking once payment is received.
        </p>
      </form>

      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-bold text-slate-900">Your order</h2>
        <ul className="mb-4 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
              <div className="min-w-0">
                <div className="font-medium leading-snug text-slate-900">{item.name}</div>
                <div className="text-xs text-slate-400">
                  {item.qty} × {format(item.price)}
                </div>
              </div>
              <div className="shrink-0 font-medium text-slate-900">{format(item.price * item.qty)}</div>
            </li>
          ))}
        </ul>
        <div className="border-t border-slate-200 pt-4">
          <OrderSummaryLines subtotal={subtotal} country={country} />
        </div>
        <Link href="/cart" className="mt-4 block text-center text-xs font-semibold text-orange-700 hover:underline">
          Edit cart
        </Link>
      </aside>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  ...rest
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "name" | "type">) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <input id={name} name={name} type={type} className="input" value={value} onChange={onChange} {...rest} />
    </div>
  );
}

function Check({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug text-slate-700">
      <input
        type="checkbox"
        required
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 flex-shrink-0 accent-orange-600"
      />
      <span>{children}</span>
    </label>
  );
}
