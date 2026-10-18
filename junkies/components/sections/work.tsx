import { ArrowUpRight } from "lucide-react";

import type { Cap } from "@/lib/site";
import { SectionHead } from "./section-head";

// Fictional sample projects — replace with real case studies.
const WORK: { cap: Cap; client: string; title: string; kind: string; result: string; year: string; legend: string[] }[] = [
  { cap: "blue", client: "Hafenkante Mobility", title: "Flotten-App für 3.000 Fahrer", kind: "Mobile · Backend", result: "−38 % Leerfahrten", year: "2026", legend: ["GPS", "ETA", "PUSH"] },
  { cap: "amber", client: "Kontor Sieben", title: "Headless-Shop mit B2B-Portal", kind: "E-Commerce", result: "+61 % Online-Umsatz", year: "2025", legend: ["CART", "B2B", "ERP"] },
  { cap: "green", client: "Nordlicht Health", title: "Terminbuchung für 40 Praxen", kind: "Web-App · KI", result: "12 Min. gespart / Termin", year: "2025", legend: ["CAL", "AI", "DSGVO"] },
];

export function Work() {
  return (
    <section id="arbeiten" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          cap="green"
          index="F3"
          kicker="Arbeiten"
          title="Software, die jeden Tag benutzt wird."
          lead="Eine Auswahl aus den letzten Projekten. Mehr zeigen wir gern im Gespräch — viele Kunden mögen es diskret."
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {WORK.map((w, i) => (
            <article key={w.client} className="keycap-press group flex flex-col rounded-[2rem] bg-neo-bg p-4 shadow-neo">
              {/* visual: a mini keypad per project */}
              <div className={`cap-${w.cap} relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[1.5rem] shadow-neo-inner`}>
                <div aria-hidden className="absolute inset-0 opacity-60" style={{ background: `radial-gradient(70% 60% at ${30 + i * 20}% 30%, var(--cap), transparent 70%)` }} />
                <div className="relative flex gap-3 sm:gap-4">
                  {w.legend.map((l, j) => (
                    <span key={l} className={`keycap ${j === 1 ? `cap-${w.cap}` : "cap-plain"} size-16 text-[11px] sm:size-[4.5rem]`}>
                      {l}
                    </span>
                  ))}
                </div>
                <span className="absolute top-4 left-4 font-mono text-[10px] font-bold tracking-[0.2em] text-neo-text/70 uppercase">{w.kind}</span>
                <span className="absolute top-4 right-4 font-mono text-[10px] font-bold text-neo-text/70">{w.year}</span>
              </div>
              <div className="flex flex-1 flex-col gap-3 px-3 pt-6 pb-3">
                <span className="font-mono text-xs font-bold tracking-[0.14em] text-muted uppercase">{w.client}</span>
                <h3 className="text-xl font-bold tracking-tight">{w.title}</h3>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <span className={`cap-${w.cap} inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold shadow-neo-inner-sm`}>
                    <span className="led" /> {w.result}
                  </span>
                  <span className="grid size-10 place-items-center rounded-full shadow-neo-sm transition-shadow group-hover:shadow-neo-inner-sm" aria-hidden>
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
