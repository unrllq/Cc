import Link from "next/link";
import type { Article } from "@/lib/types";

export function ArticleCard({ article, large = false }: { article: Article; large?: boolean }) {
  return (
    <Link
      href={`/journal/${article.slug}`}
      className="group flex flex-col justify-between gap-8 rounded-3xl border border-ink/10 bg-paper p-6 transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] md:p-8"
    >
      <div className="flex items-center justify-between">
        <span className="label-mono rounded-full bg-ink/5 px-3 py-1 text-ink/60">{article.category}</span>
        <span className="label-mono text-ink/40">{article.readMinutes} MIN READ</span>
      </div>
      <h3 className={large ? "text-3xl font-semibold leading-tight tracking-tight md:text-4xl" : "text-xl font-semibold leading-tight tracking-tight"}>
        {article.title}
      </h3>
      <p className="text-sm leading-relaxed text-ink/60">{article.excerpt}</p>
      <div className="label-mono flex items-center justify-between border-t border-ink/10 pt-4 text-ink/40">
        <span>{article.author}</span>
        <span>{new Date(article.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
      </div>
    </Link>
  );
}
