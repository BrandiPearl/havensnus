/** Summary of the order just placed, handed from checkout to the success page. */
export type LastOrder = {
  reference: string;
  name: string;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  shippingLabel: string;
  shipping: number;
  total: number;
};

export const LAST_ORDER_KEY = "hs_last_order";

export function orderEmailBody(order: LastOrder, format: (n: number) => string) {
  return [
    `Hi Haven Snus,`,
    ``,
    `I have just placed order ${order.reference}:`,
    ``,
    ...order.items.map((i) => `${i.qty} x ${i.name} (${format(i.price * i.qty)})`),
    ``,
    `Subtotal: ${format(order.subtotal)}`,
    `${order.shippingLabel}: ${format(order.shipping)}`,
    `Total: ${format(order.total)} AUD`,
    ``,
    `Please send me the payment details.`,
    ``,
    `Thanks,`,
    order.name,
  ].join("\n");
}
