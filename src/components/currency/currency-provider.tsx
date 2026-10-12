"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  BASE_CURRENCY,
  CURRENCY_COOKIE,
  formatMoney,
  isSupportedCurrency,
  toBase,
} from "@/lib/currency";

type CurrencyContextValue = {
  /** The currency prices are actually rendered in. */
  currency: string;
  /** Best guess at the shopper's country, used to preselect checkout. */
  country: "AU" | "NZ";
  rate: number;
  /** Format an AUD amount in the visitor's currency. */
  format: (amount: number) => string;
  /** Convert an amount typed in the visitor's currency back to AUD. */
  toBase: (localAmount: number) => number;
  setCurrency: (code: string) => void;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/** Saved choice first, then the device time zone (cheap, no geo lookup needed). */
function readCurrency(): string {
  const saved = document.cookie.match(new RegExp(`(?:^|; )${CURRENCY_COOKIE}=([A-Z]{3})`))?.[1];
  if (saved && isSupportedCurrency(saved)) return saved;
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    if (zone === "Pacific/Auckland" || zone === "Pacific/Chatham") return "NZD";
  } catch {
    // Fall through to AUD.
  }
  return BASE_CURRENCY;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  // Server (and cached HTML) always renders AUD; the client switches after hydration.
  const selected = useSyncExternalStore(subscribe, readCurrency, () => BASE_CURRENCY);
  const [rates, setRates] = useState<Record<string, number>>({ [BASE_CURRENCY]: 1 });

  useEffect(() => {
    if (selected === BASE_CURRENCY) return;
    let cancelled = false;
    fetch("/api/rates")
      .then((res) => res.json())
      .then((data: { rates?: Record<string, number> }) => {
        if (!cancelled) setRates({ [BASE_CURRENCY]: 1, ...(data.rates ?? {}) });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const setCurrency = useCallback((code: string) => {
    document.cookie = `${CURRENCY_COOKIE}=${code.toUpperCase()}; path=/; max-age=31536000; samesite=lax`;
    listeners.forEach((cb) => cb());
  }, []);

  // Without a rate, show AUD rather than AUD numbers labelled as NZD.
  const currency = rates[selected] ? selected : BASE_CURRENCY;
  const rate = rates[currency] ?? 1;
  const country = selected === "NZD" ? "NZ" : "AU";

  const value = useMemo(
    () => ({
      currency,
      country: country as "AU" | "NZ",
      rate,
      format: (amount: number) => formatMoney(amount, currency, rate),
      toBase: (localAmount: number) => toBase(localAmount, rate),
      setCurrency,
    }),
    [currency, country, rate, setCurrency]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used inside CurrencyProvider");
  }
  return ctx;
}
