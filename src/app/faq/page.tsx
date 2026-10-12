import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { BUSINESS_EMAIL, mailHref } from "@/lib/contact-info";
import { getSiteSettings } from "@/lib/queries/settings";
import { formatAud } from "@/lib/utils";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "What nicotine pouches are, how to use them, how strengths work, and how ordering and delivery work at Haven Snus.",
  alternates: { canonical: "/faq" },
};

function faqSections(freeFrom: number, au: number, nz: number) {
  const free = freeFrom > 0 ? ` Orders over ${formatAud(freeFrom)} ship free.` : "";
  return [
    {
      section: "About nicotine pouches",
      faqs: [
        {
          q: "What is a nicotine pouch?",
          a: "A small white pouch containing nicotine, plant fibres and flavouring. It contains no tobacco leaf. You place it under your top lip and the nicotine is absorbed through the gum, with no smoke or vapour.",
        },
        {
          q: "How do I use one?",
          a: "Tuck a pouch between your gum and top lip. You will feel a tingle as the nicotine releases. Keep it in for anywhere from 10 to 60 minutes, then throw it in the bin. Most cans have a compartment in the lid for used pouches. Do not swallow it.",
        },
        {
          q: "Is it the same as snus?",
          a: "Not quite. Traditional Swedish snus contains ground tobacco. The pouches we sell are tobacco-free nicotine pouches, though many people still call them snus.",
        },
        {
          q: "Who are these products for?",
          a: "Adults 18 and over who already use nicotine. Nicotine is addictive. If you do not use nicotine, please do not start. These products are not suitable during pregnancy or breastfeeding.",
        },
      ],
    },
    {
      section: "Strengths and formats",
      faqs: [
        {
          q: "What does the strength scale mean?",
          a: "Each can lists its nicotine in mg per pouch and a level from Light to Extreme, shown as one to six dots. Light is up to about 3mg, Regular 4 to 6.5mg, Strong 7.5 to 11mg, Extra Strong 11 to 16mg, Ultra Strong 16 to 24mg and Extreme 25mg and up.",
        },
        {
          q: "Which strength should I start with?",
          a: "If you are new to pouches, start with Light or Regular and move up a step at a time if you need to. If you are switching from cigarettes or vaping, Regular or Strong is a common starting point. Extra Strong and above are for experienced users.",
        },
        {
          q: "What is the difference between slim, mini and dry pouches?",
          a: "Slim pouches are long and thin, sit comfortably and release quickly. Mini pouches are smaller and more discreet. Dry pouches have less moisture, so they release more slowly and drip less.",
        },
        {
          q: "How should I store my cans?",
          a: "Somewhere cool and dry. Most cans keep best in the fridge, which helps hold moisture and flavour. Keep them out of reach of children and pets.",
        },
      ],
    },
    {
      section: "Orders and delivery",
      faqs: [
        {
          q: "Where do you ship?",
          a: `Australia and New Zealand. Every order is sent with tracking. Shipping is a flat ${formatAud(au)} to Australia and ${formatAud(nz)} to New Zealand.${free}`,
        },
        {
          q: "How do I pay?",
          a: "Place your order at checkout and we will email you payment details. Your order is packed and shipped as soon as payment is received.",
        },
        {
          q: "Do I need a prescription to order to Australia?",
          a: "Under Australian rules, importing nicotine products for personal use requires a valid prescription from an Australian doctor. You will be asked to confirm you hold one at checkout. Orders to New Zealand do not need one.",
        },
        {
          q: "Why are prices in AUD?",
          a: "All prices are set and charged in Australian dollars. New Zealand visitors see an NZD estimate based on today's exchange rate.",
        },
        {
          q: "Is the packaging discreet?",
          a: "Yes. Orders ship in a plain outer box or satchel with no product branding.",
        },
      ],
    },
  ];
}

export default async function FAQPage() {
  const settings = await getSiteSettings();
  const sections = faqSections(settings.free_shipping_threshold, settings.shipping_au, settings.shipping_nz);

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-200 bg-slate-50">
        <div className="container-wide py-12 lg:py-14">
          <p className="eyebrow">Help</p>
          <h1 className="display-lg text-slate-900">Frequently asked questions</h1>
          <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-slate-600">
            How pouches work, how to pick a strength, and how ordering and delivery work.
          </p>
        </div>
      </div>

      <div className="container-wide py-12 lg:py-16">
        <div className="max-w-3xl">
          {sections.map((section) => (
            <div key={section.section} className="mb-12">
              <h2 className="mb-5 border-b border-slate-200 pb-3 font-display text-lg font-bold text-slate-900">
                {section.section}
              </h2>
              <div className="divide-y divide-slate-100">
                {section.faqs.map((faq) => (
                  <FaqItem key={faq.q} q={faq.q} a={faq.a} />
                ))}
              </div>
            </div>
          ))}

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-8">
            <h3 className="text-base font-bold text-slate-900">Still have a question?</h3>
            <p className="mt-2 text-sm text-slate-500">Send us a message and we will get back to you, usually within one business day.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/contact" className="btn-primary px-5 py-2.5 text-sm">
                Contact us
              </Link>
              <a href={mailHref(BUSINESS_EMAIL)} className="btn-secondary px-5 py-2.5 text-sm">
                Email us
              </a>
            </div>
          </div>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: sections.flatMap((s) =>
              s.faqs.map((faq) => ({
                "@type": "Question",
                name: faq.q,
                acceptedAnswer: { "@type": "Answer", text: faq.a },
              }))
            ),
          }),
        }}
      />
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group py-4">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
        <span className="text-sm font-semibold leading-snug text-slate-900">{q}</span>
        <ChevronDown className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{a}</p>
    </details>
  );
}
