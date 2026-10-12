import type { Metadata } from "next";
import { Inter, Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { getSiteSettings } from "@/lib/queries/settings";
import { getNavBrands } from "@/lib/queries/products";
import { AGE_GATE_SCRIPT } from "@/lib/age-gate";
import { SITE_URL } from "@/lib/site";

// Body copy. Deliberately invisible — it carries the reading, not the voice.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Display. The `wdth` axis is the point: headlines are set slightly extended.
const archivo = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-archivo",
  weight: "variable",
  axes: ["wdth"],
});

// Strengths, prices and SKUs. Numbers set in mono read as measured.
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Haven Snus | Nicotine Pouches Delivered Across Australia & New Zealand",
    template: "%s | Haven Snus",
  },
  description:
    "Shop ZYN, VELO, PABLO, KILLA and 30+ nicotine pouch brands. Every strength and flavour, with tracked delivery across Australia and New Zealand.",
  keywords: [
    "nicotine pouches australia",
    "nicotine pouches nz",
    "buy zyn australia",
    "velo nicotine pouches",
    "snus australia",
    "tobacco free nicotine pouches",
  ],
  authors: [{ name: "Haven Snus" }],
  creator: "Haven Snus",
  publisher: "Haven Snus",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: SITE_URL,
    siteName: "Haven Snus",
    title: "Haven Snus | Nicotine Pouches for Australia & New Zealand",
    description: "30+ brands of tobacco-free nicotine pouches with tracked AU & NZ delivery.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Haven Snus" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Haven Snus",
    description: "30+ brands of tobacco-free nicotine pouches with tracked AU & NZ delivery.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, navBrands] = await Promise.all([getSiteSettings(), getNavBrands()]);

  return (
    <html
      lang="en-AU"
      className={`${inter.variable} ${archivo.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: AGE_GATE_SCRIPT }} />
      </head>
      <body className="font-sans antialiased bg-white text-slate-900">
        <AppShell settings={settings} navBrands={navBrands}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
