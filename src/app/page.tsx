import type { Metadata } from "next";
import { Hero } from "@/components/sections/hero";
import { BrandsGrid } from "@/components/sections/brands-grid";
import { FeaturedProducts } from "@/components/sections/featured-products";
import { ShopByStrength } from "@/components/sections/shop-by-strength";
import { WhyUs } from "@/components/sections/why-us";
import { Testimonials } from "@/components/sections/testimonials";
import { CtaStrip } from "@/components/sections/cta-strip";
import { BlogPreview } from "@/components/sections/blog-preview";
import { getSiteSettings } from "@/lib/queries/settings";
import { SITE_URL } from "@/lib/site";

export const revalidate = 600;

export const metadata: Metadata = {
  title: { absolute: "Haven Snus | Nicotine Pouches Delivered Across Australia & New Zealand" },
  description:
    "Shop ZYN, VELO, PABLO, KILLA and 30+ nicotine pouch brands. Every strength and flavour, with tracked delivery across Australia and New Zealand.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const settings = await getSiteSettings();

  return (
    <>
      <Hero />
      <FeaturedProducts />
      <BrandsGrid />
      <ShopByStrength />
      <WhyUs />
      <Testimonials />
      <CtaStrip />
      <BlogPreview />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "OnlineStore",
            name: "Haven Snus",
            description:
              "Online store for tobacco-free nicotine pouches, delivering across Australia and New Zealand.",
            url: SITE_URL,
            email: settings.email,
            areaServed: ["AU", "NZ"],
            currenciesAccepted: "AUD",
          }),
        }}
      />
    </>
  );
}
