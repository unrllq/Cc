import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Marquee({
  children,
  reverse,
  duration = 30,
  gap = "3rem",
  className,
}: {
  children: ReactNode;
  reverse?: boolean;
  duration?: number;
  gap?: string;
  className?: string;
}) {
  const style = { "--dur": `${duration}s`, "--gap": gap } as CSSProperties;
  return (
    <div className={cn("marquee", className)} data-reverse={reverse ? "" : undefined} style={style}>
      <div className="marquee__track">{children}</div>
      <div className="marquee__track" aria-hidden>
        {children}
      </div>
    </div>
  );
}
