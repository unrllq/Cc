"use client";

import { Counter } from "@/components/ui/counter";
import { formatNumber } from "@/lib/utils";

const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];
const GROWTH = [58, 64, 70, 76, 88, 100];

export function WorkspaceAnalytics() {
  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Followers" value={128400} format={formatNumber} />
        <StatCard label="Engagement" value={8.7} suffix="%" />
        <StatCard label="Monthly Reach" value={2400000} format={formatNumber} />
        <StatCard label="Brand Deals" value={7} format={(n) => String(Math.round(n)).padStart(2, "0")} />
      </div>

      <div className="rounded-3xl border border-ink/10 bg-paper p-6">
        <span className="label-mono text-ink/40">Follower Growth — Last 6 Months</span>
        <div className="mt-8 flex h-40 items-end gap-4">
          {GROWTH.map((v, i) => (
            <div key={MONTHS[i]} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-32 w-full items-end overflow-hidden rounded-lg bg-ink/[0.06]">
                <div
                  className="w-full rounded-lg bg-ink transition-[height] duration-700"
                  style={{ height: `${v}%` }}
                />
              </div>
              <span className="label-mono text-ink/40">{MONTHS[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  format,
}: {
  label: string;
  value: number;
  suffix?: string;
  format?: (n: number) => string;
}) {
  return (
    <div className="rounded-3xl border border-ink/10 bg-paper p-6">
      <p className="text-3xl font-semibold tabular-nums">
        <Counter value={value} suffix={suffix} format={format} />
      </p>
      <p className="label-mono mt-2 text-ink/40">{label}</p>
    </div>
  );
}
