import type { Metadata } from "next";
import { ContactForm } from "./contact-form";
import { Mail, Clock } from "lucide-react";
import { getSiteSettings } from "@/lib/queries/settings";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Haven Snus about products, strengths, orders or delivery.",
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-slate-50 border-b border-slate-100">
        <div className="container-wide py-12">
          <h1 className="text-3xl font-bold text-slate-900">Contact Us</h1>
          <p className="mt-2 text-slate-500 text-sm">
            Questions about a flavour, a strength or an order? We usually reply within one business day.
          </p>
        </div>
      </div>

      <div className="container-wide py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Contact info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-5">
                Get in touch
              </h2>
              <div className="space-y-4">
                {[
                  { icon: Mail, label: settings.email, sub: "Best way to reach us", href: `mailto:${settings.email}` },
                  { icon: Clock, label: "Mon–Fri, 9am–5pm AEST", sub: "Support hours", href: null },
                ].map(({ icon: Icon, label, sub, href }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      {href ? (
                        <a href={href} className="text-sm font-semibold text-slate-900 hover:text-orange-600 transition-colors">
                          {label}
                        </a>
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{label}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-6 text-white">
              <h3 className="text-sm font-bold mb-2">Asking about an order?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Include your order reference (it starts with HS-) so we can find it straight away.
              </p>
              <a href="/faq" className="mt-4 inline-flex items-center text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors">
                Read the FAQ →
              </a>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
