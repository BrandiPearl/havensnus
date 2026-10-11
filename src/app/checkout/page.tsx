import type { Metadata } from "next";
import { CheckoutForm } from "@/components/cart/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Check out your Haven Snus order.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="bg-slate-50 min-h-[60vh]">
      <div className="container-wide py-10 lg:py-14">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Checkout</h1>
        <p className="text-sm text-slate-500 mb-6 max-w-xl">
          Enter your delivery details. We will email payment instructions, then ship your order with tracking.
        </p>
        <CheckoutForm />
      </div>
    </div>
  );
}
