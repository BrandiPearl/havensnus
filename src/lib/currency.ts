/** Haven Snus sells to Australia only; every price is in AUD. */

export const BASE_CURRENCY = "AUD";

export function formatMoney(amount: number) {
  return `$${new Intl.NumberFormat("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
}

/** Replace $150 style amounts in settings copy with formatted prices. */
export function localizeAmountsInText(text: string, format: (amount: number) => string) {
  return text.replace(/\$\s*([\d,]+(?:\.\d+)?)/g, (_, raw: string) => {
    const amount = Number(raw.replace(/,/g, ""));
    if (!Number.isFinite(amount)) return `$${raw}`;
    return format(amount);
  });
}
