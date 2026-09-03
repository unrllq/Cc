import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Opportunity } from "@/lib/types";
import { cityOf } from "@/lib/data";

export function OpportunityCard({ opp }: { opp: Opportunity }) {
  const locationLabel = opp.cityId === "Remote" ? "Remote" : cityOf(opp.cityId).name;
  return (
    <Link
      href={`/brands/${opp.slug}`}
      className="group flex flex-col justify-between gap-8 rounded-3xl border border-ink/10 bg-paper p-6 transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
    >
      <div className="flex items-start justify-between">
        <span className="label-mono rounded-full bg-ink/5 px-3 py-1 text-ink/60">{opp.category}</span>
        <ArrowUpRight size={18} className="text-ink/30 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink" />
      </div>
      <div>
        <p className="label-mono text-ink/40">{opp.brand}</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight">{opp.campaign}</h3>
      </div>
      <div className="flex items-end justify-between border-t border-ink/10 pt-4">
        <span className="text-xl font-semibold">€{opp.budget.toLocaleString("en-GB")}</span>
        <span className="label-mono text-ink/45">{locationLabel}</span>
      </div>
    </Link>
  );
}
