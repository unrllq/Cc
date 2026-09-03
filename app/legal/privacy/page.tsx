import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Privacy — SYNTEZIS INCUBATOR" };

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Legal" title="Privacy Policy" updated="1 January 2026">
      <LegalSection title="Overview">
        <p>
          This is a demo marketing site for SYNTEZIS INCUBATOR. Form submissions on this site (applications,
          contact, event reservations, membership checkout) are stored locally in your browser for demonstration
          purposes only and are never transmitted to a real server or third party.
        </p>
      </LegalSection>
      <LegalSection title="What we would collect in production">
        <p>
          In a live deployment, SYNTEZIS would collect the information you provide through applications and
          contact forms (name, email, portfolio links, project details) to evaluate applications, respond to
          enquiries and administer membership and studio bookings.
        </p>
      </LegalSection>
      <LegalSection title="Your rights">
        <p>
          Under GDPR, creators and partners based in the EU/EEA would have the right to access, correct, export
          and delete their data. Requests would be handled by the SYNTEZIS data protection contact in Berlin.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
