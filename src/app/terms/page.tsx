import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/layout/info-page";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms that apply when you use havensnus.com and place an order.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Terms & Conditions"
      intro="By using havensnus.com or placing an order, you agree to these terms."
    >
      <InfoSection title="Age requirement">
        <p>
          You must be 18 or older to use this site and to buy from us. By placing an order you confirm that
          you are of legal age to buy nicotine products where you live.
        </p>
      </InfoSection>

      <InfoSection title="Your responsibility">
        <p>
          You are responsible for making sure that importing and using nicotine products is permitted where
          your order is delivered. For Australian deliveries this includes holding a valid prescription.
        </p>
      </InfoSection>

      <InfoSection title="Orders and payment">
        <ul>
          <li>Prices are in Australian dollars and include GST where applicable.</li>
          <li>Placing an order is an offer to buy. We accept it when we confirm payment.</li>
          <li>We may cancel an order, with a full refund of any payment, if a product is unavailable or we cannot lawfully supply it.</li>
        </ul>
      </InfoSection>

      <InfoSection title="Delivery and returns">
        <p>
          Delivery is covered on our Shipping page and returns on our Returns page. Both form part of these
          terms.
        </p>
      </InfoSection>

      <InfoSection title="Health warning">
        <p>
          Nicotine is a highly addictive substance. Our products are not intended for people who do not
          already use nicotine, or for anyone who is pregnant or breastfeeding.
        </p>
      </InfoSection>

      <InfoSection title="Consumer law">
        <p>
          Nothing in these terms excludes rights you have under the Australian Consumer Law or the New
          Zealand Consumer Guarantees Act.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
