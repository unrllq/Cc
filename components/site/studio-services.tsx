"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Reveal } from "@/components/ui/reveal";

interface Service {
  n: string;
  title: string;
  description: string;
  detail: string;
}

const SERVICES: Service[] = [
  { n: "01", title: "AI Image", description: "Character-consistent AI image production at campaign scale.", detail: "From first concept boards to final campaign stills, every asset stays consistent to a character's face, wardrobe and world across hundreds of generations." },
  { n: "02", title: "AI Video", description: "Short and long-form synthetic video, from previz to final cut.", detail: "AI-assisted video production for social cutdowns, brand films and full-length synthetic documentaries, produced entirely in-house." },
  { n: "03", title: "3D", description: "Real-time 3D pipelines for character and environment work.", detail: "Real-time engines power character rigs, environments and live activations that can be re-used across every future production." },
  { n: "04", title: "Motion", description: "Performance capture and generative motion design.", detail: "Full-body and facial performance capture translated into believable, expressive digital performance." },
  { n: "05", title: "Voice", description: "Voice identity design and production for every character.", detail: "From cadence to accent to emotional range, each character's voice is designed as carefully as their face." },
  { n: "06", title: "Music", description: "AI-assisted composition and production for virtual artists.", detail: "Original scores, sound identities and full releases produced with resident composers and AI tooling." },
  { n: "07", title: "Editing", description: "Narrative and social-first editing across every format.", detail: "A dedicated edit bay turns raw production into hero films, social cutdowns and trailers built for the platform they'll live on." },
  { n: "08", title: "Photography", description: "Studio and location photography for editorial and campaign work.", detail: "Traditional photography sits alongside synthetic production wherever a hybrid approach serves the work better." },
  { n: "09", title: "Post Production", description: "Colour, grade and finishing to a single studio standard.", detail: "Every deliverable — AI-produced or not — passes through the same finishing pipeline before it ships." },
];

export function StudioServices() {
  const [active, setActive] = useState<Service | null>(null);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s, i) => (
          <Reveal key={s.n} delay={(i % 6) * 0.04}>
            <button
              type="button"
              onClick={() => setActive(s)}
              className="group flex h-56 w-full flex-col justify-between rounded-3xl border border-ink/10 bg-paper p-6 text-left transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
            >
              <span className="label-mono text-ink/35">{s.n}</span>
              <div>
                <p className="text-xl font-semibold tracking-tight">{s.title}</p>
                <p className="mt-2 text-sm text-ink/55">{s.description}</p>
              </div>
              <span className="label-mono flex items-center gap-1.5 text-ink/60 transition-colors group-hover:text-ink">
                Explore <ArrowUpRight size={13} />
              </span>
            </button>
          </Reveal>
        ))}
      </div>

      <Dialog open={!!active} onClose={() => setActive(null)} labelledBy="service-title">
        {active && (
          <div>
            <span className="label-mono text-ink/40">{active.n} / STUDIO CAPABILITY</span>
            <h3 id="service-title" className="mt-3 text-3xl font-semibold tracking-tight">
              {active.title}
            </h3>
            <p className="mt-4 text-base leading-relaxed text-ink/60">{active.detail}</p>
          </div>
        )}
      </Dialog>
    </>
  );
}
