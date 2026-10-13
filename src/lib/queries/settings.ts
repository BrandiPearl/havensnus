import { isSupabaseConfigured } from "@/lib/supabase/config";
import { BUSINESS_EMAIL, BUSINESS_PHONE_DISPLAY } from "@/lib/contact-info";
import { SHIPPING_DEFAULTS, type ShippingRates } from "@/lib/shipping";

export type SiteSettings = ShippingRates & {
  business_name: string;
  phone: string;
  email: string;
  address: string;
  seo_title: string;
  seo_description: string;
  announcement: string;
  announcement_link_text: string;
  announcement_link_url: string;
};

const TEXT_DEFAULTS = {
  business_name: "Haven Snus",
  phone: BUSINESS_PHONE_DISPLAY,
  email: BUSINESS_EMAIL,
  address: "",
  seo_title: "Haven Snus | Nicotine Pouches Delivered Australia-Wide",
  seo_description:
    "Shop ZYN, VELO, PABLO, KILLA and 30+ nicotine pouch brands. Tracked delivery Australia-wide, free over $150.",
  announcement: "Free tracked shipping on orders over $150",
  announcement_link_text: "Shop all brands",
  announcement_link_url: "/brands",
};

type TextKey = keyof typeof TEXT_DEFAULTS;
type NumberKey = keyof ShippingRates;

export const SETTING_DEFAULTS: SiteSettings = { ...TEXT_DEFAULTS, ...SHIPPING_DEFAULTS };

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!isSupabaseConfigured()) return SETTING_DEFAULTS;

  const { createPublicClient } = await import("@/lib/supabase/public");
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("site_settings").select("key, value");

  if (error || !data?.length) {
    if (error) console.error("getSiteSettings:", error.message);
    return SETTING_DEFAULTS;
  }

  const map = Object.fromEntries(data.map((row) => [String(row.key), row.value])) as Record<
    string,
    unknown
  >;

  const raw = (key: string) => {
    const value = map[key];
    if (value && typeof value === "object" && "value" in (value as object)) {
      return (value as { value: unknown }).value;
    }
    return value;
  };

  const text = (key: TextKey) => {
    const value = raw(key);
    return typeof value === "string" ? value : TEXT_DEFAULTS[key];
  };

  const number = (key: NumberKey) => {
    const value = Number(raw(key));
    return raw(key) != null && raw(key) !== "" && Number.isFinite(value) && value >= 0
      ? value
      : SHIPPING_DEFAULTS[key];
  };

  return {
    business_name: text("business_name") || TEXT_DEFAULTS.business_name,
    phone: text("phone"),
    email: text("email") || BUSINESS_EMAIL,
    address: text("address"),
    seo_title: text("seo_title") || TEXT_DEFAULTS.seo_title,
    seo_description: text("seo_description") || TEXT_DEFAULTS.seo_description,
    announcement: text("announcement"),
    announcement_link_text: text("announcement_link_text"),
    announcement_link_url: text("announcement_link_url"),
    shipping_au: number("shipping_au"),
    free_shipping_threshold: number("free_shipping_threshold"),
  };
}
