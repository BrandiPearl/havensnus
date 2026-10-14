import type { Metadata } from "next";
import { InfoPage, InfoSection, InfoCta } from "@/components/layout/info-page";
import { getSiteSettings } from "@/lib/queries/settings";
import { formatAud } from "@/lib/utils";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Shipping",
  description: "Tracked delivery of nicotine pouches anywhere in Australia. Rates, timing and what to expect.",
  alternates: { canonical: "/shipping" },
};

export default async function ShippingPage() {
  const settings = await getSiteSettings();

  return (
    <InfoPage
      eyebrow="Help"
      title="Shipping"
      intro="We ship anywhere in Australia, with tracking on every order. We do not ship outside Australia."
    >
      <InfoSection title="Rates">
        <table>
          <thead>
            <tr>
              <th>Option</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Standard Shipping (tracked)</td>
              <td>{formatAud(settings.shipping_standard)}</td>
            </tr>
            <tr>
              <td>Express Shipping (tracked, priority dispatch)</td>
              <td>{formatAud(settings.shipping_express)}</td>
            </tr>
          </tbody>
        </table>
        <p>Flat rates in Australian dollars, per order. You choose the option at checkout.</p>
        {settings.min_order > 0 && (
          <p>The minimum order is {formatAud(settings.min_order)} before shipping.</p>
        )}
      </InfoSection>

      <InfoSection title="When your order ships">
        <p>
          After you place an order we email you payment details. Your order is packed and handed to the
          courier once payment is received, and we email you a tracking number when it ships.
        </p>
      </InfoSection>

      <InfoSection title="Prescription requirement">
        <p>
          Under Australian rules, nicotine products imported for personal use require a valid prescription
          from an Australian doctor. You will be asked to confirm you hold one at checkout. Orders that
          cannot be delivered for regulatory reasons may be cancelled.
        </p>
      </InfoSection>

      <InfoSection title="Packaging">
        <p>Orders are sent in plain packaging with no product branding on the outside.</p>
      </InfoSection>

      <InfoSection title="Lost or damaged parcels">
        <p>
          If your tracking stops updating or a parcel arrives damaged, contact us with your order reference
          and a photo if relevant. We will work with the courier to sort it out.
        </p>
      </InfoSection>

      <InfoCta title="Question about an order?" body="Send us your order reference and we will look into it." />
    </InfoPage>
  );
}
