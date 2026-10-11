"use client";

import { PICKER_CURRENCIES } from "@/lib/currency";
import { useCurrency } from "@/components/currency/currency-provider";

export function CurrencySelect() {
  const { currency, setCurrency } = useCurrency();

  return (
    <label>
      <span className="sr-only">Currency</span>
      <select
        aria-label="Currency"
        title="Prices are charged in AUD. NZD is shown at today's rate."
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        className="text-xs font-semibold text-slate-600 bg-transparent border border-slate-200 rounded-md px-1.5 py-1 hover:border-slate-300 focus:outline-none focus:border-orange-400"
      >
        {PICKER_CURRENCIES.map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </select>
    </label>
  );
}
