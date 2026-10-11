import type { Metadata } from "next";
import { InfoPage, InfoSection, InfoCta } from "@/components/layout/info-page";
import { getSiteSettings } from "@/lib/queries/settings";
import { formatAud } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Shipping",
  description: "Tracked delivery of nicotine pouches across Australia and New Zealand. Rates, timing and what to expect.",
  alternates: { canonical: "/shipping" },
};

export default async function ShippingPage() {
  const settings = await getSiteSettings();
  const free = settings.free_shipping_threshold;

  return (
    <InfoPage
      eyebrow="Help"
      title="Shipping"
      intro="We ship to Australia and New Zealand, with tracking on every order."
    >
      <InfoSection title="Rates">
        <table>
          <thead>
            <tr>
              <th>Destination</th>
              <th>Flat rate</th>
              <th>Free from</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Australia</td>
              <td>{formatAud(settings.shipping_au)}</td>
              <td>{free > 0 ? formatAud(free) : "–"}</td>
            </tr>
            <tr>
              <td>New Zealand</td>
              <td>{formatAud(settings.shipping_nz)}</td>
              <td>{free > 0 ? formatAud(free) : "–"}</td>
            </tr>
          </tbody>
        </table>
        <p>All amounts are in Australian dollars. The free shipping threshold applies to the order subtotal.</p>
      </InfoSection>

      <InfoSection title="When your order ships">
        <p>
          After you place an order we email you payment details. Your order is packed and handed to the
          courier once payment is received, and we email you a tracking number when it ships.
        </p>
      </InfoSection>

      <InfoSection title="Australian orders">
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
