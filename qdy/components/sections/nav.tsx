"use client";

import { useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { Menu, X } from "lucide-react";

const LINKS = [
  ["Услуги", "#services"],
  ["Кейсы", "#cases"],
  ["Процесс", "#process"],
  ["Контакт", "#contact"],
] as const;

export function Nav() {
  const { scrollY } = useScroll();
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  useMotionValueEvent(scrollY, "change", (v) => setCompact(v > 40));

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      <nav
        className={`glass flex w-full items-center justify-between rounded-full py-2 pl-5 pr-2 transition-all duration-500 ${
          compact ? "max-w-3xl" : "max-w-7xl"
        }`}
      >
        <a href="#top" className="flex items-center gap-2 font-display text-xl font-black tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-lime text-sm text-ink">Q</span>
          QDY
        </a>
        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map(([l, h]) => (
            <li key={h}>
              <a href={h} className="rounded-full px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white">
                {l}
              </a>
            </li>
          ))}
        </ul>
        <a href="#contact" className="hidden rounded-full bg-bone px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-lime md:block">
          Бриф →
        </a>
        <button
          className="grid h-10 w-10 place-items-center rounded-full bg-white/10 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Меню"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>
      {open && (
        <motion.ul
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass absolute inset-x-4 top-20 space-y-1 rounded-3xl p-3 md:hidden"
        >
          {LINKS.map(([l, h]) => (
            <li key={h}>
              <a href={h} onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 font-display text-2xl font-bold hover:bg-white/10">
                {l}
              </a>
            </li>
          ))}
        </motion.ul>
      )}
    </motion.header>
  );
}
