import type { Metadata } from "next";
import { Suspense } from "react";
import { SectionHeader } from "@/components/site/section-header";
import { ContactForm } from "@/components/site/contact-form";

export const metadata: Metadata = {
  title: "Contact — SYNTEZIS INCUBATOR",
  description: "Start a conversation with the Syntezis team — creators, brands, agencies, investors, partners and media.",
};

export default function ContactPage() {
  return (
    <>
      <section className="mx-auto max-w-[1440px] px-5 pb-16 pt-36 md:px-10 md:pb-24 md:pt-44">
        <SectionHeader
          eyebrow="Contact"
          title={<>Start a conversation.</>}
          description="Creator, brand, agency, investor, partner or media — tell us what you're building and we'll route it to the right desk."
        />
      </section>
      <section className="mx-auto max-w-2xl px-5 pb-24 md:px-10 md:pb-36">
        <div className="rounded-[32px] border border-ink/10 bg-paper p-6 md:p-10">
          <Suspense fallback={null}>
            <ContactForm />
          </Suspense>
        </div>
      </section>
    </>
  );
}
