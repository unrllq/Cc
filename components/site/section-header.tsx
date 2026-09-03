import { Reveal } from "@/components/ui/reveal";
import { TechLabel } from "@/components/ui/tech-label";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-6", align === "center" && "items-center text-center", className)}>
      <Reveal>
        <TechLabel>{eyebrow}</TechLabel>
      </Reveal>
      <Reveal delay={0.06}>
        <h2 className={cn("text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl", align === "center" && "max-w-3xl")}>
          {title}
        </h2>
      </Reveal>
      {description && (
        <Reveal delay={0.12}>
          <p className={cn("max-w-xl text-base leading-relaxed text-ink/60 md:text-lg", align === "center" && "max-w-2xl")}>
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}
