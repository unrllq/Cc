"use client";

import { Gauge, Repeat, Rocket, GitCommitHorizontal } from "lucide-react";

import { MetricCard } from "@/components/ui/neomorphism-metric-card";

// Placeholder numbers — replace with real figures before going live.
const METRICS = [
  { title: "Projekte live", value: "120+", trend: 18, icon: Rocket, accent: "#fb7185", trendLabel: "vs. Vorjahr" },
  { title: "Ø Lighthouse", value: "98", trend: 6, icon: Gauge, accent: "#60a5fa", trendLabel: "vs. Vorjahr" },
  { title: "Stammkunden", value: "87 %", trend: 9, icon: Repeat, accent: "#22c55e", trendLabel: "bleiben > 2 Jahre" },
  { title: "Deploys / Woche", value: "340", trend: 24, icon: GitCommitHorizontal, accent: "#f59e0b", trendLabel: "vs. Vorquartal" },
];

export function Metrics() {
  return (
    <section aria-label="Kennzahlen" className="px-4 pb-24">
      <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((m) => (
          <MetricCard key={m.title} {...m} className="max-w-none p-7" />
        ))}
      </div>
    </section>
  );
}
