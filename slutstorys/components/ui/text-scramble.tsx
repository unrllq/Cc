"use client";

// cnippet-dev/text-scramble via 21st.dev. Change: motion component memoised so it isn't recreated each tick.

import { type MotionProps, motion } from "motion/react";
import { type JSX, useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ0123456789#%&*!?";

export type TextScrambleProps = {
  children: string;
  duration?: number;
  speed?: number;
  characterSet?: string;
  as?: React.ElementType;
  className?: string;
  trigger?: boolean;
  onScrambleComplete?: () => void;
} & MotionProps;

export function TextScramble({
  children,
  duration = 0.8,
  speed = 0.04,
  characterSet = DEFAULT_CHARS,
  className,
  as: Component = "p",
  trigger = true,
  onScrambleComplete,
  ...props
}: TextScrambleProps) {
  const MotionComponent = useMemo(
    () => motion.create(Component as keyof JSX.IntrinsicElements),
    [Component],
  );
  const [scrambledText, setScrambledText] = useState<string | null>(null);
  const onDone = useRef(onScrambleComplete);
  onDone.current = onScrambleComplete;

  useEffect(() => {
    if (!trigger) return;
    const start = performance.now();
    const interval = setInterval(() => {
      const progress = (performance.now() - start) / (duration * 1000);
      let out = "";
      for (let i = 0; i < children.length; i++) {
        if (children[i] === " ") {
          out += " ";
          continue;
        }
        out += progress * children.length > i
          ? children[i]
          : characterSet[Math.floor(Math.random() * characterSet.length)];
      }
      if (progress >= 1) {
        clearInterval(interval);
        setScrambledText(null);
        onDone.current?.();
      } else {
        setScrambledText(out);
      }
    }, speed * 1000);
    return () => clearInterval(interval);
  }, [trigger, children, duration, speed, characterSet]);

  return (
    <MotionComponent className={className} aria-label={children} {...props}>
      {scrambledText ?? children}
    </MotionComponent>
  );
}

export default TextScramble;
