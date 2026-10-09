"use client";

import { motion } from "motion/react";
import { ArrowUpRight, Send } from "lucide-react";
import { BentoCard } from "@/components/ui/bento-card";
import { GradientWindow } from "@/components/ui/gradient-window";
import { Marquee } from "@/components/ui/marquee";

const STEPS = [
  { n: "01", t: "Аудит", d: "Разбираем воронку, конкурентов и юнит-экономику. 5 дней." },
  { n: "02", t: "Стратегия", d: "Позиционирование, медиамикс, KPI и бюджет по каналам." },
  { n: "03", t: "Запуск", d: "Креативы, кабинеты, контент. Первые результаты — за 2 недели." },
  { n: "04", t: "Рост", d: "Еженедельные спринты, A/B тесты и масштабирование того, что работает." },
];

export function Process() {
  return (
    <section id="process" className="relative px-4 py-28 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-lime">/ 03 — Процесс</p>
        <h2 className="mb-14 font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
          От брифа <span className="text-outline">до роста</span>
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <BentoCard key={s.n} className="h-[320px]" delay={i * 0.1}>
              <div className="p-7">
                <div className="font-display text-7xl font-black text-white/10 transition group-hover:text-lime">{s.n}</div>
                <h3 className="mt-6 font-display text-2xl font-bold">{s.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/60">{s.d}</p>
              </div>
            </BentoCard>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Contact() {
  return (
    <section id="contact" className="relative px-4 py-28 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="glass relative overflow-hidden rounded-[36px]">
          <div className="absolute inset-0 opacity-60">
            <GradientWindow preset="ultra" chrome={false} className="h-full rounded-none border-0" speed="16s" />
          </div>
          <div className="relative grid gap-10 p-8 sm:p-14 lg:grid-cols-[1.3fr_1fr] lg:items-end">
            <div>
              <p className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-lime">/ 04 — Контакт</p>
              <h2 className="font-display text-5xl font-black leading-[0.9] tracking-tight sm:text-8xl">
                Давайте
                <br />
                сделаем
                <br />
                <span className="text-lime">шум.</span>
              </h2>
            </div>
            <form
              className="glass space-y-3 rounded-3xl p-5 sm:p-6"
              onSubmit={(e) => {
                e.preventDefault();
                (e.currentTarget.querySelector("button") as HTMLButtonElement).textContent = "Заявка отправлена ✓";
              }}
            >
              {[
                { name: "name", ph: "Имя", type: "text" },
                { name: "contact", ph: "Telegram или email", type: "text" },
              ].map((f) => (
                <input
                  key={f.name}
                  name={f.name}
                  type={f.type}
                  required
                  placeholder={f.ph}
                  className="w-full rounded-2xl border border-white/15 bg-black/30 px-5 py-4 text-bone outline-none placeholder:text-white/40 focus:border-lime"
                />
              ))}
              <select
                name="budget"
                defaultValue=""
                className="w-full rounded-2xl border border-white/15 bg-black/30 px-5 py-4 text-bone outline-none focus:border-lime"
              >
                <option value="" disabled>
                  Бюджет в месяц
                </option>
                <option>до 500 000 ₽</option>
                <option>500 000 – 1 500 000 ₽</option>
                <option>1 500 000 ₽+</option>
              </select>
              <button
                type="submit"
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-lime px-6 py-4 font-semibold text-ink transition hover:shadow-[0_0_50px_rgba(200,255,61,0.55)]"
              >
                Отправить заявку <Send className="h-4 w-4 transition group-hover:translate-x-1" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden pt-10">
      <Marquee duration={24} gap="2rem" className="border-y border-white/10 py-5">
        {["hello@qdy.studio", "Telegram @qdy_studio", "Москва · Дубай · Remote", "Открыты к новым проектам"].map((t) => (
          <span key={t} className="flex items-center gap-8 whitespace-nowrap font-display text-2xl font-bold sm:text-3xl">
            {t} <span className="text-lime">✦</span>
          </span>
        ))}
      </Marquee>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span>© 2026 QDY Digital Studio</span>
        <div className="flex gap-6">
          {["Telegram", "Behance", "VK", "Dribbble"].map((s) => (
            <a key={s} href="#" className="inline-flex items-center gap-1 transition hover:text-lime">
              {s} <ArrowUpRight className="h-3 w-3" />
            </a>
          ))}
        </div>
      </div>
      <motion.div
        initial={{ y: "40%" }}
        whileInView={{ y: "0%" }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none select-none text-center font-display text-[34vw] font-black leading-[0.75] tracking-[-0.08em] text-outline [mask-image:linear-gradient(to_bottom,#000_30%,transparent)]"
        aria-hidden
      >
        QDY
      </motion.div>
    </footer>
  );
}
