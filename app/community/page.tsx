import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeader } from "@/components/site/section-header";
import { CommunityEvents } from "@/components/site/community-events";
import { Reveal } from "@/components/ui/reveal";
import { buttonVariants } from "@/components/ui/button-variants";
import { EVENTS } from "@/lib/data";

export const metadata: Metadata = {
  title: "Community — SYNTEZIS INCUBATOR",
  description: "Discussions, events, workshops, meetups and open calls across the Syntezis European network.",
};

const DISCUSSIONS = [
  { topic: "Disclosure norms for synthetic personalities", replies: 34 },
  { topic: "Best real-time engines for character rigs in 2026", replies: 21 },
  { topic: "How are you pricing brand collaborations?", replies: 47 },
  { topic: "Voice cloning ethics — where's the line?", replies: 18 },
];

export default function CommunityPage() {
  return (
    <>
      <section className="mx-auto max-w-[1440px] px-5 pb-16 pt-36 md:px-10 md:pb-24 md:pt-44">
        <SectionHeader
          eyebrow="Community"
          title={<>Discussions, events &amp; open calls.</>}
          description="The Syntezis community spans discussions, studio nights, workshops and open calls — most of it happens in Berlin, all of it is open to the network."
        />
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pb-24 md:px-10 md:pb-36">
        <span className="label-mono text-ink/40">Events &amp; Workshops</span>
        <div className="mt-6">
          <CommunityEvents events={EVENTS} />
        </div>
      </section>

      <section className="bg-dark py-24 text-off-white md:py-36">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <span className="label-mono text-off-white/40">Discussions</span>
              <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
                What the network is talking about.
              </h2>
            </div>
            <Link href="/contact" className={buttonVariants({ variant: "lime" })}>
              Start a thread <ArrowUpRight size={15} className="ml-1" />
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {DISCUSSIONS.map((d, i) => (
              <Reveal key={d.topic} delay={i * 0.05}>
                <div className="flex items-center justify-between gap-6 rounded-2xl border border-off-white/12 px-6 py-5">
                  <span className="text-base font-medium">{d.topic}</span>
                  <span className="label-mono shrink-0 text-off-white/40">{d.replies} REPLIES</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 md:py-36">
        <Reveal>
          <div className="flex flex-col items-center gap-8 rounded-[40px] border border-ink/10 bg-paper px-6 py-16 text-center md:py-24">
            <span className="label-mono text-ink/40">Open Call — Cohort 05</span>
            <h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
              Join the community before you apply.
            </h2>
            <Link href="/apply" className={buttonVariants({ variant: "primary", size: "lg" })}>
              Apply to Syntezis <ArrowUpRight size={16} className="ml-1" />
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
