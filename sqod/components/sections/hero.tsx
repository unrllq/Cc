import { TiltedGridHero } from "@/components/ui/tilted-grid-hero";
import { HERO_IMAGES } from "@/lib/art";

export function Hero() {
  return (
    <TiltedGridHero
      id="top"
      images={HERO_IMAGES}
      tileHeight={25}
      axis={55}
      className="h-[100svh] min-h-[640px] w-full bg-background"
    >
      <div className="relative z-10 flex h-full flex-col items-center justify-between px-5 pb-8 pt-24 text-center sm:pb-10 sm:pt-28">
        <div className="flex flex-col items-center gap-5">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
            <span className="pulse-dot size-1.5 rounded-full bg-accent" />
            Systemintegration · Made in Germany
          </p>
          <h1 className="text-balance text-[clamp(2.5rem,7vw,6.4rem)] font-extrabold leading-[0.92] tracking-[-0.035em]">
            Ihre Systeme.
            <br />
            <span className="font-light italic text-foreground/70">Endlich im Gespräch.</span>
          </h1>
        </div>

        <div className="flex w-full max-w-5xl flex-col items-center gap-6">
          <p className="max-w-xl text-balance text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            SQOD verbindet ERP, CRM, Shop, Buchhaltung und Fachsoftware zu einem System, das
            zusammenarbeitet – sicher, DSGVO-konform und gehostet in Deutschland.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="#kontakt"
              className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-background transition hover:bg-foreground"
            >
              Kostenloses Erstgespräch
            </a>
            <a
              href="#projekte"
              className="rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:border-foreground/60"
            >
              Projekte ansehen ↓
            </a>
          </div>
        </div>
      </div>
    </TiltedGridHero>
  );
}
