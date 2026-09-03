import type { Metadata } from "next";
import { SectionHeader } from "@/components/site/section-header";
import { OpportunityCard } from "@/components/site/opportunity-card";
import { Reveal } from "@/components/ui/reveal";
import { OPPORTUNITIES } from "@/lib/data";

export const metadata: Metadata = {
  title: "Brand Opportunities — SYNTEZIS INCUBATOR",
  description: "Open brand campaigns for Syntezis resident creators across Europe.",
};

export default function BrandsPage() {
  return (
    <>
      <section className="mx-auto max-w-[1440px] px-5 pb-16 pt-36 md:px-10 md:pb-24 md:pt-44">
        <SectionHeader
          eyebrow="Brand Opportunities"
          title={<>Open briefs for resident creators.</>}
          description={`${OPPORTUNITIES.length} live campaigns from European brands, routed exclusively through the Syntezis network.`}
        />
      </section>
      <section className="mx-auto max-w-[1440px] px-5 pb-24 md:px-10 md:pb-36">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {OPPORTUNITIES.map((o, i) => (
            <Reveal key={o.slug} delay={(i % 6) * 0.05}>
              <OpportunityCard opp={o} />
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
