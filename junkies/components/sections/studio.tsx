import { MapPin } from "lucide-react";

import { CONTACT } from "@/lib/site";
import { SectionHead } from "./section-head";

const FACTS = [
  ["24", "Entwickler:innen & Designer:innen"],
  ["DE / EN", "Projektsprachen"],
  ["100 %", "Inhouse, kein Offshoring"],
  ["2016", "gegründet in Hamburg"],
];

export function Studio() {
  return (
    <section id="studio" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          cap="amber"
          index="F4"
          kicker="Studio"
          title={<>Moin. Wir sitzen in Hamburg — und sind abhängig von guten Produkten.</>}
        />
        <div className="mt-14 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-[2.5rem] bg-neo-bg p-8 shadow-neo sm:p-10">
            <p className="text-xl leading-relaxed text-neo-text text-pretty sm:text-2xl">
              Der Name ist ein Geständnis: Wir sind Junkies für sauberen Code, kurze Feedback-Schleifen und
              Software, die Menschen wirklich benutzen. Ein festes Team pro Projekt, direkte Wege, keine
              Account-Manager-Kette — Sie sprechen mit den Leuten, die committen.
            </p>
            <dl className="mt-10 grid grid-cols-2 gap-5">
              {FACTS.map(([v, l]) => (
                <div key={l} className="rounded-2xl p-5 shadow-neo-inner-sm">
                  <dt className="sr-only">{l}</dt>
                  <dd className="text-3xl font-bold tracking-tight">{v}</dd>
                  <dd className="mt-1 text-sm text-muted">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex flex-col gap-8">
            {/* "HH" keycap badge */}
            <div className="flex flex-1 flex-col items-center justify-center gap-6 rounded-[2.5rem] bg-neo-bg p-10 shadow-neo">
              <div className="flex gap-4">
                <span className="keycap cap-blue size-24 text-4xl">H</span>
                <span className="keycap cap-blue is-on size-24 text-4xl">H</span>
              </div>
              <p className="font-mono text-xs font-bold tracking-[0.2em] text-muted uppercase">53.55° N · 9.99° O</p>
            </div>
            <address className="flex items-start gap-4 rounded-[2rem] bg-neo-bg p-7 not-italic shadow-neo">
              <span className="grid size-12 shrink-0 place-items-center rounded-full shadow-neo-inner-sm"><MapPin className="size-5" /></span>
              <span className="text-neo-text">
                <strong className="block text-ink">Junkies Studio</strong>
                {CONTACT.street}, {CONTACT.city}
                <span className="block text-sm text-muted">Termine vor Ort nach Absprache</span>
              </span>
            </address>
          </div>
        </div>
      </div>
    </section>
  );
}
