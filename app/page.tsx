import Link from "next/link";
import { ArrowUpRight, Quote } from "lucide-react";
import ScrollMorphHero from "@/components/ui/scroll-morph-hero";
import { HeroInfoCards } from "@/components/site/hero-info-cards";
import { LiveTicker } from "@/components/site/live-ticker";
import { SectionHeader } from "@/components/site/section-header";
import { Pipeline } from "@/components/site/pipeline";
import { NetworkMap } from "@/components/site/network-map";
import { CreatorCard } from "@/components/site/creator-card";
import { EventCard } from "@/components/site/event-card";
import { ArticleCard } from "@/components/site/article-card";
import { Reveal } from "@/components/ui/reveal";
import { Marquee } from "@/components/ui/marquee";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { buttonVariants } from "@/components/ui/button-variants";
import { generateAvatar } from "@/lib/avatar";
import { CREATORS, EVENTS, ARTICLES } from "@/lib/data";
import { PROGRAM_STAGES } from "@/lib/program";

const STUDIO_MODULES = [
  "Production Studio",
  "Photo / Video",
  "AI Workstations",
  "Editing Suites",
  "Creator Lounge",
  "Meeting Rooms",
  "Event Space",
];

const STUDIO_CAPABILITIES = [
  { n: "01", title: "AI Image", desc: "Character-consistent AI image production at campaign scale." },
  { n: "02", title: "AI Video", desc: "Short and long-form synthetic video, from previz to final cut." },
  { n: "03", title: "3D", desc: "Real-time 3D pipelines for character and environment work." },
  { n: "04", title: "Motion", desc: "Performance capture and generative motion design." },
];

const QUOTES = [
  { quote: "I wanted to build a digital character that could exist beyond a single image.", name: "Mia Nova", city: "Berlin" },
  { quote: "Real-time 3D replaced my camera. SYNTEZIS gave me the floor to prove it.", name: "Noah K", city: "Warsaw" },
  { quote: "The studio treats a character launch like a season of television — not a post.", name: "Sofia Kowalska", city: "Warsaw" },
];

export default function Home() {
  const featuredCreators = CREATORS.slice(0, 8);
  const upcomingEvents = EVENTS.slice(0, 3);
  const articles = ARTICLES.slice(0, 3);

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="relative h-[100svh] min-h-[640px] w-full pt-20">
        <ScrollMorphHero />
        <HeroInfoCards />
        <div className="pointer-events-none absolute inset-x-0 top-24 z-20 flex flex-col items-center px-4 text-center md:top-28">
          <span className="label-mono rounded-full border border-ink/15 bg-off-white/70 px-4 py-2 text-ink/60 backdrop-blur">
            European incubator for digital influencers &amp; synthetic media
          </span>
        </div>
      </section>

      <LiveTicker />

      {/* ================= 01 / WHAT IS SYNTEZIS ================= */}
      <section className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 md:py-36">
        <div className="grid gap-12 md:grid-cols-2 md:gap-20">
          <SectionHeader
            eyebrow="01 / The Incubator"
            title={
              <>
                We don&rsquo;t just
                <br />
                create characters.
                <br />
                <span className="text-ink/35">We build digital talent.</span>
              </>
            }
          />
          <Reveal delay={0.1} className="flex flex-col justify-between gap-10">
            <p className="text-lg leading-relaxed text-ink/60 md:text-xl">
              SYNTEZIS is a physical creative-tech environment where European teams develop, produce, launch
              and scale digital personalities and synthetic media projects — from first concept to a real,
              revenue-generating brand.
            </p>
            <div className="grid grid-cols-2 gap-6 md:gap-8">
              <Stat n="01" label="Physical Hub" value="Berlin Campus" />
              <Stat n="02" label="Creators" value="European" />
              <Stat n="03" label="Production" value="Full-Cycle" />
              <Stat n="04" label="Location" value="Berlin, Germany" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= 02 / PIPELINE ================= */}
      <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-10 md:py-24">
        <SectionHeader
          eyebrow="02 / The Syntezis Pipeline"
          title={<>From idea to influence.</>}
          description="Seven connected modules take a project from a raw idea to a real business. Hover a module to preview it, click to see the detail."
          className="mb-14"
        />
        <Pipeline />
      </section>

      {/* ================= 03 / PROGRAM ================= */}
      <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-10 md:py-24">
        <div className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeader eyebrow="03 / The Program" title={<>Four stages. One studio floor.</>} />
          <Link href="/program" className={buttonVariants({ variant: "outline" })}>
            View full program <ArrowUpRight size={15} className="ml-1" />
          </Link>
        </div>
        <Accordion defaultOpen="discover">
          {PROGRAM_STAGES.map((s) => (
            <AccordionItem key={s.key} value={s.key} eyebrow={s.n} title={s.title}>
              <p className="mb-5 max-w-2xl text-ink/60">{s.summary}</p>
              <div className="flex flex-wrap gap-2">
                {s.items.map((item) => (
                  <span key={item} className="label-mono rounded-full border border-ink/15 px-3 py-1.5 text-ink/60">
                    {item}
                  </span>
                ))}
              </div>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* ================= 04 / PHYSICAL HUB ================= */}
      <section className="bg-ink py-24 text-off-white md:py-36">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <div className="mb-14 grid gap-10 md:grid-cols-2 md:gap-20">
            <Reveal>
              <span className="label-mono text-off-white/40">04 / The Berlin Campus</span>
              <h2 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
                The house of
                <br />
                synthetic media.
              </h2>
            </Reveal>
            <Reveal delay={0.1} className="flex flex-col justify-end gap-6">
              <p className="max-w-lg text-lg leading-relaxed text-off-white/60">
                SYNTEZIS is physical. A creative campus in Berlin built for production, not just meetings —
                studio floors, AI workstations and a resident creator community under one roof.
              </p>
              <div className="label-mono flex flex-wrap gap-x-8 gap-y-2 text-off-white/40">
                <span>BERLIN, GERMANY</span>
                <span>52.5200° N</span>
                <span>13.4050° E</span>
              </div>
            </Reveal>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {STUDIO_MODULES.map((m, i) => (
              <Reveal key={m} delay={i * 0.04}>
                <div className="flex h-32 flex-col justify-between rounded-2xl border border-off-white/12 p-5 transition-colors hover:border-lime md:h-40">
                  <span className="label-mono text-off-white/30">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-sm font-semibold leading-snug md:text-base">{m}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 05 / STUDIO ================= */}
      <section className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 md:py-36">
        <div className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeader eyebrow="05 / The Studio" title={<>Full-cycle production, in-house.</>} />
          <Link href="/studio" className={buttonVariants({ variant: "outline" })}>
            Explore the studio <ArrowUpRight size={15} className="ml-1" />
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {STUDIO_CAPABILITIES.map((c, i) => (
            <Reveal key={c.n} delay={i * 0.05}>
              <div className="flex h-64 flex-col justify-between rounded-3xl border border-ink/10 bg-paper p-6 transition-shadow hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
                <span className="label-mono text-ink/35">{c.n}</span>
                <div>
                  <p className="text-xl font-semibold tracking-tight">{c.title}</p>
                  <p className="mt-2 text-sm text-ink/55">{c.desc}</p>
                </div>
                <Link href="/studio" className="label-mono flex items-center gap-1.5 text-ink/60">
                  Explore <ArrowUpRight size={13} />
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= 06 / CREATORS ================= */}
      <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-10 md:py-24">
        <div className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeader eyebrow="06 / Creator Directory" title={<>Meet the Syntezis creators.</>} />
          <Link href="/creators" className={buttonVariants({ variant: "outline" })}>
            View all 20 creators <ArrowUpRight size={15} className="ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {featuredCreators.map((c, i) => (
            <Reveal key={c.slug} delay={(i % 4) * 0.05}>
              <CreatorCard creator={c} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= EDITORIAL BREAK ================= */}
      <section className="relative overflow-hidden bg-off-white py-28 md:py-44">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center px-5 text-center md:px-10">
          <Reveal>
            <h2 className="text-5xl font-semibold leading-[0.95] tracking-tight md:text-8xl lg:text-[9rem]">
              THE FUTURE
              <br />
              IS NOT WATCHING.
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <h3 className="mt-6 text-5xl font-semibold italic leading-[0.95] tracking-tight text-ink/30 md:text-8xl lg:text-[9rem]">
              IT IS CREATING.
            </h3>
          </Reveal>
        </div>
      </section>

      <Marquee
        items={[
          "BERLIN",
          "EUROPE",
          "DIGITAL TALENT",
          "VIRTUAL INFLUENCERS",
          "SYNTHETIC MEDIA",
          "AI CREATORS",
          "NEW CULTURE",
          "NEW IDENTITIES",
        ]}
      />

      {/* ================= 07 / NETWORK ================= */}
      <section className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 md:py-36">
        <div className="grid gap-14 md:grid-cols-2 md:items-center">
          <SectionHeader
            eyebrow="07 / European Network"
            title={
              <>
                One hub.
                <br />
                Many cities.
              </>
            }
            description="Berlin is the physical center — resident creators and community chapters connect from cities across Europe."
          />
          <Reveal delay={0.1}>
            <NetworkMap />
          </Reveal>
        </div>
      </section>

      {/* ================= 08 / CREATOR STORIES ================= */}
      <section className="bg-dark py-24 text-off-white md:py-36">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <span className="label-mono text-off-white/40">08 / Creator Stories</span>
          <h2 className="mb-14 mt-6 max-w-2xl text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Why they build with Syntezis.
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {QUOTES.map((q, i) => (
              <Reveal key={q.name} delay={i * 0.08}>
                <div className="flex h-full flex-col justify-between gap-8 rounded-3xl border border-off-white/12 p-7">
                  <Quote size={28} className="text-lime" />
                  <p className="text-lg leading-snug">&ldquo;{q.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <img src={generateAvatar(q.name, 64, 64)} alt="" className="h-10 w-10 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-semibold">{q.name}</p>
                      <p className="label-mono text-off-white/40">{q.city.toUpperCase()}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 09 / COMMUNITY ================= */}
      <section className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 md:py-36">
        <div className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeader eyebrow="09 / Community" title={<>Upcoming across Europe.</>} />
          <Link href="/community" className={buttonVariants({ variant: "outline" })}>
            All events <ArrowUpRight size={15} className="ml-1" />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {upcomingEvents.map((e, i) => (
            <Reveal key={e.slug} delay={i * 0.06}>
              <EventCard event={e} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= 10 / JOURNAL ================= */}
      <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-10 md:py-24">
        <div className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeader eyebrow="10 / Journal" title={<>News, research &amp; interviews.</>} />
          <Link href="/journal" className={buttonVariants({ variant: "outline" })}>
            Read the journal <ArrowUpRight size={15} className="ml-1" />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {articles.map((a, i) => (
            <Reveal key={a.slug} delay={i * 0.06}>
              <ArticleCard article={a} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= APPLY CTA ================= */}
      <section className="mx-auto max-w-[1440px] px-5 pb-24 md:px-10 md:pb-36">
        <Reveal>
          <div className="flex flex-col items-center gap-8 rounded-[40px] bg-ink px-6 py-20 text-center text-off-white md:py-28">
            <span className="label-mono text-off-white/40">Applications open — Cohort 05</span>
            <h2 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
              Build with Syntezis.
            </h2>
            <Link href="/apply" className={buttonVariants({ variant: "lime", size: "lg" })}>
              Submit application <ArrowUpRight size={16} className="ml-1" />
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}

function Stat({ n, label, value }: { n: string; label: string; value: string }) {
  return (
    <div className="border-t border-ink/12 pt-4">
      <span className="label-mono text-ink/35">{n}</span>
      <p className="mt-2 text-lg font-semibold tracking-tight">{value}</p>
      <p className="label-mono mt-0.5 text-ink/40">{label}</p>
    </div>
  );
}
