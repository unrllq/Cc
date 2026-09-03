"use client";

import { Counter } from "@/components/ui/counter";

const CARDS = [
  { n: "01", label: "Character Development", rotate: "-rotate-1", pos: "left-[3%] top-[16%] md:left-[6%] md:top-[20%]" },
  { n: "02", label: "AI Production", rotate: "rotate-1", pos: "right-[3%] top-[24%] md:right-[7%] md:top-[16%]" },
  { n: "03", label: "Social Growth", rotate: "-rotate-2", pos: "left-[4%] bottom-[26%] md:left-[9%] md:bottom-[22%]" },
  { n: "04", label: "Brand Development", rotate: "rotate-1", pos: "right-[4%] bottom-[18%] md:right-[6%] md:bottom-[26%]" },
];

export function HeroInfoCards() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 hidden md:block">
      {CARDS.map((c) => (
        <div
          key={c.n}
          className={`absolute ${c.pos} ${c.rotate} label-mono flex items-center gap-2 rounded-2xl border border-ink/10 bg-off-white/80 px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-md`}
        >
          <span className="text-ink/35">{c.n}</span>
          <span className="text-ink/75">{c.label}</span>
        </div>
      ))}

      <div className="absolute left-4 top-24 flex flex-col gap-1 rounded-2xl border border-ink/10 bg-off-white/80 px-4 py-3 label-mono text-ink/60 shadow-[0_10px_30px_rgba(0,0,0,0.06)] backdrop-blur-md md:left-8">
        <span>BERLIN / DE</span>
        <span>52.5200° N</span>
        <span>13.4050° E</span>
      </div>

      <div className="absolute right-4 top-24 flex flex-col items-end gap-1 rounded-2xl border border-ink/10 bg-off-white/80 px-4 py-3 label-mono text-ink/60 shadow-[0_10px_30px_rgba(0,0,0,0.06)] backdrop-blur-md md:right-8">
        <span>SYNTHETIC MEDIA LAB</span>
        <span>EST. 2026</span>
      </div>

      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-6 rounded-full border border-ink/10 bg-off-white/85 px-6 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-md md:gap-10">
        <Stat label="Active Teams" value={8} />
        <div className="h-6 w-px bg-ink/10" />
        <Stat label="Creators" value={24} />
        <div className="h-6 w-px bg-ink/10" />
        <Stat label="Projects" value={17} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-lg font-semibold tabular-nums">
        <Counter value={value} format={(n) => String(Math.round(n)).padStart(2, "0")} />
      </span>
      <span className="label-mono text-ink/40">{label}</span>
    </div>
  );
}
