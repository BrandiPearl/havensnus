"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { useSettings } from "@/components/layout/settings-provider";
import { mailHref } from "@/lib/utils";

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Shop",
    links: [
      { label: "All pouches", href: "/products" },
      { label: "All brands", href: "/brands" },
      { label: "ZYN", href: "/products?brand=zyn" },
      { label: "VELO", href: "/products?brand=velo" },
      { label: "PABLO", href: "/products?brand=pablo" },
      { label: "Light & regular", href: "/products?strength=light,regular" },
    ],
  },
  {
    heading: "Help",
    links: [
      { label: "Shipping", href: "/shipping" },
      { label: "Returns", href: "/returns" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About us", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function Footer() {
  const settings = useSettings();

  return (
    <footer className="bg-slate-900 text-slate-300">
      {/* Closing appeal. Set large, because on most pages this is the last
          thing a buyer reads before leaving. */}
      <div className="border-b border-white/10">
        <div className="container-wide py-10 lg:py-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="display-lg max-w-2xl text-white">
              Every strength. Every flavour. Delivered.
            </h2>
            <div className="flex flex-shrink-0 flex-col gap-3 sm:flex-row">
              <Link href="/products" className="btn-primary px-7 py-4">
                Shop all pouches
              </Link>
              <a
                href={mailHref(settings.email)}
                className="spec inline-flex items-center justify-center gap-2 rounded-md border border-white/25 px-7 py-4 text-sm font-medium text-white transition-colors hover:border-white/50 hover:bg-white/5"
              >
                Email us
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="container-wide py-10 lg:py-12">
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo variant="light" size="sm" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-slate-400">
              Tobacco-free nicotine pouches from 30+ brands, shipped with
              tracking to every corner of Australia.
            </p>

            <div className="mt-7">
              <a
                href={mailHref(settings.email)}
                className="flex items-center gap-3 text-sm text-slate-400 transition-colors hover:text-white"
              >
                <Mail className="h-3.5 w-3.5 flex-shrink-0 text-orange-500" />
                {settings.email}
              </a>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.heading} className="lg:col-span-2 lg:col-start-auto">
              <h3 className="spec mb-5 text-[0.625rem] uppercase tracking-[0.18em] text-white/40">
                {col.heading}
              </h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="lg:col-span-2">
            <h3 className="spec mb-5 text-[0.625rem] uppercase tracking-[0.18em] text-white/40">
              18+ only
            </h3>
            <p className="text-sm leading-relaxed text-slate-400">
              Nicotine is an addictive chemical. Our products are for adults
              who already use nicotine, and are not for sale to anyone under 18.
            </p>
            <p className="spec mt-4 text-[0.6875rem] uppercase tracking-[0.14em] text-orange-500">
              Ships Australia-wide
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-wide flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="spec text-[0.6875rem] text-slate-500">
            &copy; {new Date().getFullYear()} Haven Snus
          </p>
          <div className="flex items-center gap-6">
            {[
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
              { label: "Shipping", href: "/shipping" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="spec text-[0.6875rem] uppercase tracking-[0.12em] text-slate-500 transition-colors hover:text-slate-300"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
