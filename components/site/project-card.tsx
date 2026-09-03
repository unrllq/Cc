import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/types";
import { generateAvatar } from "@/lib/avatar";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<Project["status"], string> = {
  idea: "Idea",
  "in-production": "In Production",
  live: "Live",
  archived: "Archived",
};

const STATUS_COLOR: Record<Project["status"], string> = {
  idea: "bg-ink/10 text-ink/60",
  "in-production": "bg-signal/15 text-signal",
  live: "bg-lime/40 text-ink",
  archived: "bg-ink/10 text-ink/40",
};

export function ProjectCard({ project, className }: { project: Project; className?: string }) {
  return (
    <Link
      href={`/creators/${project.creatorSlug}/${project.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-3xl border border-ink/10 bg-paper transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]",
        className
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-light-gray">
        <img
          src={generateAvatar(project.slug, 480, 360)}
          alt=""
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
        />
        <span className={cn("label-mono absolute left-3 top-3 rounded-full px-3 py-1", STATUS_COLOR[project.status])}>
          {STATUS_LABEL[project.status]}
        </span>
        <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-off-white/85 backdrop-blur transition-transform group-hover:rotate-45">
          <ArrowUpRight size={14} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-5">
        <p className="label-mono text-ink/40">{project.format} · {project.year}</p>
        <p className="text-lg font-semibold tracking-tight">{project.title}</p>
      </div>
    </Link>
  );
}
