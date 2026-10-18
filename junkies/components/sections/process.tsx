"use client";

import { useState } from "react";

import type { Cap } from "@/lib/site";
import { SectionHead } from "./section-head";

const STEPS: { cap: Cap; key: string; title: string; time: string; points: string[] }[] = [
  { cap: "rose", key: "IDEE", title: "Discovery", time: "1–2 Wochen", points: ["Workshop vor Ort in Hamburg oder remote", "Ziele, Nutzer, Risiken auf einer Seite", "Festpreis-Angebot für die erste Phase"] },
  { cap: "blue", key: "DESIGN", title: "Prototyp", time: "2–3 Wochen", points: ["Klickbarer Prototyp statt Folien", "Usability-Tests mit 5–8 Nutzern", "Designsystem als Grundlage für den Code"] },
  { cap: "green", key: "CODE", title: "Sprints", time: "ab 6 Wochen", points: ["Zwei-Wochen-Sprints mit festem Team", "Freitags Live-Demo auf Staging", "Code-Reviews, Tests, CI/CD ab Tag 1"] },
  { cap: "amber", key: "LAUNCH", title: "Go-live & Betrieb", time: "laufend", points: ["Launch-Plan mit Rollback", "Monitoring, Alerts, Updates", "Wartung als SLA — Reaktion < 4 h"] },
];

export function Process() {
  const [active, setActive] = useState(2);
  const step = STEPS[active];

  return (
    <section id="ablauf" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          cap="blue"
          index="F2"
          kicker="Ablauf"
          title="Vier Tasten. Kein Projekt-Roulette."
          lead="Jede Phase endet mit etwas, das Sie anfassen können — und mit der Freiheit, danach aufzuhören."
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          {/* key row on a neo plate */}
          <div className="rounded-[2.5rem] bg-neo-bg p-5 shadow-neo sm:p-8">
            <div role="tablist" aria-label="Projektphasen" className="grid grid-cols-2 gap-4 rounded-[1.8rem] p-4 shadow-neo-inner sm:grid-cols-4 sm:gap-5 sm:p-6">
              {STEPS.map((s, i) => (
                <button
                  key={s.key}
                  role="tab"
                  aria-selected={i === active}
                  onClick={() => setActive(i)}
                  className={`keycap is-pressable cap-${s.cap} aspect-square w-full flex-col gap-1 text-[11px] sm:text-xs ${i === active ? "is-on" : ""}`}
                >
                  <span className="text-[10px] opacity-50">0{i + 1}</span>
                  {s.key}
                </button>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between px-2 font-mono text-[11px] font-bold tracking-[0.18em] text-muted uppercase">
              <span>Phase 0{active + 1} / 04</span>
              <span className="flex gap-1.5">
                {STEPS.map((s, i) => (
                  <span key={s.key} className="led" style={{ "--led": i <= active ? undefined : "#c3cbd6", boxShadow: i <= active ? undefined : "none" } as React.CSSProperties} />
                ))}
              </span>
            </div>
          </div>

          {/* detail */}
          <div role="tabpanel" className={`cap-${step.cap} flex flex-col rounded-[2.5rem] bg-neo-bg p-8 shadow-neo sm:p-10`}>
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-3xl font-bold tracking-tight sm:text-4xl">{step.title}</h3>
              <span className="rounded-full px-3.5 py-1.5 font-mono text-[11px] font-bold whitespace-nowrap text-neo-text shadow-neo-inner-sm">{step.time}</span>
            </div>
            <ul className="mt-8 flex flex-col gap-4">
              {step.points.map((p) => (
                <li key={p} className="flex items-start gap-4 rounded-2xl p-4 shadow-neo-inner-sm">
                  <span className="led mt-1.5 shrink-0" />
                  <span className="text-neo-text">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
