import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeader } from "@/components/site/section-header";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Reveal } from "@/components/ui/reveal";
import { buttonVariants } from "@/components/ui/button-variants";
import { PROGRAM_STAGES } from "@/lib/program";

export const metadata: Metadata = {
  title: "The Program — SYNTEZIS INCUBATOR",
  description: "Four stages from idea to a scaled digital talent business: Discover, Build, Launch, Scale.",
};

export default function ProgramPage() {
  return (
    <>
      <section className="mx-auto max-w-[1440px] px-5 pb-16 pt-36 md:px-10 md:pb-24 md:pt-44">
        <SectionHeader
          eyebrow="The Program"
          title={
            <>
              Discover. Build.
              <br />
              Launch. Scale.
            </>
          }
          description="Every SYNTEZIS resident moves through the same four-stage program — structured enough to be predictable, open enough to fit any character, format or discipline."
        />
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pb-24 md:px-10">
        <Accordion defaultOpen="discover">
          {PROGRAM_STAGES.map((s) => (
            <AccordionItem key={s.key} value={s.key} eyebrow={s.n} title={s.title}>
              <p className="mb-6 max-w-2xl text-ink/60">{s.summary}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {s.items.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-paper px-4 py-3 text-sm font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                    {item}
                  </div>
                ))}
              </div>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pb-24 md:px-10 md:pb-36">
        <div className="grid gap-4 md:grid-cols-4">
          {PROGRAM_STAGES.map((s, i) => (
            <Reveal key={s.key} delay={i * 0.05}>
              <div className="flex h-full flex-col justify-between gap-8 rounded-3xl bg-ink p-6 text-off-white">
                <span className="label-mono text-off-white/40">{s.n}</span>
                <div>
                  <p className="text-xl font-semibold">{s.title}</p>
                  <p className="mt-2 text-sm text-off-white/55">{s.items[0]}, {s.items[1]}…</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pb-24 md:px-10 md:pb-36">
        <Reveal>
          <div className="flex flex-col items-center gap-8 rounded-[40px] border border-ink/10 bg-paper px-6 py-16 text-center md:py-24">
            <span className="label-mono text-ink/40">Cohort 05 — Applications Open</span>
            <h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
              Ready to start Discover?
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
