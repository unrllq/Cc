"use client";

import { useMemo, useState } from "react";
import { ArticleCard } from "@/components/site/article-card";
import { Reveal } from "@/components/ui/reveal";
import type { Article } from "@/lib/types";

const CATEGORIES = ["All", "News", "Interviews", "Creator Stories", "Research", "Events"] as const;

export function JournalList({ articles }: { articles: Article[] }) {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const filtered = useMemo(
    () => (category === "All" ? articles : articles.filter((a) => a.category === category)),
    [articles, category]
  );

  return (
    <div>
      <div className="no-scrollbar mb-10 flex items-center gap-2 overflow-x-auto">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`label-mono shrink-0 rounded-full border px-4 py-2.5 transition-colors ${
              category === c ? "border-ink bg-ink text-off-white" : "border-ink/15 text-ink/55 hover:border-ink/40"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {filtered.map((a, i) => (
          <Reveal key={a.slug} delay={(i % 6) * 0.05}>
            <ArticleCard article={a} large={i === 0} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
