"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Dialog } from "@/components/ui/dialog";
import { Reveal } from "@/components/ui/reveal";

interface Stage {
  n: string;
  title: string;
  detail: string;
  items: string[];
}

const STAGES: Stage[] = [
  { n: "01", title: "Idea", detail: "Concept, positioning and market fit for a new digital personality.", items: ["Market research", "Positioning", "Audience thesis", "Format selection"] },
  { n: "02", title: "Character", detail: "Identity, face, voice and backstory built as one coherent system.", items: ["Visual identity", "Voice & personality", "Backstory", "Archetype design"] },
  { n: "03", title: "Production", detail: "AI image, video, voice and 3D content systems on the studio floor.", items: ["AI image", "Video", "Voice", "3D", "Content systems"] },
  { n: "04", title: "Social", detail: "Channel strategy and the first wave of published content.", items: ["Channel setup", "Content calendar", "Launch sequence", "Community seeding"] },
  { n: "05", title: "Audience", detail: "Growth systems that turn first content into a real following.", items: ["Growth loops", "Engagement systems", "Cross-platform strategy", "Analytics"] },
  { n: "06", title: "Brand", detail: "Turning audience into brand equity brands can partner with.", items: ["Brand partnerships", "Licensing", "Rate cards", "Case studies"] },
  { n: "07", title: "Business", detail: "Sustainable revenue across services, licensing and membership.", items: ["Revenue models", "Studio partnerships", "International expansion", "Scale"] },
];

export function Pipeline() {
  const [openStage, setOpenStage] = useState<Stage | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div>
      <div className="relative flex flex-col gap-3 md:flex-row md:gap-2">
        <div className="pointer-events-none absolute left-6 right-6 top-1/2 hidden h-px -translate-y-1/2 bg-ink/12 md:block" />
        {STAGES.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.05} className="relative flex-1">
            <motion.button
              type="button"
              onMouseEnter={() => setHovered(s.n)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setOpenStage(s)}
              animate={{ flex: hovered === s.n ? 1.4 : 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 flex w-full flex-col justify-between gap-8 rounded-3xl border border-ink/12 bg-paper p-5 text-left transition-colors hover:border-ink/30 md:h-56"
            >
              <div className="flex items-center justify-between">
                <span className="label-mono text-ink/40">{s.n}</span>
                <span className="h-2 w-2 rounded-full bg-lime" />
              </div>
              <div>
                <p className="text-xl font-semibold tracking-tight">{s.title}</p>
                <motion.p
                  animate={{ opacity: hovered === s.n ? 1 : 0, height: hovered === s.n ? "auto" : 0 }}
                  className="mt-2 overflow-hidden text-sm text-ink/55"
                >
                  {s.detail}
                </motion.p>
              </div>
            </motion.button>
          </Reveal>
        ))}
      </div>

      <Dialog open={!!openStage} onClose={() => setOpenStage(null)} labelledBy="pipeline-title">
        {openStage && (
          <div>
            <span className="label-mono text-ink/40">{openStage.n} / SYNTEZIS PIPELINE</span>
            <h3 id="pipeline-title" className="mt-3 text-3xl font-semibold tracking-tight">
              {openStage.title}
            </h3>
            <p className="mt-4 text-base leading-relaxed text-ink/60">{openStage.detail}</p>
            <ul className="mt-6 flex flex-col gap-3">
              {openStage.items.map((item) => (
                <li key={item} className="flex items-center gap-3 rounded-2xl bg-ink/[0.04] px-4 py-3 text-sm font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Dialog>
    </div>
  );
}
