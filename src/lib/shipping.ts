export type ShippingCountry = "AU" | "NZ";

export type ShippingRates = {
  shipping_au: number;
  shipping_nz: number;
  free_shipping_threshold: number;
};

export const SHIPPING_DEFAULTS: ShippingRates = {
  shipping_au: 9.95,
  shipping_nz: 14.95,
  free_shipping_threshold: 150,
};

/** Flat rate per country, free once the AUD subtotal reaches the threshold. */
export function shippingFor(subtotal: number, country: ShippingCountry, rates: ShippingRates) {
  if (subtotal <= 0) return 0;
  if (rates.free_shipping_threshold > 0 && subtotal >= rates.free_shipping_threshold) return 0;
  return country === "NZ" ? rates.shipping_nz : rates.shipping_au;
}

export const AU_STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];

export const NZ_REGIONS = [
  "Auckland",
  "Bay of Plenty",
  "Canterbury",
  "Gisborne",
  "Hawke's Bay",
  "Manawatū-Whanganui",
  "Marlborough",
  "Nelson",
  "Northland",
  "Otago",
  "Southland",
  "Taranaki",
  "Tasman",
  "Waikato",
  "Wellington",
  "West Coast",
];
