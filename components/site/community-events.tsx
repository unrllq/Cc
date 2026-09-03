"use client";

import { useMemo, useState } from "react";
import { EventCard } from "@/components/site/event-card";
import { Reveal } from "@/components/ui/reveal";
import type { EventItem } from "@/lib/types";

const TYPES = ["All", "Meetup", "Workshop", "Studio Night", "Open Call", "Talk"] as const;

export function CommunityEvents({ events }: { events: EventItem[] }) {
  const [type, setType] = useState<(typeof TYPES)[number]>("All");

  const filtered = useMemo(
    () => (type === "All" ? events : events.filter((e) => e.type === type)),
    [events, type]
  );

  return (
    <div>
      <div className="no-scrollbar mb-10 flex items-center gap-2 overflow-x-auto">
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`label-mono shrink-0 rounded-full border px-4 py-2.5 transition-colors ${
              type === t ? "border-ink bg-ink text-off-white" : "border-ink/15 text-ink/55 hover:border-ink/40"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {filtered.map((e, i) => (
          <Reveal key={e.slug} delay={(i % 6) * 0.05}>
            <EventCard event={e} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
