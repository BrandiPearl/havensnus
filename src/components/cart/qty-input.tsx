"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { MAX_QTY_PER_LINE } from "@/lib/orders";
import { cn } from "@/lib/utils";

/**
 * Quantity stepper that also accepts typing. The draft is free text while
 * focused and is clamped to 1–MAX on blur or Enter.
 */
export function QtyInput({
  value,
  onChange,
  size = "md",
  label = "Quantity",
}: {
  value: number;
  onChange: (qty: number) => void;
  size?: "sm" | "md";
  label?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  function commit(raw: string) {
    const n = Math.floor(Number(raw));
    onChange(Number.isFinite(n) && n >= 1 ? Math.min(MAX_QTY_PER_LINE, n) : value);
    setDraft(null);
  }

  const button = size === "sm" ? "p-2" : "p-3";
  const icon = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        className={cn(button, "text-slate-600 hover:text-slate-900 disabled:opacity-40")}
        aria-label="Decrease quantity"
        disabled={value <= 1}
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        <Minus className={icon} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={label}
        value={draft ?? String(value)}
        onFocus={(e) => {
          setDraft(String(value));
          e.currentTarget.select();
        }}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 4))}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
        className={cn(
          "border-x border-slate-200 bg-transparent text-center text-sm font-semibold tabular text-slate-900 outline-none focus:bg-orange-50",
          size === "sm" ? "h-8 w-12" : "h-11 w-14"
        )}
      />
      <button
        type="button"
        className={cn(button, "text-slate-600 hover:text-slate-900 disabled:opacity-40")}
        aria-label="Increase quantity"
        disabled={value >= MAX_QTY_PER_LINE}
        onClick={() => onChange(Math.min(MAX_QTY_PER_LINE, value + 1))}
      >
        <Plus className={icon} />
      </button>
    </div>
  );
}
