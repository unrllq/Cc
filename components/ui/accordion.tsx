"use client";

import { createContext, useContext, useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const AccordionCtx = createContext<{
  open: string | null;
  setOpen: (v: string | null) => void;
}>({ open: null, setOpen: () => {} });

export function Accordion({
  children,
  defaultOpen,
  className,
}: {
  children: ReactNode;
  defaultOpen?: string;
  className?: string;
}) {
  const [open, setOpen] = useState<string | null>(defaultOpen ?? null);
  return (
    <AccordionCtx.Provider value={{ open, setOpen }}>
      <div className={cn("divide-y divide-ink/10 border-y border-ink/10", className)}>
        {children}
      </div>
    </AccordionCtx.Provider>
  );
}

export function AccordionItem({
  value,
  title,
  eyebrow,
  children,
}: {
  value: string;
  title: ReactNode;
  eyebrow?: ReactNode;
  children: ReactNode;
}) {
  const { open, setOpen } = useContext(AccordionCtx);
  const isOpen = open === value;
  const id = useId();

  return (
    <div>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={id}
        onClick={() => setOpen(isOpen ? null : value)}
        className="flex w-full items-center justify-between gap-6 py-7 text-left transition-colors hover:text-ink/70 md:py-9"
      >
        <span className="flex flex-1 items-baseline gap-4 md:gap-8">
          {eyebrow && <span className="label-mono text-ink/40">{eyebrow}</span>}
          <span className="text-2xl font-semibold tracking-tight md:text-4xl">{title}</span>
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/20"
        >
          <Plus size={16} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={id}
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-9 md:pl-[3.25rem]">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
