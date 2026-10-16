"use client";

import { motion } from "motion/react";
import { ArrowDownRight } from "lucide-react";
import { ShaderBackground } from "@/components/ui/grain-gradient";
import { TextScramble } from "@/components/ui/text-scramble";

const ease = [0.16, 1, 0.3, 1] as const;

function SpinSticker() {
  const text = "UNCENSORED IDEAS ✶ NO BORING BRIEFS ✶ ";
  return (
    <div className="relative grid h-32 w-32 place-items-center md:h-40 md:w-40">
      <svg viewBox="0 0 200 200" className="spin-slow absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <path id="circle" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
        </defs>
        <circle cx="100" cy="100" r="99" className="fill-butter" />
        <text className="fill-ink font-mono text-[15px] font-medium uppercase tracking-[0.18em]">
          <textPath href="#circle">{text}</textPath>
        </text>
      </svg>
      <span className="relative font-display text-3xl text-ink md:text-4xl">18+</span>
    </div>
  );
}

export function Hero() {
  return (
    <section id="top" className="relative flex min-h-[100svh] flex-col overflow-hidden">
      <div className="absolute inset-0">
        <ShaderBackground className="h-full w-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(11_10_13/0.15),rgb(11_10_13/0)_40%,rgb(11_10_13/0.9))]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-1 flex-col justify-end px-4 pb-8 pt-28 md:px-8 md:pb-10">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease }}
          className="mb-6 font-mono text-[11px] uppercase tracking-[0.25em] text-bone/80 md:text-xs"
        >
          [ Marketingstudio ] <span className="text-butter">✶</span> Berlin / Hamburg / online{" "}
          <span className="blink text-pink">●</span> nur 3 Projekte pro Quartal
        </motion.p>

        <h1 className="relative select-none font-display uppercase leading-[0.82] tracking-[-0.03em] text-bone">
          <motion.span
            initial={{ y: "105%" }}
            animate={{ y: 0 }}
            transition={{ duration: 1.1, ease }}
            className="block text-[16.4vw] md:text-[16.6vw]"
          >
            Slut
          </motion.span>
          <span className="flex items-end justify-between gap-4">
            <motion.span
              initial={{ y: "105%" }}
              animate={{ y: 0 }}
              transition={{ duration: 1.1, ease, delay: 0.08 }}
              className="block text-[16.4vw] md:text-[16.6vw]"
            >
              Storys
            </motion.span>
          </span>
          <motion.span
            initial={{ opacity: 0, rotate: -14, scale: 0.6 }}
            animate={{ opacity: 1, rotate: -8, scale: 1 }}
            transition={{ duration: 0.9, ease, delay: 0.5 }}
            className="serif-i absolute right-[2%] top-[34%] text-[8vw] normal-case leading-none text-butter md:right-[6%] md:text-[5.5vw]"
          >
            Geschichten ohne Zensur
          </motion.span>
        </h1>

        <div className="mt-8 grid items-end gap-8 md:mt-10 md:grid-cols-[1.4fr_1fr_auto]">
          <TextScramble
            as="p"
            duration={1.4}
            speed={0.03}
            className="max-w-xl font-display text-2xl uppercase leading-[1.05] text-bone md:text-[2.1rem]"
          >
            Wir machen Marken, über die man tratscht
          </TextScramble>
          <div className="flex flex-col gap-5">
            <p className="max-w-sm text-[15px] leading-relaxed text-bone/80">
              Storytelling, Content und Performance für Mutige. Wir verkaufen keine Reichweite — wir verkaufen
              Gespräche, die zu Umsatz werden.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-full bg-bone px-5 py-3 text-sm font-semibold text-ink transition hover:bg-pink"
              >
                Erzähl uns deine Story <ArrowDownRight className="h-4 w-4" />
              </a>
              <a
                href="#cases"
                className="inline-flex items-center rounded-full border border-bone/30 px-5 py-3 text-sm font-medium text-bone backdrop-blur transition hover:border-bone"
              >
                Cases ansehen
              </a>
            </div>
          </div>
          <div className="hidden md:block">
            <SpinSticker />
          </div>
        </div>
      </div>
    </section>
  );
}
