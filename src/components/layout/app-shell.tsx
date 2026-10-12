"use client";

import { usePathname } from "next/navigation";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { AgeGate } from "@/components/layout/age-gate";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { TawkChat } from "@/components/layout/tawk-chat";
import { CartProvider } from "@/components/cart/cart-provider";
import { SettingsProvider } from "@/components/layout/settings-provider";
import { CurrencyProvider } from "@/components/currency/currency-provider";
import type { SiteSettings } from "@/lib/queries/settings";
import type { NavBrand } from "@/lib/queries/products";

export function AppShell({
  settings,
  navBrands,
  children,
}: {
  settings: SiteSettings;
  navBrands: NavBrand[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <SettingsProvider settings={settings}>
      <CurrencyProvider>
        <CartProvider>
          <Nav brands={navBrands} />
          <main>{children}</main>
          <Footer />
          <ScrollToTop />
          <TawkChat />
          <AgeGate />
        </CartProvider>
      </CurrencyProvider>
    </SettingsProvider>
  );
}
