"use client";

// Gallery → Timeline. A pinned collage of project tiles drifts at different
// depths while you scroll; then the collage breaks apart and the centre tile
// flies into the exact box the timeline's image occupies. At that moment the
// timeline section (pulled up over the gallery's last screen, see
// .tl-handoff in globals.css) reaches the top, shows the same image in the
// same place and takes over: its track slides sideways, and after it the
// page carries on downward.

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Timeline, { type JourneyItem } from "@/components/ui/timeline";
import { HERO_IMAGES, TIMELINE_IMAGE } from "@/lib/art";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

// Tile boxes in vw / vh, plus a depth that sets how fast each drifts.
type Box = { l: number; t: number; w: number; h: number; d: number };

const DESKTOP: Box[] = [
  { l: 3, t: 14, w: 19, h: 25, d: 1.5 },
  { l: 7, t: 58, w: 22, h: 30, d: 1.1 },
  { l: 25, t: 6, w: 13, h: 17, d: 2.0 },
  { l: 67, t: 9, w: 18, h: 24, d: 1.3 },
  { l: 87, t: 34, w: 11, h: 18, d: 2.2 },
  { l: 71, t: 52, w: 24, h: 33, d: 0.9 },
  { l: 39, t: 80, w: 15, h: 19, d: 1.8 },
];
const DESKTOP_KEY: Box = { l: 35, t: 27, w: 30, h: 46, d: 0 };

const MOBILE: Box[] = [
  { l: -6, t: 10, w: 46, h: 16, d: 1.4 },
  { l: 58, t: 6, w: 44, h: 15, d: 1.9 },
  { l: 62, t: 74, w: 46, h: 17, d: 1.2 },
  { l: -8, t: 78, w: 50, h: 18, d: 1.7 },
];
const MOBILE_KEY: Box = { l: 12, t: 31, w: 76, h: 38, d: 0 };

const PROJECTS = HERO_IMAGES.slice(0, 7);

const TOP_STEPS: JourneyItem[] = [
  {
    id: "s1",
    kicker: "01",
    title: "Erstgespräch",
    content: "Wir hören zu: Prozesse, Tools und Engpässe – mit Blick auf Ihr Tagesgeschäft, nicht auf Folien.",
  },
  {
    id: "s3",
    kicker: "03",
    title: "Architektur",
    content: "Ein Integrationsplan mit Schnittstellen, Datenflüssen und DSGVO-konformer Infrastruktur.",
  },
  {
    id: "s5",
    kicker: "05",
    title: "Umsetzung",
    content: "APIs, Middleware und Automationen – wir verbinden Ihre Systeme Schritt für Schritt.",
  },
  {
    id: "s7",
    kicker: "07",
    title: "Betrieb",
    content: "Monitoring rund um die Uhr, Hosting in Deutschland und ein fester Ansprechpartner.",
  },
];

const BOTTOM_STEPS: JourneyItem[] = [
  {
    id: "s2",
    kicker: "02",
    title: "System-Audit",
    content: "Wir kartieren jede Datenquelle – vom ERP bis zur Excel-Liste – und finden doppelte Arbeit.",
  },
  {
    id: "s4",
    kicker: "04",
    title: "Prototyp",
    content: "Nach zwei Wochen läuft der erste echte Datenfluss: messbar, testbar, live.",
  },
  {
    id: "s6",
    kicker: "06",
    title: "Übergabe",
    content: "Dokumentation auf Deutsch, Schulungen fürs Team und klare Zuständigkeiten.",
  },
];

export function GalleryTimeline() {
  const galleryRef = useRef<HTMLElement>(null);
  const handoffRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const gallery = galleryRef.current;
    const handoff = handoffRef.current;
    const section = handoff?.querySelector("section");
    if (!gallery || !section) return;

    const mm = gsap.matchMedia();
    const vw = (n: number) => (n * window.innerWidth) / 100;
    const vh = (n: number) => (n * window.innerHeight) / 100;

    // Where the timeline draws its image while its section sits at the top
    // of the viewport. offset* ignores the track's sideways transform; the
    // transformed track is itself an offsetParent, so walk up to the frame.
    const target = () => {
      const img = section.querySelector<HTMLElement>("[data-tl-image]");
      const frame = section.querySelector<HTMLElement>("[data-tl-sticky]");
      if (!img) return { left: 0, top: 0, width: 0, height: 0, radius: "0px" };
      let left = 0;
      let top = 0;
      for (let el: HTMLElement | null = img; el && el !== frame; el = el.offsetParent as HTMLElement | null) {
        left += el.offsetLeft;
        top += el.offsetTop;
      }
      return {
        left,
        top,
        width: img.offsetWidth,
        height: img.offsetHeight,
        radius: getComputedStyle(img).borderTopLeftRadius,
      };
    };

    const build = (boxes: Box[], keyBox: Box) => {
      const tiles = gsap.utils.toArray<HTMLElement>("[data-g-tile]", gallery);
      const key = gallery.querySelector<HTMLElement>("[data-g-key]")!;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      tiles.forEach((el, i) => {
        const b = boxes[i];
        if (!b) {
          gsap.set(el, { display: "none" });
          return;
        }
        gsap.set(el, { display: "block", left: `${b.l}vw`, top: `${b.t}vh`, width: `${b.w}vw`, height: `${b.h}vh` });
      });
      gsap.set(gallery.querySelector("[data-g-stage]"), { autoAlpha: 1 });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: gallery,
          start: "top top",
          end: "bottom bottom",
          scrub: reduced ? true : 0.6,
          invalidateOnRefresh: true,
        },
      });

      // Phase 1: the collage drifts, nearer tiles faster.
      tiles.forEach((el, i) => {
        const b = boxes[i];
        if (!b) return;
        tl.to(el, { y: () => -vh(b.d * 14) }, 0);
      });
      tl.to("[data-g-title]", { y: () => -vh(8) }, 0);
      const start = {
        left: () => vw(keyBox.l),
        top: () => vh(keyBox.t),
        width: () => vw(keyBox.w),
        height: () => vh(keyBox.h),
        borderRadius: 18,
      };
      tl.fromTo(key, { ...start, scale: 1 }, { ...start, scale: 1.03, duration: 0.5 }, 0);

      // Phase 2: the collage scatters outward and the key tile lands.
      tiles.forEach((el, i) => {
        const b = boxes[i];
        if (!b) return;
        const dx = b.l + b.w / 2 - 50;
        const dy = b.t + b.h / 2 - 50;
        tl.to(
          el,
          {
            x: () => vw(dx * 0.9),
            y: () => -vh(b.d * 14) + vh(dy * 0.9),
            scale: 0.7,
            autoAlpha: 0,
            duration: 0.4,
            ease: "power1.in",
          },
          0.5,
        );
      });
      tl.to(["[data-g-title]", "[data-g-caption]"], { autoAlpha: 0, duration: 0.2 }, 0.5);
      tl.to(
        key,
        {
          left: () => target().left,
          top: () => target().top,
          width: () => target().width,
          height: () => target().height,
          borderRadius: () => target().radius,
          scale: 1,
          duration: 0.45,
          ease: "power2.inOut",
        },
        0.55,
      );
      return () => tl.scrollTrigger?.kill();
    };

    mm.add("(min-width: 601px)", () => build(DESKTOP, DESKTOP_KEY));
    mm.add("(max-width: 600px)", () => build(MOBILE, MOBILE_KEY));

    // The timeline frame takes over once its section reaches the top.
    const live = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom top",
      toggleClass: { targets: section, className: "is-live" },
    });

    return () => {
      live.kill();
      mm.revert();
    };
  }, []);

  return (
    <>
      <section
        id="projekte"
        ref={galleryRef}
        aria-label="Ausgewählte Projekte"
        className="relative h-[320vh] w-full bg-background max-[600px]:h-[300vh]"
      >
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          <div data-g-stage className="invisible absolute inset-0">
            <div
              data-g-title
              className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-5 text-center"
            >
              <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.3em] text-accent">
                Ausgewählte Projekte
              </p>
              <h2 className="text-balance text-[clamp(2.6rem,9vw,9.5rem)] font-extrabold leading-[0.86] tracking-[-0.045em] text-foreground/[0.09]">
                Systeme, die
                <br />
                zusammenspielen.
              </h2>
            </div>

            {PROJECTS.map((p) => (
              <figure
                key={p.title}
                data-g-tile
                className="absolute m-0 hidden will-change-transform"
              >
                <div className="h-full w-full overflow-hidden rounded-[14px] border border-white/5 bg-muted">
                  <img src={p.src} alt={p.alt} draggable={false} className="h-full w-full object-cover" />
                </div>
                <figcaption className="mt-2 flex items-baseline justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.16em]">
                  <span className="truncate text-foreground/80">{p.title}</span>
                  <span className="shrink-0 text-muted-foreground">{p.tag}</span>
                </figcaption>
              </figure>
            ))}

            <div
              data-g-key
              className="absolute z-10 overflow-hidden bg-muted shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] will-change-transform"
            >
              <img
                src={TIMELINE_IMAGE}
                alt="Vernetzte Standorte in ganz Deutschland"
                draggable={false}
                className="h-full w-full object-cover"
              />
              <div
                data-g-caption
                className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/80 to-transparent p-4 sm:p-5"
              >
                <div className="text-left">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">Fallstudie</p>
                  <p className="mt-1 text-base font-semibold leading-tight sm:text-xl">
                    14 Standorte, ein Datenbestand
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/70">
                  ERP · WMS · BI
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div ref={handoffRef} className="contents">
        <Timeline
          id="ablauf"
          className="tl-handoff"
          title="Unser Ablauf"
          periodLabel="Vom Erstgespräch bis zum Go-Live"
          topItems={TOP_STEPS}
          bottomItems={BOTTOM_STEPS}
          imageUrl={TIMELINE_IMAGE}
          imageAlt="Vernetzte Standorte in ganz Deutschland"
          backgroundColor="transparent"
          textColor="var(--color-foreground)"
          mutedTextColor="var(--color-muted-foreground)"
          activeColor="#ff5a1f"
          duration={1.4}
        />
      </div>
    </>
  );
}
