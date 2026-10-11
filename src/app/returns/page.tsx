import type { Metadata } from "next";
import { InfoPage, InfoSection, InfoCta } from "@/components/layout/info-page";

export const metadata: Metadata = {
  title: "Returns",
  description: "Returns, refunds and what to do if your Haven Snus order arrives damaged or incorrect.",
  alternates: { canonical: "/returns" },
};

export default function ReturnsPage() {
  return (
    <InfoPage
      eyebrow="Help"
      title="Returns & refunds"
      intro="Nicotine pouches are a consumable product, so we can only take back cans that are unopened and still sealed."
    >
      <InfoSection title="Wrong or damaged items">
        <p>
          If we sent the wrong product, or a can arrived damaged or faulty, contact us within 14 days of
          delivery with your order reference and a photo. We will send a replacement or refund the item,
          including any shipping you paid on it.
        </p>
      </InfoSection>

      <InfoSection title="Change of mind">
        <ul>
          <li>Unopened, sealed cans can be returned within 14 days of delivery.</li>
          <li>Opened cans cannot be returned, for hygiene reasons.</li>
          <li>Return shipping for a change of mind is at your cost.</li>
        </ul>
        <p>Contact us before sending anything back so we can give you a return address.</p>
      </InfoSection>

      <InfoSection title="Refunds">
        <p>
          Once we receive and check a return, we refund to the original payment method. Refunds can take a
          few business days to show in your account.
        </p>
      </InfoSection>

      <InfoSection title="Your rights">
        <p>
          Nothing in this policy limits your rights under the Australian Consumer Law or the New Zealand
          Consumer Guarantees Act.
        </p>
      </InfoSection>

      <InfoCta title="Need to start a return?" body="Message us with your order reference and what went wrong." />
    </InfoPage>
  );
}
