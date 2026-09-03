"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Stage {
  key: string;
  title: string;
  done: boolean;
  detail: string;
}

const INITIAL_STAGES: Stage[] = [
  { key: "idea", title: "Idea", done: true, detail: "Concept and positioning approved by your mentor." },
  { key: "character", title: "Character", done: true, detail: "Identity, face and voice locked." },
  { key: "visual", title: "Visual Identity", done: true, detail: "Palette, typography and asset system defined." },
  { key: "content", title: "Content System", done: true, detail: "Format library and production cadence set." },
  { key: "social", title: "Social Launch", done: false, detail: "Channel setup and first-week content queue." },
  { key: "monetization", title: "Monetization", done: false, detail: "Rate card and first brand conversations." },
];

export function ProjectBuilder() {
  const [stages, setStages] = useState(INITIAL_STAGES);
  const [open, setOpen] = useState<string | null>(null);

  const completion = Math.round((stages.filter((s) => s.done).length / stages.length) * 100);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <span className="label-mono text-ink/40">Overall Completion</span>
        <span className="text-2xl font-semibold tabular-nums">{completion}%</span>
      </div>
      <Progress value={completion} className="mb-10 h-2" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stages.map((s) => (
          <div key={s.key} className="rounded-3xl border border-ink/10 bg-paper p-5">
            <button type="button" onClick={() => setOpen(open === s.key ? null : s.key)} className="flex w-full items-center justify-between">
              <span className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full",
                    s.done ? "bg-lime text-ink" : "border border-ink/25 text-ink/30"
                  )}
                >
                  {s.done && <Check size={13} />}
                </span>
                <span className="font-semibold tracking-tight">{s.title}</span>
              </span>
            </button>
            {open === s.key && (
              <div className="mt-4 flex flex-col gap-3 border-t border-ink/10 pt-4">
                <p className="text-sm text-ink/55">{s.detail}</p>
                <button
                  type="button"
                  onClick={() =>
                    setStages((cur) => cur.map((st) => (st.key === s.key ? { ...st, done: !st.done } : st)))
                  }
                  className="label-mono self-start rounded-full border border-ink/20 px-4 py-2 text-ink/70 transition-colors hover:border-ink hover:text-ink"
                >
                  Mark as {s.done ? "incomplete" : "complete"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
