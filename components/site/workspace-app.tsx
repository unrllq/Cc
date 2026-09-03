"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import { ProjectCard } from "@/components/site/project-card";
import { ProjectBuilder } from "@/components/site/project-builder";
import { ContentCalendar } from "@/components/site/content-calendar";
import { WorkspaceAnalytics } from "@/components/site/workspace-analytics";
import { CharacterBuilder } from "@/components/site/character-builder";
import { generateAvatar } from "@/lib/avatar";
import { useLocalSet } from "@/lib/use-local-set";
import { cityOf, getEvent } from "@/lib/data";
import { buttonVariants } from "@/components/ui/button-variants";
import type { Creator, Project } from "@/lib/types";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "projects", label: "My Projects" },
  { value: "content", label: "Content" },
  { value: "analytics", label: "Analytics" },
  { value: "character", label: "Character Builder" },
  { value: "application", label: "Application" },
  { value: "bookings", label: "Bookings" },
];

interface Application {
  name?: string;
  status?: string;
  submittedAt?: string;
  discipline?: string;
  city?: string;
  country?: string;
}

export function WorkspaceApp({ creator, projects }: { creator: Creator; projects: Project[] }) {
  const [tab, setTab] = useState("overview");
  const [application, setApplication] = useState<Application | null>(null);
  const { ids: reservedIds, hydrated } = useLocalSet("syntezis:reserved-events");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("syntezis:application");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setApplication(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const reservedEvents = hydrated
    ? Array.from(reservedIds)
        .map((slug) => getEvent(slug))
        .filter((e): e is NonNullable<typeof e> => Boolean(e))
    : [];

  return (
    <div>
      <div className="mb-10 flex flex-col items-start justify-between gap-6 rounded-3xl border border-ink/10 bg-paper p-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <img src={generateAvatar(creator.slug, 96, 96)} alt="" className="h-14 w-14 rounded-full object-cover" />
          <div>
            <p className="text-lg font-semibold tracking-tight">{creator.name}</p>
            <p className="label-mono text-ink/40">{cityOf(creator.cityId).name.toUpperCase()} / DEMO WORKSPACE</p>
          </div>
        </div>
        <Link href={`/creators/${creator.slug}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
          View public profile
        </Link>
      </div>

      <div className="mb-10 overflow-x-auto">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === "overview" && <ProjectBuilder />}

      {tab === "projects" && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      )}

      {tab === "content" && <ContentCalendar />}

      {tab === "analytics" && <WorkspaceAnalytics />}

      {tab === "character" && <CharacterBuilder />}

      {tab === "application" && (
        <div className="max-w-xl">
          {application?.status ? (
            <div className="flex flex-col gap-4 rounded-3xl border border-ink/10 bg-paper p-6">
              <span className="label-mono w-fit rounded-full bg-lime px-4 py-2 text-ink">
                STATUS: {application.status.toUpperCase()}
              </span>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Field label="Discipline" value={application.discipline} />
                <Field label="Location" value={[application.city, application.country].filter(Boolean).join(", ")} />
                <Field
                  label="Submitted"
                  value={application.submittedAt ? new Date(application.submittedAt).toLocaleDateString("en-GB") : "—"}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-4 rounded-3xl border border-dashed border-ink/20 p-8">
              <p className="text-ink/55">You haven&rsquo;t submitted an application yet.</p>
              <Link href="/apply" className={buttonVariants({ variant: "primary" })}>
                Apply to Syntezis
              </Link>
            </div>
          )}
        </div>
      )}

      {tab === "bookings" && (
        <div className="max-w-2xl">
          {reservedEvents.length === 0 ? (
            <div className="flex flex-col items-start gap-4 rounded-3xl border border-dashed border-ink/20 p-8">
              <p className="text-ink/55">No reserved events yet.</p>
              <Link href="/community" className={buttonVariants({ variant: "primary" })}>
                Browse events
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {reservedEvents.map((e) => (
                <div key={e.slug} className="flex items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-paper px-5 py-4">
                  <div>
                    <p className="font-semibold">{e.name}</p>
                    <div className="label-mono mt-1 flex items-center gap-4 text-ink/40">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} /> {new Date(e.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={12} /> {cityOf(e.cityId).name}
                      </span>
                    </div>
                  </div>
                  <span className="label-mono rounded-full bg-lime px-3 py-1.5 text-ink">Reserved</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="label-mono text-ink/40">{label}</p>
      <p className="mt-1 font-medium">{value || "—"}</p>
    </div>
  );
}
