"use client";

import { useState } from "react";
import { CornerDownLeft, Mail, Phone } from "lucide-react";

import { ThreeDButton } from "@/components/ui/three-d-button";
import { CONTACT, type Cap } from "@/lib/site";
import { SectionHead } from "./section-head";

const BUDGETS: { cap: Cap; label: string }[] = [
  { cap: "rose", label: "< 25 k" },
  { cap: "blue", label: "25–75 k" },
  { cap: "green", label: "75–150 k" },
  { cap: "amber", label: "150 k +" },
];

const field =
  "w-full rounded-2xl bg-neo-bg px-5 py-4 text-ink shadow-neo-inner outline-none placeholder:text-muted/70 focus-visible:ring-2 focus-visible:ring-led-blue";

export function Contact() {
  const [budget, setBudget] = useState<string | null>(null);

  // Static site: the form opens the visitor's mail client with everything filled in.
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const body = [
      `Name: ${data.get("name")}`,
      `Firma: ${data.get("company") || "–"}`,
      `Budget: ${budget ?? "–"}`,
      "",
      String(data.get("message") ?? ""),
    ].join("\n");
    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(
      "Projektanfrage über junkies.dev"
    )}&body=${encodeURIComponent(body)}`;
  }

  return (
    <section id="kontakt" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          cap="rose"
          index="⏎"
          kicker="Kontakt"
          title="Drücken Sie die Taste. Wir melden uns in 24 Stunden."
        />
        <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_1.5fr]">
          <div className="flex flex-col gap-6">
            <a href={`mailto:${CONTACT.email}`} className="group flex items-center gap-5 rounded-[2rem] bg-neo-bg p-6 shadow-neo transition-shadow hover:shadow-neo-sm">
              <span className="keycap cap-amber size-14"><Mail className="size-5" /></span>
              <span>
                <span className="block font-mono text-[11px] font-bold tracking-[0.18em] text-muted uppercase">E-Mail</span>
                <span className="text-lg font-semibold">{CONTACT.email}</span>
              </span>
            </a>
            <a href={`tel:${CONTACT.phoneHref}`} className="group flex items-center gap-5 rounded-[2rem] bg-neo-bg p-6 shadow-neo transition-shadow hover:shadow-neo-sm">
              <span className="keycap cap-green size-14"><Phone className="size-5" /></span>
              <span>
                <span className="block font-mono text-[11px] font-bold tracking-[0.18em] text-muted uppercase">Telefon</span>
                <span className="text-lg font-semibold">{CONTACT.phone}</span>
              </span>
            </a>
            <div className="rounded-[2rem] p-6 shadow-neo-inner">
              <p className="text-neo-text">
                <strong className="text-ink">Erstgespräch kostenlos.</strong> 30 Minuten, ehrliche Einschätzung,
                auch wenn wir am Ende nicht die Richtigen sind.
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-5 rounded-[2.5rem] bg-neo-bg p-6 shadow-neo sm:p-9">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-neo-text">
                Name
                <input name="name" required autoComplete="name" placeholder="Ihr Name" className={field} />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-neo-text">
                Firma
                <input name="company" autoComplete="organization" placeholder="optional" className={field} />
              </label>
            </div>

            <fieldset>
              <legend className="mb-3 text-sm font-medium text-neo-text">Budget (EUR)</legend>
              <div className="grid grid-cols-2 gap-4 rounded-2xl p-4 shadow-neo-inner sm:grid-cols-4">
                {BUDGETS.map((b) => (
                  <button
                    key={b.label}
                    type="button"
                    aria-pressed={budget === b.label}
                    onClick={() => setBudget(budget === b.label ? null : b.label)}
                    className={`keycap is-pressable cap-${b.cap} h-14 pb-1 text-xs normal-case ${budget === b.label ? "is-on" : ""}`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="flex flex-col gap-2 text-sm font-medium text-neo-text">
              Worum geht es?
              <textarea name="message" required rows={5} placeholder="Kurz das Projekt, Zeitrahmen, Links …" className={`${field} resize-y`} />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <p className="text-xs text-muted">Öffnet Ihr E-Mail-Programm. Keine Daten werden gespeichert.</p>
              <ThreeDButton type="submit" size="lg">
                Anfrage senden <CornerDownLeft className="size-4" />
              </ThreeDButton>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
