import type { Metadata } from "next";
import { SectionHeader } from "@/components/site/section-header";
import { JournalList } from "@/components/site/journal-list";
import { ARTICLES } from "@/lib/data";

export const metadata: Metadata = {
  title: "Journal — SYNTEZIS INCUBATOR",
  description: "News, interviews, creator stories, research and events from the Syntezis journal.",
};

export default function JournalPage() {
  return (
    <>
      <section className="mx-auto max-w-[1440px] px-5 pb-16 pt-36 md:px-10 md:pb-24 md:pt-44">
        <SectionHeader
          eyebrow="Journal"
          title={<>News, interviews &amp; research.</>}
          description="Reporting and perspective from inside the Syntezis studio floor and the wider synthetic media conversation."
        />
      </section>
      <section className="mx-auto max-w-[1440px] px-5 pb-24 md:px-10 md:pb-36">
        <JournalList articles={ARTICLES} />
      </section>
    </>
  );
}
