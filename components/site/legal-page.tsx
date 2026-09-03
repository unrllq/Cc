import { SectionHeader } from "@/components/site/section-header";
import type { ReactNode } from "react";

export function LegalPage({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-3xl px-5 pb-24 pt-36 md:px-10 md:pb-36 md:pt-44">
      <SectionHeader eyebrow={eyebrow} title={title} description={`Last updated ${updated}`} />
      <div className="mt-14 flex flex-col gap-8 text-base leading-relaxed text-ink/65">{children}</div>
    </section>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-ink">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}
