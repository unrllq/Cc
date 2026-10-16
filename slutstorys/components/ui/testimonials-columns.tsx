"use client";

// efferd/testimonials-columns-1 via 21st.dev. Changes: typed props, brand card styling, initials instead of photos.

import React from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

export type Testimonial = { text: string; name: string; role: string; tint: string };

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{ duration: props.duration || 10, repeat: Infinity, ease: "linear", repeatType: "loop" }}
        className="flex flex-col gap-6 pb-6"
      >
        {new Array(2).fill(0).map((_, index) => (
          <React.Fragment key={index}>
            {props.testimonials.map(({ text, name, role, tint }, i) => (
              <figure
                className="w-full max-w-xs rounded-3xl border border-bone/10 bg-bone/[0.04] p-8 backdrop-blur-md"
                key={i}
                aria-hidden={index === 1}
              >
                <blockquote className="text-[15px] leading-relaxed text-bone/85">«{text}»</blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span
                    className={cn("grid h-10 w-10 place-items-center rounded-full font-display text-lg text-ink", tint)}
                  >
                    {name[0]}
                  </span>
                  <span className="flex flex-col">
                    <span className="font-medium leading-5 tracking-tight">{name}</span>
                    <span className="font-mono text-[11px] uppercase leading-5 tracking-wider text-bone/50">{role}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};
