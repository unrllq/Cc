import { CONTACT } from "@/lib/site";

const WORD = ["J", "U", "N", "K", "I", "E", "S"];
const CAPS = ["cap-rose", "cap-plain", "cap-blue", "cap-plain", "cap-green", "cap-plain", "cap-amber"];

export function Footer() {
  return (
    <footer className="px-4 pt-16 pb-10">
      <div className="mx-auto max-w-6xl rounded-[2.75rem] bg-neo-bg p-6 shadow-neo sm:p-10">
        <div className="flex justify-center rounded-[2rem] p-4 shadow-neo-inner sm:p-8" aria-label="Junkies">
          <div className="grid w-full max-w-4xl grid-cols-7 gap-2 sm:gap-4">
            {WORD.map((l, i) => (
              <span key={i} aria-hidden className={`keycap is-pressable ${CAPS[i]} aspect-square w-full text-[clamp(1.2rem,6vw,4.5rem)] after:!bottom-[8%]`}>
                {l}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-8 text-sm text-neo-text md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-semibold text-ink">Junkies — Softwareentwicklung aus Hamburg</p>
            <p className="mt-1 text-muted">{CONTACT.street} · {CONTACT.city} · <a className="underline-offset-4 hover:underline" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></p>
          </div>
          <nav aria-label="Rechtliches" className="flex flex-wrap gap-3">
            {["Impressum", "Datenschutz", "Karriere"].map((l) => (
              <a key={l} href="#" className="rounded-full px-4 py-2 shadow-neo-sm transition-shadow hover:shadow-neo-inner-sm">{l}</a>
            ))}
          </nav>
        </div>
        <p className="mt-8 font-mono text-[11px] tracking-[0.16em] text-muted uppercase">© {new Date().getFullYear()} Junkies · Made in HH</p>
      </div>
    </footer>
  );
}
