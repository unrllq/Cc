const steps = [
  ["Verhör", "Wir holen aus deiner Marke alles raus, was du dich nicht zu sagen getraut hast. Genau da liegt meist die Story."],
  ["Plot", "Wir schreiben Handlungsbogen, Figuren und Konflikt. Und legen den Kampagnenplan für 90 Tage fest."],
  ["Action", "Drehen, schneiden, posten. Die ersten Clips gehen 10 Tage nach Start live."],
  ["Vollgas", "Was zündet, wird skaliert, was nicht, gnadenlos gekillt. Report jede Woche."],
];

export function Process() {
  return (
    <section id="process" className="mx-auto max-w-[1600px] scroll-mt-24 px-4 py-24 md:px-8 md:py-32">
      <p className="mb-6 font-mono text-xs uppercase tracking-[0.25em] text-pink">/ 04 — so läuft es ab</p>
      <h2 className="mb-14 font-display text-[12vw] uppercase leading-[0.9] md:text-[6vw]">
        Ein Drama in <span className="serif-i normal-case text-butter">vier Akten</span>
      </h2>
      <ol className="grid gap-px overflow-hidden rounded-[32px] border border-bone/10 bg-bone/10 md:grid-cols-4">
        {steps.map(([t, d], i) => (
          <li key={t} className="group relative flex min-h-[320px] flex-col justify-between bg-ink p-7 transition-colors duration-500 hover:bg-pink hover:text-ink">
            <span className="font-mono text-xs text-bone/50 group-hover:text-ink/60">AKT {["I", "II", "III", "IV"][i]}</span>
            <div>
              <h3 className="font-display text-4xl uppercase">{t}</h3>
              <p className="mt-4 text-[15px] leading-relaxed text-bone/65 group-hover:text-ink/80">{d}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
