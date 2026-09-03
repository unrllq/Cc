import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Creator } from "@/lib/types";
import { cityOf } from "@/lib/data";
import { generateAvatar } from "@/lib/avatar";
import { cn } from "@/lib/utils";

export function CreatorCard({ creator, className }: { creator: Creator; className?: string }) {
  const city = cityOf(creator.cityId);
  return (
    <Link
      href={`/creators/${creator.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border border-ink/10 bg-paper transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.12)]",
        className
      )}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-light-gray">
        <img
          src={generateAvatar(creator.slug)}
          alt={`${creator.name} — synthetic portrait`}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
        />
        <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-off-white/85 backdrop-blur transition-transform group-hover:rotate-45">
          <ArrowUpRight size={16} />
        </div>
        <div className="absolute inset-x-3 bottom-3 label-mono rounded-full bg-ink/70 px-3 py-1.5 text-off-white backdrop-blur">
          {creator.projectsCount} PROJECTS
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-5">
        <p className="text-lg font-semibold tracking-tight">{creator.name}</p>
        <p className="label-mono text-ink/45">
          {city.name.toUpperCase()} / {city.country === "United Kingdom" ? "UK" : city.country.slice(0, 2).toUpperCase()}
        </p>
        <p className="mt-2 text-sm text-ink/60">{creator.specialization}</p>
      </div>
    </Link>
  );
}
