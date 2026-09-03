import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Impressum — SYNTEZIS INCUBATOR" };

export default function ImpressumPage() {
  return (
    <LegalPage eyebrow="Legal" title="Impressum" updated="1 January 2026">
      <LegalSection title="Angaben gemäß § 5 TMG">
        <p>
          SYNTEZIS INCUBATOR (demo)
          <br />
          Studio Campus, Berlin, Germany
          <br />
          52.5200° N, 13.4050° E
        </p>
      </LegalSection>
      <LegalSection title="Contact">
        <p>
          This is a fictional demo entity built to demonstrate the SYNTEZIS INCUBATOR website. No real
          registered company, VAT ID or postal address is associated with this site.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
