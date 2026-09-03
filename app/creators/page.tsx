import type { Metadata } from "next";
import { SectionHeader } from "@/components/site/section-header";
import { CreatorsDirectory } from "@/components/site/creators-directory";
import { CREATORS, CITIES } from "@/lib/data";

export const metadata: Metadata = {
  title: "Creators — SYNTEZIS INCUBATOR",
  description: "Meet the Syntezis creators — 20 resident digital personalities and synthetic media artists across Europe.",
};

export default function CreatorsPage() {
  return (
    <>
      <section className="mx-auto max-w-[1440px] px-5 pb-12 pt-36 md:px-10 md:pb-16 md:pt-44">
        <SectionHeader
          eyebrow="Creator Directory"
          title={<>Meet the Syntezis creators.</>}
          description="Twenty resident digital personalities, built and produced inside the Berlin studio floor and its European network."
        />
      </section>
      <section className="mx-auto max-w-[1440px] px-5 pb-24 md:px-10 md:pb-36">
        <CreatorsDirectory creators={CREATORS} cities={CITIES} />
      </section>
    </>
  );
}
