/**
 * Prices are stored in AUD. NZ visitors see NZD, converted at the daily rate
 * from /api/rates; orders are always recorded in AUD.
 */

export const BASE_CURRENCY = "AUD";
export const CURRENCY_COOKIE = "hs_currency";
export const PICKER_CURRENCIES = ["AUD", "NZD"];

export function currencyForCountry(country?: string | null) {
  return country?.toUpperCase() === "NZ" ? "NZD" : BASE_CURRENCY;
}

export function isSupportedCurrency(code: string) {
  return PICKER_CURRENCIES.includes(code);
}

export function formatMoney(amount: number, currency: string, rate = 1) {
  const converted = amount * (Number.isFinite(rate) && rate > 0 ? rate : 1);
  const formatted = new Intl.NumberFormat("en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(converted);
  // NZ$ is explicit so it is never mistaken for AUD.
  return `${currency === "NZD" ? "NZ$" : "$"}${formatted}`;
}

export function toBase(localAmount: number, rate = 1) {
  if (!rate || rate <= 0) return localAmount;
  return localAmount / rate;
}

/** Replace $150 style amounts in settings copy with the visitor's currency. */
export function localizeAmountsInText(text: string, format: (amount: number) => string) {
  return text.replace(/\$\s*([\d,]+(?:\.\d+)?)/g, (_, raw: string) => {
    const amount = Number(raw.replace(/,/g, ""));
    if (!Number.isFinite(amount)) return `$${raw}`;
    return format(amount);
  });
}
