"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CreatorCard } from "@/components/site/creator-card";
import { Reveal } from "@/components/ui/reveal";
import type { City, Creator } from "@/lib/types";

export function CreatorsDirectory({ creators, cities }: { creators: Creator[]; cities: City[] }) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState<string>("all");
  const [spec, setSpec] = useState<string>("all");

  const specializations = useMemo(
    () => Array.from(new Set(creators.map((c) => c.specialization))).sort(),
    [creators]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return creators.filter((c) => {
      const matchesQuery =
        !q || c.name.toLowerCase().includes(q) || c.specialization.toLowerCase().includes(q) || c.tags.some((t) => t.toLowerCase().includes(q));
      const matchesCity = city === "all" || c.cityId === city;
      const matchesSpec = spec === "all" || c.specialization === spec;
      return matchesQuery && matchesCity && matchesSpec;
    });
  }, [creators, query, city, spec]);

  return (
    <div>
      <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex flex-1 items-center gap-3 rounded-full border border-ink/15 bg-paper px-5 py-3.5">
          <Search size={16} className="text-ink/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search creators, specializations, tags…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink/35"
            aria-label="Search creators"
          />
        </div>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="label-mono rounded-full border border-ink/15 bg-paper px-4 py-3.5 text-ink/70"
          aria-label="Filter by city"
        >
          <option value="all">ALL CITIES</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name.toUpperCase()}
            </option>
          ))}
        </select>
        <select
          value={spec}
          onChange={(e) => setSpec(e.target.value)}
          className="label-mono rounded-full border border-ink/15 bg-paper px-4 py-3.5 text-ink/70"
          aria-label="Filter by specialization"
        >
          <option value="all">ALL SPECIALIZATIONS</option>
          {specializations.map((s) => (
            <option key={s} value={s}>
              {s.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      <p className="label-mono mb-6 text-ink/40">
        {filtered.length} CREATOR{filtered.length === 1 ? "" : "S"}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-ink/20 py-24 text-center text-ink/50">
          No creators match those filters yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {filtered.map((c, i) => (
            <Reveal key={c.slug} delay={(i % 8) * 0.03}>
              <CreatorCard creator={c} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
