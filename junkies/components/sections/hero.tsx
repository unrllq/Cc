"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

import { R3FMacroKeypad, type MacroKey } from "@/components/ui/r3-f-macro-keypad";
import { ThreeDButton } from "@/components/ui/three-d-button";

// Hero keypad = the agency process. Each key prints its step on the LCD.
const KEYS: readonly MacroKey[] = [
  { id: "idee", label: "Idee", legend: "IDEE", keycapColor: "#fecdd3", accentColor: "#fb7185" },
  { id: "design", label: "Design", legend: "DESIGN", keycapColor: "#bfdbfe", accentColor: "#60a5fa" },
  { id: "code", label: "Code", legend: "CODE", keycapColor: "#bbf7d0", accentColor: "#4ade80" },
  { id: "launch", label: "Launch", legend: "LAUNCH", keycapColor: "#fde68a", accentColor: "#fbbf24" },
];

const SCREEN: Record<string, { led: string; step: string; line: string }> = {
  idee: {
    led: "#fb7185",
    step: "01 / IDEE",
    line: "Discovery-Workshop, Scope & Festpreis — in 10 Werktagen.",
  },
  design: {
    led: "#60a5fa",
    step: "02 / DESIGN",
    line: "Klickbarer Prototyp in Figma, getestet mit echten Nutzern.",
  },
  code: {
    led: "#4ade80",
    step: "03 / CODE",
    line: "Zweiwöchige Sprints, jeden Freitag eine Live-Demo.",
  },
  launch: {
    led: "#fbbf24",
    step: "04 / LAUNCH",
    line: "Go-live, Monitoring und Wartung — wir bleiben dran.",
  },
};

export function Hero() {
  const [active, setActive] = useState("code");
  const screen = SCREEN[active];

  return (
    <section id="top" className="relative overflow-hidden px-4 pt-32 pb-20 sm:pt-36">
      <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
        <span className="inline-flex items-center gap-2.5 rounded-full px-4 py-2 font-mono text-[11px] font-bold tracking-[0.18em] text-neo-text uppercase shadow-neo-inner-sm">
          <span className="led" style={{ "--led": "#4ade80" } as React.CSSProperties} />
          Entwickleragentur · Hamburg
        </span>

        <h1 className="mt-7 max-w-4xl text-[clamp(2.6rem,7.4vw,6.2rem)] leading-[0.95] font-bold tracking-[-0.04em] text-balance">
          Süchtig nach <span className="relative whitespace-nowrap text-neo-text/90">
            sauberem Code
            <span aria-hidden className="absolute -bottom-1 left-0 h-[0.12em] w-full rounded-full bg-led-green/70 shadow-[0_0_18px_#4ade80]" />
          </span>.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted text-pretty">
          Junkies baut Web-Apps, Mobile Apps und Shops für Start-ups und Mittelstand —
          aus Hamburg, mit festen Sprints und Code, den Ihr Team versteht.
        </p>

        {/* keypad plate */}
        <div className="mt-12 w-full max-w-3xl rounded-[2.75rem] bg-neo-bg p-3 shadow-neo-lg sm:p-5">
          <R3FMacroKeypad
            keys={KEYS}
            activeId={active}
            onKeyPress={setActive}
            housingTint="#dfe7ee"
            className="h-56 w-full sm:h-80"
          />
          <div
            className="lcd mx-auto mt-2 flex min-h-20 w-full items-center gap-4 rounded-[1.6rem] px-5 py-4 text-left font-mono shadow-neo-inner sm:px-7"
            aria-live="polite"
          >
            <span className="led shrink-0" style={{ "--led": screen.led } as React.CSSProperties} />
            <div className="min-w-0">
              <div className="text-[11px] font-bold tracking-[0.2em] text-muted">{screen.step}</div>
              <div className="mt-1 text-sm font-medium text-ink sm:text-base">
                {screen.line}
                <span className="caret ml-0.5 inline-block h-[1.05em] w-[0.55em] translate-y-[0.15em] bg-ink/80" />
              </div>
            </div>
          </div>
        </div>
        <p className="mt-4 font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
          Taste drücken · ziehen zum Drehen
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <ThreeDButton href="#kontakt" size="lg">
            Projekt starten <ArrowRight className="size-4" />
          </ThreeDButton>
          <ThreeDButton href="#arbeiten" size="lg" variant="soft">
            Arbeiten ansehen
          </ThreeDButton>
        </div>
      </div>
    </section>
  );
}
