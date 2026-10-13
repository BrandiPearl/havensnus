export type ShippingRates = {
  shipping_au: number;
  free_shipping_threshold: number;
};

export const SHIPPING_DEFAULTS: ShippingRates = {
  shipping_au: 9.95,
  free_shipping_threshold: 150,
};

/** Flat rate, free once the AUD subtotal reaches the threshold. */
export function shippingFor(subtotal: number, rates: ShippingRates) {
  if (subtotal <= 0) return 0;
  if (rates.free_shipping_threshold > 0 && subtotal >= rates.free_shipping_threshold) return 0;
  return rates.shipping_au;
}

export const AU_STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];
