import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Terms — SYNTEZIS INCUBATOR" };

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Legal" title="Terms of Use" updated="1 January 2026">
      <LegalSection title="Demo site">
        <p>
          This website is a working demonstration built for SYNTEZIS INCUBATOR. Creators, projects, events,
          brand opportunities, articles and mentors shown throughout are fictional demo data unless otherwise
          stated, and any resemblance to real people, companies or events is coincidental.
        </p>
      </LegalSection>
      <LegalSection title="No real transactions">
        <p>
          Membership checkout, applications and brand-opportunity applications on this site are demo flows.
          No payment is processed, no card details are stored, and no application is reviewed by a real
          admissions team.
        </p>
      </LegalSection>
      <LegalSection title="Use of the studio">
        <p>
          In a production deployment, use of the physical Berlin studio floor and its equipment would be
          governed by a separate resident agreement provided at onboarding.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
