import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const NAV = [
  { href: "/program", label: "Program" },
  { href: "/creators", label: "Creators" },
  { href: "/studio", label: "Studio" },
  { href: "/community", label: "Community" },
  { href: "/about", label: "About" },
  { href: "/apply", label: "Apply" },
  { href: "/contact", label: "Contact" },
];

const CREATOR = [
  { href: "/apply", label: "Join Syntezis" },
  { href: "/workspace", label: "Creator Login" },
  { href: "/workspace?tab=projects", label: "Submit Project" },
];

const INDUSTRY = [
  { href: "/creators", label: "Work With Creators" },
  { href: "/brands", label: "Brand Brief" },
  { href: "/about", label: "Partnerships" },
];

const LEGAL = [
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/impressum", label: "Impressum" },
];

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="label-mono mb-5 text-ink/40">{title}</p>
      <ul className="flex flex-col gap-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-off-white/80 transition-colors hover:text-lime">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-ink text-off-white">
      <div className="mx-auto max-w-[1440px] px-5 pb-10 pt-16 md:px-10 md:pt-24">
        <div className="grid gap-12 border-b border-off-white/12 pb-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <span className="text-3xl font-bold tracking-tight">SYNTEZIS</span>
            <p className="mt-5 max-w-xs text-lg leading-snug text-off-white/60">
              European incubator for digital influencers &amp; synthetic media.
            </p>
            <Link
              href="/apply"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3 text-[13px] font-semibold text-ink transition-transform hover:scale-[1.02]"
            >
              Build with Syntezis <ArrowUpRight size={15} />
            </Link>
          </div>
          <FooterCol title="Navigate" links={NAV} />
          <FooterCol title="Creator" links={CREATOR} />
          <FooterCol title="Industry" links={INDUSTRY} />
        </div>

        <div className="flex flex-col gap-6 pt-8 md:flex-row md:items-center md:justify-between">
          <div className="label-mono flex flex-wrap gap-x-6 gap-y-2 text-off-white/40">
            <span>© 2026 SYNTEZIS INCUBATOR</span>
            <span>BERLIN / EUROPE</span>
            <span>52.5200° N, 13.4050° E</span>
          </div>
          <div className="flex gap-6">
            {LEGAL.map((l) => (
              <Link key={l.href} href={l.href} className="label-mono text-off-white/40 hover:text-off-white">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
