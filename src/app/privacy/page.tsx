import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/layout/info-page";
import { BUSINESS_EMAIL, mailHref } from "@/lib/contact-info";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Haven Snus collects, uses and protects your personal information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="This policy explains what personal information we collect when you use havensnus.com and how we use it."
    >
      <InfoSection title="What we collect">
        <ul>
          <li>Order details: your name, email, phone number, delivery address and the products you order.</li>
          <li>Messages you send us through the contact form or by email.</li>
          <li>Basic technical data, such as your approximate country, used to show prices in the right currency.</li>
        </ul>
      </InfoSection>

      <InfoSection title="How we use it">
        <ul>
          <li>To process, ship and support your orders.</li>
          <li>To reply to your messages.</li>
          <li>To meet our legal obligations, including age and regulatory checks.</li>
        </ul>
        <p>We do not sell your personal information.</p>
      </InfoSection>

      <InfoSection title="Who we share it with">
        <p>
          We share only what is needed with the services that help us run the shop: our courier, our email
          provider, our hosting and database providers, and our live chat provider. Some of these services
          store data outside Australia and New Zealand.
        </p>
      </InfoSection>

      <InfoSection title="Cookies">
        <p>
          We use a small number of cookies to remember your age confirmation, currency and cart. Our live
          chat widget may set its own cookies.
        </p>
      </InfoSection>

      <InfoSection title="Your choices">
        <p>
          You can ask to see, correct or delete the personal information we hold about you by emailing{" "}
          <a href={mailHref(BUSINESS_EMAIL)}>{BUSINESS_EMAIL}</a>.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
