"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Logo } from "@/components/ui/logo";
import { AGE_ATTR, AGE_COOKIE, AGE_COOKIE_MAX_AGE, isAgeVerified } from "@/lib/age-gate";

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/**
 * Blocking 18+ confirmation. It is rendered for everyone so pages stay
 * cacheable; CSS hides it before paint for visitors who have confirmed.
 */
export function AgeGate() {
  // Cached HTML always includes the overlay (hidden by CSS for verified visitors);
  // on the client this reads the attribute the inline head script set.
  const verified = useSyncExternalStore(subscribe, isAgeVerified, () => false);
  const [declined, setDeclined] = useState(false);

  useEffect(() => {
    if (verified) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [verified]);

  if (verified) return null;

  function confirm() {
    document.cookie = `${AGE_COOKIE}=1; path=/; max-age=${AGE_COOKIE_MAX_AGE}; samesite=lax`;
    document.documentElement.setAttribute(AGE_ATTR, "");
    listeners.forEach((cb) => cb());
  }

  return (
    <div
      id="age-gate"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-xl sm:p-9">
        <div className="flex justify-center">
          <Logo size="md" href="" />
        </div>

        {declined ? (
          <>
            <h2 id="age-gate-title" className="mt-8 font-display text-2xl font-extrabold tracking-tight text-slate-900">
              Sorry, you can&rsquo;t enter
            </h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-slate-600">
              Haven Snus sells nicotine products and is only open to adults aged 18 and over.
            </p>
          </>
        ) : (
          <>
            <p className="spec mt-8 text-[0.6875rem] uppercase tracking-[0.18em] text-orange-700">
              Age verification
            </p>
            <h2 id="age-gate-title" className="mt-3 font-display text-2xl font-extrabold tracking-tight text-slate-900">
              Are you 18 or older?
            </h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-slate-600">
              This site sells nicotine products. You must be of legal age to enter.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button type="button" className="btn-primary py-3.5" onClick={confirm} autoFocus>
                Yes, I&rsquo;m 18+
              </button>
              <button type="button" className="btn-secondary py-3.5" onClick={() => setDeclined(true)}>
                No, I&rsquo;m under 18
              </button>
            </div>
          </>
        )}

        <p className="mt-7 border-t border-slate-200 pt-5 text-xs leading-relaxed text-slate-500">
          Nicotine is an addictive chemical. Keep out of reach of children and pets.
        </p>
      </div>
    </div>
  );
}
