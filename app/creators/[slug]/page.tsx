import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CREATORS, cityOf, getCreator, projectsByCreator } from "@/lib/data";
import { generateAvatar } from "@/lib/avatar";
import { CreatorProfile } from "@/components/site/creator-profile";
import { ProfileStats } from "@/components/site/profile-stats";

export function generateStaticParams() {
  return CREATORS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const creator = getCreator(slug);
  if (!creator) return {};
  return {
    title: `${creator.name} — SYNTEZIS Creators`,
    description: creator.bio,
  };
}

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const creator = getCreator(slug);
  if (!creator) notFound();
  const projects = projectsByCreator(slug);
  const city = cityOf(creator.cityId);

  return (
    <>
      <section className="mx-auto max-w-[1440px] px-5 pb-16 pt-32 md:px-10 md:pb-24 md:pt-40">
        <div className="grid gap-10 md:grid-cols-[340px_1fr] md:gap-16">
          <div className="overflow-hidden rounded-[32px] border border-ink/10 bg-light-gray">
            <img
              src={generateAvatar(creator.slug, 680, 900)}
              alt={`${creator.name} — synthetic portrait`}
              className="aspect-[3/4] w-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-between gap-10">
            <div>
              <p className="label-mono text-ink/40">
                {city.name.toUpperCase()} / {city.country === "United Kingdom" ? "UK" : "DE"}
              </p>
              <h1 className="mt-3 text-5xl font-semibold tracking-tight md:text-7xl">{creator.name}</h1>
              <p className="mt-4 text-lg text-ink/55">
                {creator.specialization} — {creator.archetype}
              </p>
            </div>
            <ProfileStats
              projectsCount={creator.projectsCount}
              audience={creator.audience}
              brandCollabs={creator.brandCollabs}
              memberSince={creator.memberSince}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pb-24 md:px-10 md:pb-36">
        <CreatorProfile creator={creator} projects={projects} />
      </section>
    </>
  );
}
