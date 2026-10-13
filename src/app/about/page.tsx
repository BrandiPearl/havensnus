import type { Metadata } from "next";
import { InfoPage, InfoSection, InfoCta } from "@/components/layout/info-page";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "About Us",
  description: "Haven Snus stocks 30+ brands of tobacco-free nicotine pouches for adults across Australia.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="About"
      title="A better place to buy pouches"
      intro="Haven Snus brings the world's best-known nicotine pouch brands together in one shop for adults in Australia."
    >
      <InfoSection title="What we do">
        <p>
          We stock tobacco-free nicotine pouches from more than 30 brands, from everyday names like ZYN and
          VELO to high-strength specialists like PABLO and KILLA. Every product lists its nicotine content
          and strength level clearly, so you always know what you are getting.
        </p>
      </InfoSection>

      <InfoSection title="How we work">
        <ul>
          <li>Clear strength grading on every can, from Light to Extreme.</li>
          <li>Tracked delivery anywhere in Australia.</li>
          <li>Plain, discreet packaging.</li>
          <li>Real people answering your questions.</li>
        </ul>
      </InfoSection>

      <InfoSection title="Adults only">
        <p>
          Nicotine is addictive. Our products are for adults aged 18 and over who already use nicotine. We
          do not sell to minors, and we ask every customer to confirm their age.
        </p>
      </InfoSection>

      <InfoCta title="Got a question?" body="Whether it is about a flavour, a strength or an order, we are happy to help." />
    </InfoPage>
  );
}
