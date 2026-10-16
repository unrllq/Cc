import { TestimonialsColumn, type Testimonial } from "@/components/ui/testimonials-columns";

const t: Testimonial[] = [
  { text: "Wir kamen für Reichweite und gingen mit einem Kult. Kunden zitieren unsere Reels an der Kasse.", name: "Lena Krause", role: "CMO, Velvet Lab", tint: "bg-pink" },
  { text: "Zum ersten Mal hat eine Agentur mit uns gestritten — und recht behalten. Der ROMI hat sich verfünffacht.", name: "Timo Albers", role: "Gründer, Nachtburger", tint: "bg-butter" },
  { text: "Sie haben eine Story gefunden, wo wir nur ein Bankprodukt sahen. Magie mit Excel-Reports.", name: "Ottilie Meier", role: "Head of Brand, Orbita", tint: "bg-indigo" },
  { text: "Der Drop war in 11 Minuten weg. Ich verstehe bis heute nicht, wie sie das ohne Werbung geschafft haben.", name: "Mark Schäfer", role: "CEO, Saint Sin", tint: "bg-blood" },
  { text: "Schnell, frech, auf den Punkt. Der erste Clip war eine Woche nach dem Briefing online.", name: "Vera Lindner", role: "Marketing, Lumen Studio", tint: "bg-bone" },
  { text: "Über unser langweiliges SaaS werden jetzt Memes gemacht. Leads sind 40 % günstiger.", name: "David Ortmann", role: "CPO, Stackbox", tint: "bg-pink" },
  { text: "Wöchentliche Reports, die man wirklich liest. Das ist eine eigene Kunstform.", name: "Nina Graf", role: "Geschäftsführerin, Rheingau Wein Co", tint: "bg-butter" },
  { text: "Der Name hat unseren Vorstand erschreckt — genau bis zur ersten Ergebnispräsentation.", name: "Ingo Wetzel", role: "COO, Nordhandel", tint: "bg-indigo" },
  { text: "Bei denen gibt es kein „ganz okay“. Entweder Feuer oder ein ehrliches „machen wir neu“.", name: "Sascha Kaya", role: "Brand Manager, Pulse", tint: "bg-blood" },
];

export function Voices() {
  return (
    <section id="voices" className="relative mx-auto max-w-[1600px] scroll-mt-24 px-4 py-24 md:px-8">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.25em] text-pink">/ 05 — Klatsch über uns</p>
          <h2 className="font-display text-[12vw] uppercase leading-[0.9] md:text-[5vw]">
            Was man über uns <span className="serif-i normal-case text-butter">flüstert</span>
          </h2>
          <p className="mt-6 max-w-sm text-bone/60">
            Ehrliche Kundenstimmen. Wir haben um etwas Gemeines gebeten — keiner hat es geschafft.
          </p>
        </div>
        <div className="flex max-h-[760px] justify-center gap-6 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]">
          <TestimonialsColumn testimonials={t.slice(0, 3)} duration={17} />
          <TestimonialsColumn testimonials={t.slice(3, 6)} className="hidden md:block" duration={22} />
          <TestimonialsColumn testimonials={t.slice(6, 9)} className="hidden xl:block" duration={19} />
        </div>
      </div>
    </section>
  );
}
