import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeader } from "@/components/site/section-header";
import { StudioServices } from "@/components/site/studio-services";
import { Reveal } from "@/components/ui/reveal";
import { buttonVariants } from "@/components/ui/button-variants";

export const metadata: Metadata = {
  title: "The Studio — SYNTEZIS INCUBATOR",
  description: "Full-cycle production capability: AI image, video, 3D, motion, voice, music, editing, photography and post production.",
};

export default function StudioPage() {
  return (
    <>
      <section className="mx-auto max-w-[1440px] px-5 pb-16 pt-36 md:px-10 md:pb-24 md:pt-44">
        <SectionHeader
          eyebrow="The Studio"
          title={<>Full-cycle production, in-house.</>}
          description="Every SYNTEZIS project is produced on the same studio floor — nine capabilities, one consistent finishing standard, built to move a character from concept to a shippable campaign without leaving the building."
        />
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pb-24 md:px-10 md:pb-36">
        <StudioServices />
      </section>

      <section className="bg-ink py-24 text-off-white md:py-36">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <div className="grid gap-10 md:grid-cols-2 md:gap-20">
            <Reveal>
              <span className="label-mono text-off-white/40">Studio Floor</span>
              <h2 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
                One standard.
                <br />
                Every format.
              </h2>
            </Reveal>
            <Reveal delay={0.1} className="flex flex-col justify-end gap-6">
              <p className="max-w-lg text-lg leading-relaxed text-off-white/60">
                Whether a deliverable starts as an AI render or a studio photograph, it passes through the same
                colour, grade and finishing pipeline — so the SYNTEZIS look stays consistent across every
                creator, every city, every campaign.
              </p>
              <Link href="/apply" className={buttonVariants({ variant: "lime", size: "lg", className: "w-fit" })}>
                Book the studio <ArrowUpRight size={16} className="ml-1" />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
