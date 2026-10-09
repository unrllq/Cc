"use client";

import { motion } from "motion/react";
import { BarChart3, Bot, Clapperboard, Heart, LineChart, MonitorSmartphone, Palette } from "lucide-react";
import { BentoCard } from "@/components/ui/bento-card";
import { GradientWindow } from "@/components/ui/gradient-window";

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white/70">
      {children}
    </span>
  );
}

function CardHead({ icon: Icon, n, title, text }: { icon: typeof Bot; n: string; title: string; text: string }) {
  return (
    <div className="p-6 sm:p-7">
      <div className="mb-5 flex items-center justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/15 bg-white/10">
          <Icon className="h-5 w-5 text-lime" />
        </span>
        <span className="font-mono text-xs text-white/40">{n}</span>
      </div>
      <h3 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-white/60">{text}</p>
    </div>
  );
}

const BARS = [38, 52, 44, 68, 59, 81, 74, 96];

export function Services() {
  return (
    <section id="services" className="relative px-4 py-28 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-lime">/ 01 — Что мы делаем</p>
            <h2 className="font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
              Full-stack
              <br />
              <span className="text-outline">маркетинг</span>
            </h2>
          </div>
          <p className="max-w-sm text-white/60">
            Одна команда от стратегии до продаж. Без подрядчиков-посредников и потерянных в переписке брифов.
          </p>
        </div>

        <div className="grid auto-rows-[minmax(300px,auto)] grid-cols-1 gap-4 md:auto-rows-[280px] md:grid-cols-6">
          {/* Performance */}
          <BentoCard className="md:col-span-4 md:row-span-2">
            <CardHead
              icon={BarChart3}
              n="01"
              title="Performance-маркетинг"
              text="Контекст, таргет, маркетплейсы и programmatic. Сквозная аналитика и оптимизация под выручку, а не клики."
            />
            <div className="flex flex-wrap gap-2 px-7">
              <Tag>Яндекс Директ</Tag>
              <Tag>VK Ads</Tag>
              <Tag>Telegram Ads</Tag>
              <Tag>Ozon / WB</Tag>
            </div>
            <div className="mt-auto px-6 pb-0 pt-6 sm:px-7">
              <GradientWindow preset="ultra" title="dashboard / revenue" className="h-[300px]">
                <div className="flex h-full items-end gap-2 p-5 sm:gap-3">
                  {BARS.map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.3 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                      className="flex-1 rounded-t-lg border border-white/30 bg-white/20 backdrop-blur-md"
                    />
                  ))}
                </div>
              </GradientWindow>
            </div>
          </BentoCard>

          {/* SMM */}
          <BentoCard className="md:col-span-2" delay={0.1}>
            <CardHead icon={Heart} n="02" title="SMM & Influence" text="Контент-планы, комьюнити, блогеры и UGC." />
            <div className="relative mx-7 mt-auto h-24">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{ y: [40, -30], opacity: [0, 1, 0], scale: [0.6, 1.1, 0.8] }}
                  transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
                  className="absolute bottom-0 text-pink"
                  style={{ left: `${20 + i * 28}%` }}
                >
                  <Heart className="h-7 w-7 fill-current" />
                </motion.span>
              ))}
            </div>
          </BentoCard>

          {/* Branding */}
          <BentoCard className="md:col-span-2" delay={0.2}>
            <div className="absolute inset-0 -z-0 opacity-70">
              <GradientWindow preset="sunset" chrome={false} className="h-full rounded-none border-0" speed="10s" />
            </div>
            <div className="relative">
              <CardHead icon={Palette} n="03" title="Брендинг" text="Платформа бренда, нейминг, айдентика, гайды." />
            </div>
          </BentoCard>

          {/* Content */}
          <BentoCard className="md:col-span-2 md:row-span-2" delay={0.05}>
            <CardHead
              icon={Clapperboard}
              n="04"
              title="Контент-продакшн"
              text="Reels, клипы, 3D и фуд-съёмки. Своя студия и постпродакшн."
            />
            <div className="mt-auto grid grid-cols-2 gap-3 px-6 sm:px-7">
              <GradientWindow preset="acid" chrome={false} className="aspect-[9/16]" speed="9s" />
              <div className="flex flex-col gap-3">
                <GradientWindow preset="ice" chrome={false} className="aspect-square" speed="14s" />
                <GradientWindow preset="toxic" chrome={false} className="aspect-square" speed="7s" />
              </div>
            </div>
          </BentoCard>

          {/* Web */}
          <BentoCard className="md:col-span-2" delay={0.1}>
            <CardHead icon={MonitorSmartphone} n="05" title="Web & Product" text="Лендинги, e-com, Telegram Mini Apps." />
            <div className="mx-7 mt-auto space-y-2">
              <div className="h-2 w-3/4 rounded-full bg-white/20" />
              <div className="h-2 w-1/2 rounded-full bg-lime/70" />
              <div className="h-2 w-2/3 rounded-full bg-white/10" />
            </div>
          </BentoCard>

          {/* AI */}
          <BentoCard className="md:col-span-2" delay={0.15}>
            <CardHead icon={Bot} n="06" title="AI-креативы" text="Сотни вариаций баннеров и видео за день." />
            <div className="mx-7 mt-auto font-mono text-xs text-lime/80">
              <motion.span
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              >
                ▍generating 248 variants…
              </motion.span>
            </div>
          </BentoCard>

          {/* Analytics */}
          <BentoCard className="md:col-span-4" delay={0.2}>
            <div className="grid h-full md:grid-cols-2">
              <CardHead
                icon={LineChart}
                n="07"
                title="Аналитика & CRM"
                text="Сквозная аналитика, когорты, LTV и дашборды, которые читает CEO."
              />
              <div className="relative hidden p-6 md:block">
                <svg viewBox="0 0 300 160" className="h-full w-full">
                  <defs>
                    <linearGradient id="lg" x1="0" x2="1">
                      <stop offset="0" stopColor="#6d3cff" />
                      <stop offset="0.5" stopColor="#ff4fd8" />
                      <stop offset="1" stopColor="#c8ff3d" />
                    </linearGradient>
                  </defs>
                  <motion.path
                    d="M0 140 C40 130 60 90 100 100 S160 40 200 60 S260 10 300 8"
                    fill="none"
                    stroke="url(#lg)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                  />
                </svg>
              </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </section>
  );
}
