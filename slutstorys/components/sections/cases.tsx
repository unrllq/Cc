import StackingCards, { StackingCardItem } from "@/components/ui/stacking-cards";
import { cn } from "@/lib/utils";

const cases = [
  {
    client: "Velvet Lab · Kosmetik",
    title: "Der Lippenstift, an dem eine Beziehung zerbrach",
    text: "Eine Serie aus 12 Reels über ein Paar, das sich über einen Farbton streitet. Das Finale haben die Follower per Voting entschieden.",
    metrics: [["38 Mio.", "Views"], ["+412 %", "Sales des Farbtons"], ["6 Wochen", "ausverkauft"]],
    card: "bg-pink text-ink",
    art: "radial-gradient(circle at 30% 30%,#ffd66b,transparent 45%),radial-gradient(circle at 70% 70%,#3f3cbb,transparent 50%),#0b0a0d",
    big: "01",
  },
  {
    client: "Nachtburger · Foodtech",
    title: "Der Burger, den du Mama nicht zeigen darfst",
    text: "Anti-Werbung: ein verbotenes Menü nach Mitternacht, ein geheimes Passwort in den Stories und eine Schlange von 900 Leuten.",
    metrics: [["×5,1", "ROMI"], ["900", "Leute in der Schlange"], ["2,4 Mio.", "UGC-Reichweite"]],
    card: "bg-butter text-ink",
    art: "conic-gradient(from 90deg,#ff3b2f,#ff2e88,#0b0a0d,#ff3b2f)",
    big: "02",
  },
  {
    client: "Orbita Bank · Fintech",
    title: "Die Bank, die ihre Gefühle gestand",
    text: "Rebranding über eine Serie von Mitarbeiter-„Beichten“. Aus der langweiligsten Bank wurde in einem Monat die meistdiskutierte.",
    metrics: [["+68 %", "Bekanntheit"], ["−31 %", "CPA"], ["#1", "bei Erwähnungen"]],
    card: "bg-indigo text-bone",
    art: "radial-gradient(circle at 50% 40%,#ff2e88,transparent 55%),linear-gradient(200deg,#ffd66b,#3f3cbb)",
    big: "03",
  },
  {
    client: "Saint Sin · Fashion",
    title: "Der Drop, über den alle flüsterten",
    text: "Teaser-Kampagne ohne Logo und ohne Produkt — nur Gerüchte, Leaks und ein geschlossener Chat mit 10.000 Leuten.",
    metrics: [["11 Min.", "bis ausverkauft"], ["10.000", "im geheimen Chat"], ["0 €", "fürs Seeding"]],
    card: "bg-bone text-ink",
    art: "radial-gradient(circle at 40% 60%,#ff3b2f,transparent 50%),radial-gradient(circle at 80% 20%,#ff2e88,transparent 45%),#0b0a0d",
    big: "04",
  },
];

export function Cases() {
  return (
    <section id="cases" className="relative scroll-mt-10 pt-24">
      <div className="mx-auto max-w-[1600px] px-4 md:px-8">
        <p className="mb-6 font-mono text-xs uppercase tracking-[0.25em] text-pink">/ 03 — Cases</p>
        <h2 className="font-display text-[12vw] uppercase leading-[0.9] md:text-[6vw]">
          Stories, <span className="stroke-text">die</span>
          <br />
          passiert sind
        </h2>
      </div>

      <StackingCards totalCards={cases.length} scaleMultiplier={0.04} className="pb-[20vh]">
        {cases.map((c, i) => (
          <StackingCardItem key={c.title} index={i} className="h-[100svh]" topPosition={`${8 + i * 2.5}%`}>
            <article
              className={cn(
                c.card,
                "mx-auto flex h-[82%] w-[94%] max-w-[1500px] flex-col gap-6 overflow-hidden rounded-[32px] p-6 md:flex-row md:p-10",
              )}
            >
              <div className="flex flex-1 flex-col justify-between gap-6">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-70">{c.client}</p>
                  <h3 className="mt-4 max-w-[16ch] font-display text-3xl uppercase leading-[0.95] md:text-6xl">{c.title}</h3>
                  <p className="mt-5 max-w-md text-[15px] leading-relaxed opacity-80 md:text-base">{c.text}</p>
                </div>
                <dl className="grid grid-cols-3 gap-4 border-t border-current/20 pt-5">
                  {c.metrics.map(([v, l]) => (
                    <div key={l}>
                      <dt className="font-display text-2xl md:text-4xl">{v}</dt>
                      <dd className="mt-1 font-mono text-[10px] uppercase tracking-wider opacity-60 md:text-[11px]">{l}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div style={{ background: c.art }} className={cn("relative min-h-40 flex-1 overflow-hidden rounded-3xl md:min-h-0")}>
                <div className="grain absolute inset-0 opacity-50 mix-blend-overlay" />
                <span className="absolute -bottom-[0.18em] -right-[0.04em] font-display text-[44vw] leading-none text-bone/90 mix-blend-overlay md:text-[22vw]">
                  {c.big}
                </span>
                <span className="absolute left-5 top-5 rounded-full bg-ink/70 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-bone backdrop-blur">
                  case study
                </span>
              </div>
            </article>
          </StackingCardItem>
        ))}
      </StackingCards>
    </section>
  );
}
