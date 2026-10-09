"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Glass bento tile. `fade` dissolves the bottom of the card into the page
 * (mask + progressive backdrop blur), so tiles look like they sink into the
 * liquid background.
 */
export function BentoCard({
  children,
  className,
  fade = true,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  fade?: boolean;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn("glass glass-shine group relative overflow-hidden rounded-[28px]", fade && "fade-card", className)}
    >
      <div className="relative z-[1] flex h-full flex-col">{children}</div>
      {fade && (
        <div className="progressive-blur" aria-hidden>
          <div />
          <div />
          <div />
          <div />
          <div />
        </div>
      )}
    </motion.div>
  );
}
