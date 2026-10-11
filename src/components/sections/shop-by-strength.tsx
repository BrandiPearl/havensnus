import Link from "next/link";
import { STRENGTH_LEVELS, facetSlug } from "@/lib/catalog";
import { StrengthDots } from "@/components/ui/strength-dots";

const COPY: Record<string, string> = {
  Light: "Up to 3mg. A gentle start.",
  Regular: "4–6.5mg. The everyday pouch.",
  Strong: "7.5–11mg. A firmer hit.",
  "Extra Strong": "11–16mg. For regular users.",
  "Ultra Strong": "16–24mg. Experienced only.",
  Extreme: "25mg and up. The top of the scale.",
};

/** Six ruled cells, one per strength level, each linking to a filtered shop. */
export function ShopByStrength() {
  return (
    <section className="section-block border-t border-slate-200 bg-slate-50">
      <div className="container-wide">
        <div className="section-intro">
          <p className="eyebrow">Shop by strength</p>
          <h2 className="section-heading">Find your level</h2>
          <p className="section-subheading">
            Every can is graded on the same six-dot scale, so you can move up or
            down a step with confidence.
          </p>
        </div>

        <div className="grid grid-cols-2 border-l border-t border-slate-300 sm:grid-cols-3 lg:grid-cols-6">
          {STRENGTH_LEVELS.map((level) => (
            <Link
              key={level}
              href={`/products?strength=${facetSlug(level)}`}
              className="group border-b border-r border-slate-300 bg-white p-5 transition-colors hover:bg-orange-50"
            >
              <StrengthDots level={level} size="md" />
              <h3 className="mt-4 font-display text-base font-bold tracking-tight text-slate-900 group-hover:text-orange-700">
                {level}
              </h3>
              <p className="mt-1.5 text-[0.8125rem] leading-snug text-slate-600">{COPY[level]}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
