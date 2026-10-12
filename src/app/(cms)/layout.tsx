import type { Metadata } from "next";
import { AdminShell } from "@/components/cms/admin-shell";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Haven Snus CMS",
  },
  robots: { index: false, follow: false },
};

// The CMS shows live orders and stock, so it must never be cached.
export const dynamic = "force-dynamic";

export default function CmsLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
