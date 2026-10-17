export function Contact() {
  return (
    <section id="kontakt" className="relative z-[3] overflow-hidden border-t border-border bg-background py-24 sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 size-[640px] rounded-full bg-accent/20 blur-[140px]"
      />
      <div className="relative mx-auto grid max-w-[1180px] gap-14 px-5 sm:px-8 lg:grid-cols-[1.3fr_1fr] lg:items-end">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent">Kontakt</p>
          <h2 className="mt-5 text-balance text-[clamp(2.6rem,6.4vw,5.8rem)] font-extrabold leading-[0.9] tracking-[-0.04em]">
            Lassen Sie Ihre Systeme
            <span className="font-light italic text-foreground/60"> miteinander reden.</span>
          </h2>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
            30 Minuten, unverbindlich: Sie erzählen uns, wo es hakt – wir sagen Ihnen ehrlich, was
            eine Integration bringt und was sie kostet.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <a
            href="mailto:hallo@sqod.de?subject=Projektanfrage"
            className="group flex items-center justify-between rounded-2xl bg-accent px-6 py-5 text-background transition hover:bg-foreground"
          >
            <span>
              <span className="block font-mono text-[10px] uppercase tracking-[0.2em] opacity-70">E-Mail</span>
              <span className="text-xl font-semibold">hallo@sqod.de</span>
            </span>
            <span className="text-2xl transition group-hover:translate-x-1">→</span>
          </a>
          <a
            href="tel:+4930000000000"
            className="group flex items-center justify-between rounded-2xl border border-border px-6 py-5 transition hover:border-foreground/50"
          >
            <span>
              <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Telefon</span>
              <span className="text-xl font-semibold">+49 30 000 000 00</span>
            </span>
            <span className="text-2xl transition group-hover:translate-x-1">→</span>
          </a>
          <p className="px-1 pt-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
            Mo–Fr · 9–18 Uhr · Antwort innerhalb von 24 h
          </p>
        </div>
      </div>
    </section>
  );
}
