"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Mail } from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import { ProjectCard } from "@/components/site/project-card";
import { generateAvatar } from "@/lib/avatar";
import { useLocalSet } from "@/lib/use-local-set";
import { useToast } from "@/components/ui/toast";
import { cn, hashSeed } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";
import type { Creator, Project } from "@/lib/types";
import { OPPORTUNITIES } from "@/lib/data";

const CONTENT_TYPES = ["Reel", "Image", "Story", "Campaign", "Brand Post"] as const;

const TABS = [
  { value: "about", label: "About" },
  { value: "projects", label: "Projects" },
  { value: "content", label: "Content" },
  { value: "brands", label: "Brands" },
  { value: "contact", label: "Contact" },
];

export function CreatorProfile({ creator, projects }: { creator: Creator; projects: Project[] }) {
  const [tab, setTab] = useState("about");
  const { has, toggle, hydrated } = useLocalSet("syntezis:saved-creators");
  const { push } = useToast();
  const saved = hydrated && has(creator.slug);

  const seed = hashSeed(creator.slug);
  const brandCollabs = Array.from({ length: Math.min(6, creator.brandCollabs) }, (_, i) => OPPORTUNITIES[(seed + i * 7) % OPPORTUNITIES.length].brand);
  const contentPieces = Array.from({ length: 8 }, (_, i) => ({
    type: CONTENT_TYPES[(seed + i) % CONTENT_TYPES.length],
    seed: `${creator.slug}-content-${i}`,
  }));

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
        <button
          type="button"
          onClick={() => {
            toggle(creator.slug);
            push({ title: saved ? "Removed from saved" : "Saved to your list ✓", description: creator.name });
          }}
          className={cn(
            "hidden h-11 shrink-0 items-center gap-2 rounded-full border px-5 text-[13px] font-semibold transition-colors sm:flex",
            saved ? "border-ink bg-ink text-off-white" : "border-ink/20 hover:border-ink"
          )}
        >
          <Bookmark size={15} className={saved ? "fill-current" : ""} /> {saved ? "Saved" : "Save"}
        </button>
      </div>

      {tab === "about" && (
        <div className="grid gap-10 md:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-6">
            <p className="text-lg leading-relaxed text-ink/70">{creator.bio}</p>
            <div className="flex flex-wrap gap-2">
              {creator.tags.map((t) => (
                <span key={t} className="label-mono rounded-full border border-ink/15 px-3 py-1.5 text-ink/60">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-3xl border border-ink/10 bg-paper p-6">
            <StatRow label="Archetype" value={creator.archetype} />
            <StatRow label="Specialization" value={creator.specialization} />
            <StatRow label="Member Since" value={String(creator.memberSince)} />
            <StatRow label="Engagement" value={`${creator.engagement}%`} />
          </div>
        </div>
      )}

      {tab === "projects" && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      )}

      {tab === "content" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {contentPieces.map((c, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-2xl bg-light-gray">
              <img src={generateAvatar(c.seed, 320, 320)} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <span className="label-mono absolute left-2 top-2 rounded-full bg-ink/70 px-2.5 py-1 text-off-white backdrop-blur">
                {c.type}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === "brands" && (
        <div>
          {brandCollabs.length === 0 ? (
            <p className="text-ink/50">No public brand collaborations yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {brandCollabs.map((b) => (
                <div key={b} className="flex h-24 items-center justify-center rounded-2xl border border-ink/10 bg-paper px-4 text-center label-mono text-ink/60">
                  {b}
                </div>
              ))}
            </div>
          )}
          <Link href="/brands" className="label-mono mt-6 inline-flex items-center gap-2 text-ink/60 hover:text-ink">
            View open brand opportunities →
          </Link>
        </div>
      )}

      {tab === "contact" && (
        <div className="flex flex-col items-start gap-5 rounded-3xl border border-ink/10 bg-paper p-8">
          <Mail size={22} className="text-ink/40" />
          <p className="max-w-md text-ink/60">
            Brands and partners can reach {creator.name} through the SYNTEZIS partnerships desk — every enquiry
            is routed through the studio, never direct.
          </p>
          <Link href={`/contact?creator=${creator.slug}`} className={buttonVariants({ variant: "primary" })}>
            Start a conversation
          </Link>
        </div>
      )}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-ink/10 pb-3 last:border-0 last:pb-0">
      <span className="label-mono text-ink/40">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}
