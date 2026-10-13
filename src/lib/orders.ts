import type { ShippingMethod } from "@/lib/shipping";

export type OrderInput = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  suburb: string;
  state: string;
  postcode: string;
  country: "AU";
  shipping_method: ShippingMethod;
  notes?: string;
  age_confirmed: boolean;
  prescription_confirmed: boolean;
  /** The total the customer saw at checkout; informational only. */
  display_total?: string;
  items: { id: string; qty: number }[];
};

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const MAX_QTY_PER_LINE = 1000;

export function createOrderReference() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `HS-${stamp}${rand}`;
}
