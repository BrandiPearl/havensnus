/**
 * Deliberately icon-free. A six-up grid of icons in tinted rounded squares is
 * the default shape of generated marketing pages; numerals and hairline rules
 * carry the same structure while reading as an editorial spec list.
 */

const REASONS = [
  {
    title: "30+ brands, one cart",
    body: "ZYN, VELO, PABLO, KILLA, XQS, CUBA and the rest, side by side. Compare strengths and flavours without hopping between shops.",
  },
  {
    title: "Fresh stock",
    body: "We turn stock over quickly, so cans arrive moist and full-flavoured rather than dried out at the back of a shelf.",
  },
  {
    title: "Tracked delivery Australia-wide",
    body: "Every order ships with tracking to anywhere in Australia, and shipping is free once your order passes the threshold.",
  },
  {
    title: "Honest strength grading",
    body: "Each can shows its mg per pouch and a six-dot strength level, so stepping up or down is never a guess.",
  },
  {
    title: "Discreet packaging",
    body: "Plain outer packaging with no branding on the box. What you order is your business.",
  },
  {
    title: "Real people on support",
    body: "Questions about strengths, flavours or an order? Message us and a person, not a bot, will get back to you.",
  },
];

export function WhyUs() {
  return (
    <section className="section-block border-y border-slate-200 bg-slate-50">
      <div className="container-wide">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <p className="eyebrow">Why Haven</p>
              <h2 className="section-heading">
                Stocked for people who know their pouch
              </h2>
              <p className="section-subheading">
                Whether you have used the same can for years or are still
                finding your flavour, we make reordering simple.
              </p>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="grid gap-x-10 gap-y-0 sm:grid-cols-2">
              {REASONS.map((reason, i) => (
                <div
                  key={reason.title}
                  className="group border-t border-slate-300 py-5 first:border-slate-900 sm:[&:nth-child(2)]:border-slate-900"
                >
                  <span className="spec text-[0.6875rem] font-medium tracking-[0.14em] text-orange-700">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-bold tracking-tight text-slate-900">
                    {reason.title}
                  </h3>
                  <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-slate-600">
                    {reason.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
