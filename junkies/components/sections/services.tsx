import { AppWindow, Bot, Cloud, PenTool, ShoppingBag, Smartphone, type LucideIcon } from "lucide-react";

import type { Cap } from "@/lib/site";
import { SectionHead } from "./section-head";

const SERVICES: { cap: Cap; icon: LucideIcon; title: string; text: string; tags: string[] }[] = [
  { cap: "rose", icon: AppWindow, title: "Web-Apps", text: "Portale, SaaS und interne Tools — schnell, barrierearm und für Jahre wartbar.", tags: ["Next.js", "React", "Node"] },
  { cap: "blue", icon: Smartphone, title: "Mobile Apps", text: "iOS und Android aus einer Codebasis oder nativ, wenn es darauf ankommt.", tags: ["React Native", "Swift", "Kotlin"] },
  { cap: "green", icon: ShoppingBag, title: "E-Commerce", text: "Shops und Headless-Commerce, die bei Kampagnen-Peaks nicht einknicken.", tags: ["Shopify", "Headless", "PIM"] },
  { cap: "amber", icon: PenTool, title: "UX / UI Design", text: "Research, Prototypen und Designsysteme, die Entwickler gerne umsetzen.", tags: ["Figma", "Tokens", "Tests"] },
  { cap: "blue", icon: Cloud, title: "Cloud & DevOps", text: "Infrastruktur als Code, CI/CD und Hosting in deutschen Rechenzentren.", tags: ["AWS", "Kubernetes", "Terraform"] },
  { cap: "rose", icon: Bot, title: "KI-Integration", text: "Assistenten, Suche und Automatisierung — produktiv, messbar, DSGVO-konform.", tags: ["LLMs", "RAG", "Agents"] },
];

export function Services() {
  return (
    <section id="leistungen" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          cap="rose"
          index="F1"
          kicker="Leistungen"
          title="Ein Team für alles zwischen erster Skizze und Produktion."
          lead="Sechs Disziplinen unter einem Dach in Hamburg. Kein Weiterreichen an Subunternehmer, keine Blackbox."
        />
        <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(({ cap, icon: Icon, title, text, tags }) => (
            <article key={title} className="keycap-press group flex flex-col gap-6 rounded-3xl bg-neo-bg p-7 shadow-neo transition-shadow hover:shadow-neo-sm">
              <div className="flex items-start justify-between">
                <span className={`keycap cap-${cap} size-16`}>
                  <Icon className="size-6" strokeWidth={2.2} />
                </span>
                <span className="rounded-full px-3 py-1 font-mono text-[10px] font-bold tracking-widest text-muted uppercase shadow-neo-inner-sm">
                  {cap === "rose" ? "Build" : cap === "blue" ? "Scale" : cap === "green" ? "Sell" : "Shape"}
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
                <p className="mt-2 text-muted">{text}</p>
              </div>
              <ul className="mt-auto flex flex-wrap gap-2">
                {tags.map((t) => (
                  <li key={t} className="rounded-full px-3 py-1.5 font-mono text-[11px] font-bold text-neo-text shadow-neo-inner-sm">
                    {t}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
