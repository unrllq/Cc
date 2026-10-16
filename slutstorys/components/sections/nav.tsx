import { ArrowUpRight } from "lucide-react";

const links = [
  ["Leistungen", "#services"],
  ["Cases", "#cases"],
  ["Prozess", "#process"],
  ["Stimmen", "#voices"],
];

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-8">
      <nav className="flex items-center justify-between gap-4">
        <a href="#top" className="font-display text-lg tracking-tight text-bone mix-blend-difference md:text-xl">
          SLUTSTORYS<span className="text-pink">*</span>
        </a>
        <div className="hidden items-center gap-1 rounded-full border border-bone/10 bg-ink/40 p-1 backdrop-blur-xl md:flex">
          {links.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="rounded-full px-4 py-2 text-sm text-bone/75 transition hover:bg-bone/10 hover:text-bone"
            >
              {label}
            </a>
          ))}
        </div>
        <a
          href="#contact"
          className="group inline-flex items-center gap-2 rounded-full bg-pink px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-butter"
        >
          Projekt anfragen
          <ArrowUpRight className="h-4 w-4 transition group-hover:rotate-45" />
        </a>
      </nav>
    </header>
  );
}
