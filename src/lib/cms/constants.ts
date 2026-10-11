export { ORDER_STATUSES } from "@/lib/orders";
export { STRENGTH_LEVELS } from "@/lib/catalog";

export const FLAVOUR_FAMILIES = [
  "Mint",
  "Menthol/Ice",
  "Fruit",
  "Berry",
  "Citrus",
  "Tropical",
  "Cola/Energy",
  "Dessert/Sweet",
  "Liquorice",
  "Coffee",
  "Spice",
  "Tobacco",
  "Unflavoured",
  "Other",
];

export const POUCH_FORMATS = ["Slim", "Mini", "Mini Dry", "Large", "AirPouch (ultra-thin)"];

export const BLOG_CATEGORIES = ["Guides", "Brands", "Strengths", "News", "General"];

export const CONTACT_STATUSES = ["new", "read", "replied", "closed"] as const;
export const BLOG_STATUSES = ["draft", "published", "archived"] as const;

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  paid: "bg-blue-50 text-blue-700",
  processing: "bg-purple-50 text-purple-700",
  shipped: "bg-emerald-50 text-emerald-700",
  delivered: "bg-slate-100 text-slate-700",
  cancelled: "bg-red-50 text-red-700",
  refunded: "bg-red-50 text-red-700",
};
