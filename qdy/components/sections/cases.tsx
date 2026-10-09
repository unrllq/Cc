import { ArrowUpRight } from "lucide-react";
import { BentoCard } from "@/components/ui/bento-card";
import { GradientWindow, type GradientPreset } from "@/components/ui/gradient-window";

const CASES: {
  brand: string;
  type: string;
  metric: string;
  label: string;
  preset: GradientPreset;
  span: string;
  dark?: boolean;
}[] = [
  { brand: "NØRD", type: "Fashion · Запуск бренда", metric: "×5.2", label: "ROMI за первый сезон", preset: "acid", span: "md:col-span-7" },
  { brand: "Pulse/Bank", type: "Fintech · Performance", metric: "−43%", label: "стоимость заявки", preset: "ice", span: "md:col-span-5" },
  { brand: "KIKO.lab", type: "Beauty · SMM + UGC", metric: "31M", label: "охват за 3 месяца", preset: "sunset", span: "md:col-span-5" },
  { brand: "Orbita", type: "FoodTech · Ребрендинг", metric: "+218%", label: "заказов из приложения", preset: "toxic", span: "md:col-span-7", dark: true },
];

export function Cases() {
  return (
    <section id="cases" className="relative px-4 py-28 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-lime">/ 02 — Кейсы</p>
            <h2 className="font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
              Цифры
              <br />
              <span className="shimmer-text">не врут</span>
            </h2>
          </div>
          <a href="#contact" className="glass inline-flex items-center gap-2 self-start rounded-full px-6 py-3 text-sm font-semibold hover:bg-white/10 md:self-auto">
            Все проекты <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {CASES.map((c, i) => (
            <BentoCard key={c.brand} className={`${c.span} h-[460px]`} delay={i * 0.08}>
              <div className="flex items-start justify-between p-6 sm:p-7">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-white/50">{c.type}</p>
                  <h3 className="mt-2 font-display text-3xl font-bold">{c.brand}</h3>
                </div>
                <span className="grid h-11 w-11 place-items-center rounded-full border border-white/15 transition group-hover:rotate-45 group-hover:bg-lime group-hover:text-ink">
                  <ArrowUpRight className="h-5 w-5" />
                </span>
              </div>
              <div className="flex-1 px-6 sm:px-7">
                <GradientWindow
                  preset={c.preset}
                  title={`${c.brand.toLowerCase()}.case`}
                  className="h-full transition duration-700 group-hover:scale-[1.02]"
                >
                  <div className="flex h-full flex-col justify-start p-6">
                    <div className={`font-display text-6xl font-black tracking-tight sm:text-7xl ${c.dark ? "text-ink" : ""}`}>
                      {c.metric}
                    </div>
                    <div className={`mt-1 text-sm font-medium ${c.dark ? "text-ink/75" : "text-white/80"}`}>{c.label}</div>
                  </div>
                </GradientWindow>
              </div>
            </BentoCard>
          ))}
        </div>
      </div>
    </section>
  );
}
