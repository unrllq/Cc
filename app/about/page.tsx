import type { Metadata } from "next";
import { SectionHeader } from "@/components/site/section-header";
import { NetworkMap } from "@/components/site/network-map";
import { Reveal } from "@/components/ui/reveal";
import { generateAvatar } from "@/lib/avatar";
import { MENTORS } from "@/lib/data";

export const metadata: Metadata = {
  title: "About — SYNTEZIS INCUBATOR",
  description: "Berlin is the lab. Why Syntezis exists and where it's headed, 2026–2029.",
};

const TIMELINE = [
  { year: "2026", title: "Founding", text: "SYNTEZIS opens its first physical campus in Berlin." },
  { year: "2027", title: "First Creator Cohort", text: "The first resident cohort moves through Discover, Build, Launch and Scale." },
  { year: "2028", title: "European Network", text: "Community chapters open across eight European cities." },
  { year: "2029", title: "International Expansion", text: "SYNTEZIS begins scoping its first hub outside Europe." },
];

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-[1440px] px-5 pb-16 pt-36 md:px-10 md:pb-24 md:pt-44">
        <SectionHeader
          eyebrow="About Syntezis"
          title={<>Berlin is the lab.</>}
          description="SYNTEZIS exists to create a physical European environment where technology, culture, identity and media production collide — a real building, a real studio floor, a real community, for a category of creative talent that is still inventing itself."
        />
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pb-24 md:px-10 md:pb-36">
        <div className="relative flex flex-col gap-8 border-l border-ink/12 pl-8 md:flex-row md:gap-4 md:border-l-0 md:border-t md:pl-0 md:pt-8">
          {TIMELINE.map((t, i) => (
            <Reveal key={t.year} delay={i * 0.06} className="flex-1">
              <div className="relative">
                <span className="absolute -left-[38px] top-1 h-3 w-3 rounded-full bg-lime md:-left-0 md:-top-[42px] md:left-0" />
                <p className="text-3xl font-semibold tracking-tight">{t.year}</p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-ink/70">{t.title}</p>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink/55">{t.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-off-white py-16 md:py-24">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <SectionHeader eyebrow="European Network" title={<>Eight cities, one physical center.</>} className="mb-14" />
          <Reveal>
            <NetworkMap />
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 md:py-36">
        <SectionHeader eyebrow="Team & Mentors" title={<>The people behind the program.</>} className="mb-14" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {MENTORS.map((m, i) => (
            <Reveal key={m.name} delay={(i % 4) * 0.05}>
              <div className="overflow-hidden rounded-3xl border border-ink/10 bg-paper">
                <img src={generateAvatar(m.name, 400, 500)} alt="" className="aspect-[4/5] w-full object-cover" />
                <div className="p-4">
                  <p className="font-semibold tracking-tight">{m.name}</p>
                  <p className="label-mono mt-1 text-ink/45">{m.role}</p>
                  <p className="mt-1 text-xs text-ink/50">{m.specialization}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
