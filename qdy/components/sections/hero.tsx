"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { GradientWindow } from "@/components/ui/gradient-window";

const WORDS = ["громкими", "вирусными", "узнаваемыми", "дорогими", "неизбежными"];
const EASE = [0.22, 1, 0.36, 1] as const;

function RotatingWord() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % WORDS.length), 2200);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="relative inline-flex h-[1.15em] overflow-hidden align-bottom">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={WORDS[i]}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="shimmer-text inline-block"
        >
          {WORDS[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 1800);
      setV(Math.round(to * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    const t = setTimeout(() => (raf = requestAnimationFrame(tick)), 900);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  }, [to]);
  return (
    <>
      {v}
      {suffix}
    </>
  );
}

export function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 800], [0, 220]);
  const scale = useTransform(scrollY, [0, 800], [1, 0.86]);
  const opacity = useTransform(scrollY, [0, 600], [1, 0]);

  return (
    <section id="top" className="relative flex min-h-[100svh] items-center overflow-hidden px-4 pb-24 pt-32 sm:px-8">
      <motion.div style={{ y, scale, opacity }} className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="glass mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] sm:text-[11px] sm:tracking-[0.2em] text-white/80"
          >
            <span className="pulse-dot h-2 w-2 rounded-full bg-lime" />
            Digital marketing studio · est. 2019
          </motion.div>

          <h1 className="whitespace-nowrap font-display text-[clamp(5rem,17vw,13rem)] font-black leading-[0.8] tracking-[-0.06em]">
            {"QDY".split("").map((ch, i) => (
              <motion.span
                key={ch}
                initial={{ y: "110%", rotate: 8, opacity: 0 }}
                animate={{ y: "0%", rotate: 0, opacity: 1 }}
                transition={{ duration: 1.1, delay: 0.15 + i * 0.12, ease: EASE }}
                className={
                  "inline-block " + (i === 1 ? "text-lime drop-shadow-[0_0_40px_rgba(200,255,61,0.45)]" : "text-bone")
                }
              >
                {ch}
              </motion.span>
            ))}
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.75, type: "spring", stiffness: 260, damping: 14 }}
              className="ml-2 inline-block h-[0.16em] w-[0.16em] translate-y-[-0.1em] rounded-[0.03em] bg-pink"
            />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.6, ease: EASE }}
            className="mt-8 max-w-xl font-display text-2xl font-medium leading-tight sm:text-4xl"
          >
            Делаем бренды <RotatingWord />
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.75, ease: EASE }}
            className="mt-5 max-w-lg text-base leading-relaxed text-white/65 sm:text-lg"
          >
            Стратегия, перформанс, контент и digital-продукты под одной крышей. Считаем каждый рубль и делаем так, чтобы
            о вас говорили.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.9, ease: EASE }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <a
              href="#contact"
              className="group inline-flex items-center gap-2 rounded-full bg-lime px-7 py-4 font-semibold text-ink transition hover:shadow-[0_0_50px_rgba(200,255,61,0.55)]"
            >
              Обсудить проект
              <ArrowUpRight className="h-5 w-5 transition group-hover:rotate-45" />
            </a>
            <a href="#cases" className="glass rounded-full px-7 py-4 font-semibold text-bone transition hover:bg-white/10">
              Смотреть кейсы
            </a>
          </motion.div>
        </div>

        {/* Floating window stack */}
        <div className="relative hidden h-[540px] lg:block">
          <motion.div
            initial={{ opacity: 0, y: 60, rotate: -6 }}
            animate={{ opacity: 1, y: 0, rotate: -6 }}
            transition={{ duration: 1.2, delay: 0.4, ease: EASE }}
            className="absolute left-0 top-6 w-[78%]"
          >
            <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
              <GradientWindow preset="ultra" title="campaign.live" className="glass h-[330px] shadow-2xl">
                <div className="flex h-full flex-col justify-between p-6">
                  <div className="flex items-center gap-2 font-mono text-xs text-white/80">
                    <Sparkles className="h-4 w-4" /> ROAS · realtime
                  </div>
                  <div>
                    <div className="font-display text-7xl font-black tracking-tight">
                      <Counter to={487} suffix="%" />
                    </div>
                    <div className="mt-1 text-sm text-white/75">рост выручки за 6 месяцев</div>
                  </div>
                </div>
              </GradientWindow>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 60, rotate: 5 }}
            animate={{ opacity: 1, y: 0, rotate: 5 }}
            transition={{ duration: 1.2, delay: 0.6, ease: EASE }}
            className="absolute bottom-4 right-0 w-[62%]"
          >
            <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}>
              <GradientWindow preset="toxic" title="reach.mp4" speed="8s" className="glass h-[250px]">
                <div className="flex h-full flex-col justify-end p-5">
                  <div className="font-display text-5xl font-black text-ink">
                    <Counter to={92} suffix="M" />
                  </div>
                  <div className="text-sm font-medium text-ink/80">органических просмотров</div>
                </div>
              </GradientWindow>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 1.1, type: "spring" }}
            className="glass absolute -bottom-2 left-6 z-10 flex items-center gap-3 rounded-2xl px-4 py-3"
          >
            <div className="flex -space-x-2">
              {["bg-pink", "bg-cyan", "bg-lime"].map((c) => (
                <span key={c} className={`h-7 w-7 rounded-full border-2 border-ink ${c}`} />
              ))}
            </div>
            <div className="text-xs leading-tight">
              <div className="font-semibold">120+ брендов</div>
              <div className="text-white/60">доверяют QDY</div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-white/50"
      >
        scroll
        <motion.span
          animate={{ scaleY: [0, 1, 0], originY: [0, 0, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="block h-10 w-px bg-white/60"
        />
      </motion.div>
    </section>
  );
}
