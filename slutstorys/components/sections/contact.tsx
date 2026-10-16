import { ArrowUpRight } from "lucide-react";
import { ShaderBackground } from "@/components/ui/grain-gradient";

export function Contact() {
  return (
    <section id="contact" className="relative mx-4 my-16 scroll-mt-24 overflow-hidden rounded-[40px] md:mx-8">
      <div className="absolute inset-0">
        <ShaderBackground colors={["#0b0a0d", "#ff3b2f", "#ff2e88", "#ffd66b"]} speed={0.8} />
        <div className="absolute inset-0 bg-ink/25" />
      </div>
      <div className="relative z-10 flex min-h-[80svh] flex-col justify-between gap-12 p-6 md:p-12">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-bone">/ 06 — du bist dran</p>
        <div>
          <h2 className="font-display text-[15vw] uppercase leading-[0.85] tracking-[-0.03em] md:text-[10vw]">
            Erzähl
            <br />
            uns <span className="serif-i normal-case">alles</span>
          </h2>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="mailto:hello@slutstorys.studio"
              className="group inline-flex items-center gap-3 rounded-full bg-ink px-7 py-4 text-base font-semibold text-bone transition hover:bg-bone hover:text-ink md:text-lg"
            >
              hello@slutstorys.studio
              <ArrowUpRight className="h-5 w-5 transition group-hover:rotate-45" />
            </a>
            <a
              href="https://instagram.com/"
              className="inline-flex items-center rounded-full border border-bone/60 px-7 py-4 text-base font-medium text-bone backdrop-blur transition hover:bg-bone/10 md:text-lg"
            >
              Instagram
            </a>
          </div>
        </div>
        <p className="max-w-md text-bone/85">
          Wir antworten innerhalb eines Tages. Das erste Treffen ist kostenlos — sofern du nichts gegen unbequeme Fragen hast.
        </p>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="mx-auto max-w-[1600px] overflow-hidden px-4 pb-8 pt-10 md:px-8">
      <div className="grid gap-8 border-t border-bone/10 pt-10 text-sm text-bone/60 md:grid-cols-4">
        <p className="text-bone">SLUTSTORYS* — Marketingstudio für freches Storytelling.</p>
        <ul className="space-y-2">
          <li><a className="hover:text-bone" href="#services">Leistungen</a></li>
          <li><a className="hover:text-bone" href="#cases">Cases</a></li>
          <li><a className="hover:text-bone" href="#process">Prozess</a></li>
        </ul>
        <ul className="space-y-2">
          <li><a className="hover:text-bone" href="https://instagram.com/">Instagram</a></li>
          <li><a className="hover:text-bone" href="https://tiktok.com/">TikTok</a></li>
          <li><a className="hover:text-bone" href="https://behance.net/">Behance</a></li>
        </ul>
        <p className="font-mono text-xs uppercase tracking-wider">© 2026 · *Geschichten. Nicht das, was du denkst.</p>
      </div>
      <p aria-hidden className="stroke-text mt-10 select-none whitespace-nowrap text-center font-display text-[12.6vw] uppercase leading-none opacity-40">
        Slutstorys
      </p>
    </footer>
  );
}
