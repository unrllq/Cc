"use client";

import { Counter } from "@/components/ui/counter";
import { formatNumber } from "@/lib/utils";

export function ProfileStats({
  projectsCount,
  audience,
  brandCollabs,
  memberSince,
}: {
  projectsCount: number;
  audience: number;
  brandCollabs: number;
  memberSince: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-6 border-t border-ink/10 pt-8 sm:grid-cols-4">
      <Stat label="Projects" value={<Counter value={projectsCount} />} />
      <Stat label="Audience" value={<Counter value={audience} format={formatNumber} />} />
      <Stat label="Brand Collabs" value={<Counter value={brandCollabs} />} />
      <Stat label="Member Since" value={memberSince} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-2xl font-semibold tabular-nums md:text-3xl">{value}</p>
      <p className="label-mono mt-1 text-ink/40">{label}</p>
    </div>
  );
}
