import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLES, getArticle } from "@/lib/data";
import { generateAvatar } from "@/lib/avatar";
import { Badge } from "@/components/ui/badge";
import { ArticleCard } from "@/components/site/article-card";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return { title: `${article.title} — SYNTEZIS Journal`, description: article.excerpt };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();
  const related = ARTICLES.filter((a) => a.slug !== article.slug && a.category === article.category).slice(0, 2);

  return (
    <>
      <section className="mx-auto max-w-3xl px-5 pb-12 pt-36 md:px-10 md:pb-16 md:pt-44">
        <Link href="/journal" className="label-mono mb-8 inline-flex items-center gap-2 text-ink/50 hover:text-ink">
          ← Journal
        </Link>
        <Badge variant="outline">{article.category}</Badge>
        <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">{article.title}</h1>
        <div className="label-mono mt-6 flex flex-wrap gap-x-6 gap-y-2 text-ink/40">
          <span>{article.author}</span>
          <span>{new Date(article.date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</span>
          <span>{article.readMinutes} MIN READ</span>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-14 md:px-10">
        <div className="overflow-hidden rounded-[32px] border border-ink/10 bg-light-gray">
          <img src={generateAvatar(article.slug, 1400, 700)} alt="" className="aspect-[2/1] w-full object-cover" />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-24 md:px-10 md:pb-36">
        <div className="flex flex-col gap-6 text-lg leading-relaxed text-ink/75">
          <p className="text-xl font-medium text-ink">{article.excerpt}</p>
          <p>
            The SYNTEZIS journal covers the studio floor from the inside — reporting, interviews and research
            drawn from the resident creators, mentors and production teams building inside the Berlin campus.
          </p>
          <p>
            As the incubator&rsquo;s European network grows, this story is one part of a longer conversation
            about what happens when digital personalities are treated as a serious creative and business
            discipline, not a novelty. Expect follow-up reporting as the {article.category.toLowerCase()} desk
            keeps tracking it.
          </p>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-5 pb-24 md:px-10 md:pb-36">
          <span className="label-mono text-ink/40">More {article.category}</span>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {related.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
