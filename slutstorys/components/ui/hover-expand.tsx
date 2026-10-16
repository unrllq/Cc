"use client";

// educalvolpz/hover-expand via 21st.dev.
// Changes: panels take a `background` (CSS) + `index`/`tags` instead of only a photo, brand styling, below lg → vertical.

import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "motion/react";
import type { KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";

export interface HoverExpandItem {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  background?: string;
  image?: string;
  alt?: string;
}

export interface HoverExpandProps {
  items: HoverExpandItem[];
  className?: string;
  collapsedFlex?: number;
  expandedFlex?: number;
}

const HoverExpand = ({ items, expandedFlex = 4, collapsedFlex = 1, className }: HoverExpandProps) => {
  const shouldReduceMotion = useReducedMotion();
  const [activeIndex, setActive] = useState(0);
  const [isHoverDevice, setIsHoverDevice] = useState(false);
  const [isHorizontal, setIsHorizontal] = useState(true);
  const panelRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const hover = window.matchMedia("(hover: hover) and (pointer: fine)");
    const wide = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      setIsHoverDevice(hover.matches);
      setIsHorizontal(wide.matches);
    };
    sync();
    hover.addEventListener("change", sync);
    wide.addEventListener("change", sync);
    return () => {
      hover.removeEventListener("change", sync);
      wide.removeEventListener("change", sync);
    };
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const nextKey = isHorizontal ? "ArrowRight" : "ArrowDown";
    const prevKey = isHorizontal ? "ArrowLeft" : "ArrowUp";
    if (event.key === nextKey || event.key === prevKey) {
      event.preventDefault();
      const to = event.key === nextKey ? Math.min(index + 1, items.length - 1) : Math.max(index - 1, 0);
      setActive(to);
      panelRefs.current[to]?.focus();
    }
  };

  const spring = shouldReduceMotion ? { duration: 0 } : { bounce: 0.12, duration: 0.45, type: "spring" as const };

  return (
    <div
      aria-label="Услуги"
      className={cn("flex w-full gap-2", isHorizontal ? "h-[560px] flex-row" : "h-[820px] flex-col", className)}
      role="group"
    >
      {items.map((item, index) => {
        const isActive = index === activeIndex;
        return (
          <motion.button
            animate={{ flexGrow: isActive ? expandedFlex : collapsedFlex }}
            aria-label={item.title}
            aria-pressed={isActive}
            className="group relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-[28px] border border-bone/10 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink"
            initial={false}
            key={item.id}
            onClick={() => !isHoverDevice && setActive(index)}
            onFocus={() => setActive(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onMouseEnter={() => isHoverDevice && setActive(index)}
            ref={(el) => {
              panelRefs.current[index] = el;
            }}
            style={{ flexBasis: 0, background: item.background }}
            transition={spring}
            type="button"
          >
            {item.image ? (
              <img alt={item.alt ?? item.title} className="absolute inset-0 h-full w-full object-cover" draggable={false} src={item.image} />
            ) : null}
            <div aria-hidden className="grain absolute inset-0 opacity-60 mix-blend-overlay" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

            <span className="absolute left-5 top-5 font-mono text-xs text-bone/70">
              {String(index + 1).padStart(2, "0")}
            </span>

            {/* collapsed rail: vertical label (horizontal layout only) */}
            <motion.p
              animate={{ opacity: isHorizontal && !isActive ? 1 : 0 }}
              transition={spring}
              aria-hidden
              className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rotate-180 whitespace-nowrap font-display text-2xl uppercase text-bone [writing-mode:vertical-rl]"
            >
              {item.title}
            </motion.p>

            <motion.div
              animate={{ opacity: isActive || !isHorizontal ? 1 : 0 }}
              transition={spring}
              className="absolute inset-x-0 bottom-0 p-6"
            >
              <p
                className={cn(
                  "font-display uppercase leading-[0.9] text-bone",
                  isActive ? "text-[clamp(2rem,3.2vw,3.4rem)]" : "text-2xl",
                )}
              >
                {item.title}
              </p>
              {isActive && item.description ? (
                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, duration: 0.4 }}
                >
                  <p className="mt-4 max-w-md text-[15px] leading-relaxed text-bone/85">{item.description}</p>
                  {item.tags ? (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {item.tags.map((t) => (
                        <span key={t} className="rounded-full border border-bone/25 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-bone/80">
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </motion.div>
              ) : null}
            </motion.div>
          </motion.button>
        );
      })}
    </div>
  );
};

export default HoverExpand;
