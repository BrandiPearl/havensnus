import { cookies, headers } from "next/headers";
import { CURRENCY_COOKIE, currencyForCountry, isSupportedCurrency } from "@/lib/currency";

export async function getRequestCurrencyHint() {
  const store = await cookies();
  const cookieCurrency = store.get(CURRENCY_COOKIE)?.value?.toUpperCase() ?? "";
  const h = await headers();
  const country = (
    h.get("cf-ipcountry") ||
    h.get("x-vercel-ip-country") ||
    h.get("x-country-code") ||
    ""
  ).toUpperCase();

  return {
    country: country && country !== "XX" ? country : "",
    cookieCurrency: isSupportedCurrency(cookieCurrency) ? cookieCurrency : "",
    detectedCurrency: currencyForCountry(country),
  };
}
