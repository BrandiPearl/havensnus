export type ShippingMethod = "standard" | "express";

export type ShippingRates = {
  shipping_standard: number;
  shipping_express: number;
  /** Minimum cart subtotal (AUD, before shipping) needed to check out. */
  min_order: number;
};

export const SHIPPING_DEFAULTS: ShippingRates = {
  shipping_standard: 25,
  shipping_express: 40,
  min_order: 209.85,
};

/** Amount still needed to reach the minimum order (0 once it is met). */
export function minOrderShortfall(subtotal: number, rates: ShippingRates) {
  return Math.max(0, Math.round((rates.min_order - subtotal) * 100) / 100);
}

export const SHIPPING_METHODS: { id: ShippingMethod; label: string; detail: string }[] = [
  { id: "standard", label: "Standard Shipping", detail: "Tracked delivery Australia-wide" },
  { id: "express", label: "Express Shipping", detail: "Priority dispatch, tracked express delivery" },
];

export function isShippingMethod(value: unknown): value is ShippingMethod {
  return value === "standard" || value === "express";
}

/** Flat rate for the chosen method. */
export function shippingFor(method: ShippingMethod, rates: ShippingRates) {
  return method === "express" ? rates.shipping_express : rates.shipping_standard;
}

export function shippingLabel(method: ShippingMethod) {
  return SHIPPING_METHODS.find((m) => m.id === method)?.label ?? "Shipping";
}

export const AU_STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];
