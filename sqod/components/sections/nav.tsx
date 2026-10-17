const LINKS = [
  { href: "#projekte", label: "Projekte" },
  { href: "#ablauf", label: "Ablauf" },
  { href: "#leistungen", label: "Leistungen" },
  { href: "#kontakt", label: "Kontakt" },
];

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-5 py-4 sm:px-8">
        <a href="#top" className="flex items-center gap-2.5" aria-label="SQOD – zur Startseite">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="16" height="16" rx="3.5" fill="none" stroke="currentColor" strokeWidth="2.6" />
            <path d="M13.5 13.5 21 21" stroke="var(--color-accent)" strokeWidth="2.8" strokeLinecap="round" />
          </svg>
          <span className="text-lg font-extrabold tracking-[0.18em]">SQOD</span>
        </a>
        <nav
          aria-label="Hauptnavigation"
          className="hidden items-center gap-1 rounded-full border border-border bg-background/60 p-1 backdrop-blur-md md:flex"
        >
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-foreground/75 transition hover:bg-foreground/10 hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <a
          href="#kontakt"
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-accent hover:text-foreground"
        >
          Projekt anfragen
        </a>
      </div>
    </header>
  );
}
