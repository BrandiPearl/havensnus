"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  BASE_CURRENCY,
  CURRENCY_COOKIE,
  currencyForCountry,
  formatMoney,
  toBase,
} from "@/lib/currency";

type CurrencyContextValue = {
  /** The currency prices are actually rendered in. */
  currency: string;
  country: string;
  rate: number;
  /** Format an AUD amount in the visitor's currency. */
  format: (amount: number) => string;
  /** Convert an amount typed in the visitor's currency back to AUD. */
  toBase: (localAmount: number) => number;
  setCurrency: (code: string) => void;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function writeCookie(currency: string) {
  document.cookie = `${CURRENCY_COOKIE}=${currency}; path=/; max-age=31536000; samesite=lax`;
}

export function CurrencyProvider({
  initialCountry,
  initialCurrency,
  children,
}: {
  initialCountry?: string;
  initialCurrency?: string;
  children: ReactNode;
}) {
  const country = initialCountry ?? "";
  const [selected, setSelected] = useState(initialCurrency || currencyForCountry(country));
  const [rates, setRates] = useState<Record<string, number>>({ [BASE_CURRENCY]: 1 });

  useEffect(() => {
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
  }, []);

  const setCurrency = useCallback((code: string) => {
    const next = code.toUpperCase();
    setSelected(next);
    writeCookie(next);
  }, []);

  // Without a rate, show AUD rather than AUD numbers labelled as NZD.
  const currency = rates[selected] ? selected : BASE_CURRENCY;
  const rate = rates[currency] ?? 1;

  const value = useMemo(
    () => ({
      currency,
      country,
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
