import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, MapPin } from "lucide-react";
import { OPPORTUNITIES, cityOf, getOpportunity } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { ApplyProjectButton } from "@/components/site/apply-project-button";

export function generateStaticParams() {
  return OPPORTUNITIES.map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const opp = getOpportunity(slug);
  if (!opp) return {};
  return { title: `${opp.brand} — ${opp.campaign} — SYNTEZIS`, description: opp.campaign };
}

export default async function OpportunityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const opp = getOpportunity(slug);
  if (!opp) notFound();
  const locationLabel = opp.cityId === "Remote" ? "Remote" : `${cityOf(opp.cityId).name}, ${cityOf(opp.cityId).country}`;

  return (
    <section className="mx-auto max-w-4xl px-5 pb-24 pt-36 md:px-10 md:pb-36 md:pt-44">
      <Link href="/brands" className="label-mono mb-8 inline-flex items-center gap-2 text-ink/50 hover:text-ink">
        ← All opportunities
      </Link>
      <Badge variant="outline">{opp.category}</Badge>
      <p className="label-mono mt-6 text-ink/40">{opp.brand}</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">{opp.campaign}</h1>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <InfoBlock label="Budget" value={`€${opp.budget.toLocaleString("en-GB")}`} />
        <InfoBlock label="Location" value={locationLabel} icon={<MapPin size={14} />} />
        <InfoBlock
          label="Deadline"
          value={new Date(opp.deadline).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          icon={<Calendar size={14} />}
        />
      </div>

      <div className="mt-14 grid gap-10 sm:grid-cols-2">
        <div>
          <span className="label-mono text-ink/40">Deliverables</span>
          <ul className="mt-4 flex flex-col gap-2.5">
            {opp.deliverables.map((d) => (
              <li key={d} className="flex items-center gap-3 text-sm text-ink/75">
                <span className="h-1.5 w-1.5 rounded-full bg-lime" /> {d}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <span className="label-mono text-ink/40">Creator Requirements</span>
          <ul className="mt-4 flex flex-col gap-2.5">
            {opp.requirements.map((r) => (
              <li key={r} className="flex items-center gap-3 text-sm text-ink/75">
                <span className="h-1.5 w-1.5 rounded-full bg-signal" /> {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-14">
        <ApplyProjectButton slug={opp.slug} name={`${opp.brand} — ${opp.campaign}`} />
      </div>
    </section>
  );
}

function InfoBlock({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-paper p-5">
      <span className="label-mono flex items-center gap-1.5 text-ink/40">
        {icon} {label}
      </span>
      <p className="mt-2 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
