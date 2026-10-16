"use client";

// magicui/scroll-based-velocity (dillionverma) via 21st.dev.
// Changes: motion/react import, ParallaxText hoisted out of render, `separator` prop.

import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";

import { cn } from "@/lib/utils";

export const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

function ParallaxText({
  children,
  baseVelocity = 100,
  className,
}: {
  children: React.ReactNode;
  baseVelocity: number;
  className?: string;
}) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], { clamp: false });

  const [repetitions, setRepetitions] = useState(2);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const calc = () => {
      if (containerRef.current && textRef.current) {
        const cw = containerRef.current.offsetWidth;
        const tw = textRef.current.offsetWidth || 1;
        setRepetitions(Math.ceil(cw / tw) + 2);
      }
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [children]);

  const x = useTransform(baseX, (v) => `${wrap(-100 / repetitions, 0, v)}%`);
  const directionFactor = useRef(1);

  useAnimationFrame((_, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);
    if (velocityFactor.get() < 0) directionFactor.current = -1;
    else if (velocityFactor.get() > 0) directionFactor.current = 1;
    moveBy += directionFactor.current * moveBy * velocityFactor.get();
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className="w-full overflow-hidden whitespace-nowrap" ref={containerRef}>
      <motion.div className={cn("inline-block", className)} style={{ x }}>
        {Array.from({ length: repetitions }).map((_, i) => (
          <span key={i} ref={i === 0 ? textRef : null}>
            {children}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export function VelocityScroll({
  text,
  secondText,
  default_velocity = 5,
  className,
  rowClassName,
}: {
  text: React.ReactNode;
  secondText?: React.ReactNode;
  default_velocity?: number;
  className?: string;
  rowClassName?: [string?, string?];
}) {
  return (
    <section className="relative w-full">
      <ParallaxText baseVelocity={default_velocity} className={cn(className, rowClassName?.[0])}>
        {text}
      </ParallaxText>
      <ParallaxText baseVelocity={-default_velocity} className={cn(className, rowClassName?.[1])}>
        {secondText ?? text}
      </ParallaxText>
    </section>
  );
}
