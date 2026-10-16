import HoverExpand, { type HoverExpandItem } from "@/components/ui/hover-expand";

const items: HoverExpandItem[] = [
  {
    id: "story",
    title: "Storytelling",
    description: "Wir finden den Skandal, die Leidenschaft oder das Geheimnis deiner Marke — und machen daraus einen Handlungsbogen fürs ganze Jahr.",
    tags: ["Brand Story", "Tone of Voice", "Content-Strategie"],
    background: "radial-gradient(120% 90% at 20% 10%, #ff2e88 0%, #3f3cbb 55%, #0b0a0d 100%)",
  },
  {
    id: "reels",
    title: "Reels & TikTok",
    description: "Vertikale Serien, die bis zum Ende geschaut werden. Skript, Casting, Produktion, Schnitt in 72 Stunden.",
    tags: ["Shorts", "UGC", "Produktion"],
    background: "radial-gradient(110% 80% at 80% 20%, #ffd66b 0%, #ff3b2f 45%, #0b0a0d 100%)",
  },
  {
    id: "smm",
    title: "Social ohne Gähnen",
    description: "Wir führen Kanäle wie ein Medium: Formate, Figuren, Community und täglich neue Anlässe zum Reden.",
    tags: ["Instagram", "TikTok", "LinkedIn"],
    background: "conic-gradient(from 210deg at 60% 40%, #3f3cbb, #ff2e88, #ffd66b, #3f3cbb)",
  },
  {
    id: "brand",
    title: "Branding",
    description: "Name, Identity und eine Bildsprache, die man ablecken möchte. Oder zumindest speichern.",
    tags: ["Naming", "Identity", "Guidelines"],
    background: "linear-gradient(160deg, #f6efe7 0%, #ff2e88 60%, #0b0a0d 100%)",
  },
  {
    id: "perf",
    title: "Performance",
    description: "Creatives, die nicht nach einer Woche ausbrennen, und Media Buying, das jeden Euro zählt.",
    tags: ["Paid Social", "Analytics", "A/B"],
    background: "radial-gradient(100% 100% at 50% 100%, #ff3b2f 0%, #3f3cbb 50%, #0b0a0d 100%)",
  },
  {
    id: "influence",
    title: "Influence",
    description: "Seedings und Kollabs mit Creatorn, deren Publikum glaubt statt scrollt.",
    tags: ["Creator", "Kollabs", "PR"],
    background: "radial-gradient(90% 90% at 30% 70%, #ffd66b 0%, #ff2e88 50%, #3f3cbb 100%)",
  },
];

export function Services() {
  return (
    <section id="services" className="mx-auto max-w-[1600px] scroll-mt-24 px-4 py-24 md:px-8">
      <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.25em] text-pink">/ 02 — was wir tun</p>
          <h2 className="font-display text-[12vw] uppercase leading-[0.9] md:text-[6vw]">
            Sechs Wege, dein <br />
            <span className="serif-i normal-case text-butter">Publikum</span> zu verführen
          </h2>
        </div>
        <p className="max-w-xs text-bone/60">Fahr mit der Maus drüber — die Karte öffnet sich. Wie ein guter Kunde beim zweiten Date.</p>
      </div>
      <HoverExpand items={items} />
    </section>
  );
}
