"use client";

import { motion } from "motion/react";

const stats = [
  ["240+", "историй запущено"],
  ["1.8 млрд", "органических просмотров"],
  ["×4.2", "средний ROMI за 2025"],
  ["0", "скучных брифов принято"],
];

export function Manifesto() {
  return (
    <section className="relative mx-auto max-w-[1600px] px-4 py-28 md:px-8 md:py-40">
      <p className="mb-10 font-mono text-xs uppercase tracking-[0.25em] text-pink">/ 01 — манифест</p>
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15%" }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-[22ch] font-display text-[9vw] uppercase leading-[0.95] tracking-[-0.02em] md:text-[5.2vw]"
      >
        Люди не покупают продукт. Они покупают{" "}
        <span className="serif-i normal-case text-butter">историю</span>, которую{" "}
        <span className="rounded-[0.2em] bg-pink px-[0.15em] text-ink">стыдно</span> не рассказать друзьям.
      </motion.h2>

      <div className="mt-16 grid gap-10 md:mt-24 md:grid-cols-[1fr_1.2fr]">
        <p className="max-w-md text-lg leading-relaxed text-bone/70">
          SLUTSTORYS — студия, которая превращает бренды в сериалы. Мы пишем сюжет, снимаем его, раскатываем по
          соцсетям и докручиваем рекламой, пока аудитория не начнёт пересказывать его сама.
        </p>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-bone/10 bg-bone/10">
          {stats.map(([v, l]) => (
            <div key={l} className="bg-ink p-6 md:p-8">
              <dt className="font-display text-4xl text-bone md:text-5xl">{v}</dt>
              <dd className="mt-2 font-mono text-[11px] uppercase tracking-wider text-bone/50">{l}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
