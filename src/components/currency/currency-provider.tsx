"use client";

import { createContext, useContext, type ReactNode } from "react";
import { BASE_CURRENCY, formatMoney } from "@/lib/currency";

type CurrencyContextValue = {
  currency: string;
  /** Format an AUD amount for display. */
  format: (amount: number) => string;
};

const value: CurrencyContextValue = { currency: BASE_CURRENCY, format: formatMoney };
const CurrencyContext = createContext<CurrencyContextValue>(value);

/** Prices are AUD only; kept as a provider so components format money in one place. */
export function CurrencyProvider({ children }: { children: ReactNode }) {
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
