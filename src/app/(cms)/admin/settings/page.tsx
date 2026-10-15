import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/cms/admin-page-header";
import { getSiteSettings } from "@/lib/queries/settings";
import { SettingsForm } from "@/components/cms/settings-form";
import { RefreshCache } from "@/components/cms/refresh-cache";
import { TestEmail } from "@/components/cms/test-email";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <AdminPageHeader
        title="Settings"
        description="Business details, shipping, SEO defaults, the announcement bar and the site cache."
      />
      <SettingsForm settings={settings} />
      <div className="mt-8 space-y-6">
        <TestEmail />
        <RefreshCache />
      </div>
    </div>
  );
}
