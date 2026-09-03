import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { PROJECTS, getCreator, getProject } from "@/lib/data";
import { generateAvatar } from "@/lib/avatar";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";

const STATUS_LABEL: Record<string, string> = {
  idea: "Idea",
  "in-production": "In Production",
  live: "Live",
  archived: "Archived",
};

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.creatorSlug, projectSlug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; projectSlug: string }>;
}): Promise<Metadata> {
  const { projectSlug } = await params;
  const project = getProject(projectSlug);
  if (!project) return {};
  return { title: `${project.title} — SYNTEZIS Projects`, description: project.summary };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string; projectSlug: string }>;
}) {
  const { slug, projectSlug } = await params;
  const project = getProject(projectSlug);
  const creator = getCreator(slug);
  if (!project || !creator || project.creatorSlug !== creator.slug) notFound();

  return (
    <>
      <section className="mx-auto max-w-[1440px] px-5 pb-12 pt-32 md:px-10 md:pb-16 md:pt-40">
        <Link href={`/creators/${creator.slug}`} className="label-mono mb-8 inline-flex items-center gap-2 text-ink/50 hover:text-ink">
          ← {creator.name}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline">{project.format}</Badge>
          <Badge variant={project.status === "live" ? "lime" : "outline"}>{STATUS_LABEL[project.status]}</Badge>
          <Badge variant="outline">{project.year}</Badge>
        </div>
        <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight md:text-7xl">
          {creator.name} / {project.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-ink/60">{project.summary}</p>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pb-16 md:px-10">
        <div className="overflow-hidden rounded-[32px] border border-ink/10 bg-light-gray">
          <img src={generateAvatar(project.slug, 1400, 800)} alt="" className="aspect-[16/9] w-full object-cover" />
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-12 px-5 pb-24 md:grid-cols-[2fr_1fr] md:gap-20 md:px-10 md:pb-36">
        <div className="flex flex-col gap-14">
          <ProjectSection label="Concept" text={project.concept} />
          <ProjectSection label="Visual System" text={project.visualSystem} />
          <ProjectSection label="Production" text={project.production} />
          <div>
            <span className="label-mono text-ink/40">Deliverables</span>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {project.deliverables.map((d) => (
                <li key={d} className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-paper px-4 py-3 text-sm font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Reveal className="flex flex-col gap-3 rounded-3xl border border-ink/10 bg-paper p-6 h-fit md:sticky md:top-28">
          <span className="label-mono text-ink/40">Team</span>
          <ul className="flex flex-col gap-2">
            {project.team.map((t) => (
              <li key={t} className="text-sm font-medium text-ink/75">
                {t}
              </li>
            ))}
          </ul>
          <Link
            href={`/creators/${creator.slug}`}
            className="label-mono mt-4 flex items-center justify-between rounded-full bg-ink px-5 py-3 text-off-white transition-colors hover:bg-dark"
          >
            View {creator.name} <ArrowUpRight size={14} />
          </Link>
        </Reveal>
      </section>
    </>
  );
}

function ProjectSection({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <span className="label-mono text-ink/40">{label}</span>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink/70">{text}</p>
    </div>
  );
}
