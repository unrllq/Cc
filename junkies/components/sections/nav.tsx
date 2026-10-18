import { ThreeDButton } from "@/components/ui/three-d-button";

const LINKS = [
  ["Leistungen", "#leistungen"],
  ["Ablauf", "#ablauf"],
  ["Arbeiten", "#arbeiten"],
  ["Studio", "#studio"],
] as const;

export function Logo({ className = "" }: { className?: string }) {
  return (
    <a href="#top" className={`flex items-center gap-2.5 ${className}`} aria-label="Junkies – zur Startseite">
      <span className="keycap cap-amber size-9 text-base after:!bottom-[6px]">J</span>
      <span className="text-lg font-bold tracking-tight">junkies</span>
    </a>
  );
}

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-full bg-neo-bg/85 py-2.5 pr-2.5 pl-4 shadow-neo-sm backdrop-blur-md">
        <Logo />
        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map(([label, href]) => (
            <li key={href}>
              <a
                href={href}
                className="rounded-full px-4 py-2 text-sm font-medium text-neo-text transition-shadow hover:shadow-neo-inner-sm"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
        <ThreeDButton href="#kontakt" size="sm" className="rounded-full px-4">
          Projekt anfragen
        </ThreeDButton>
      </nav>
    </header>
  );
}
