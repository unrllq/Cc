"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Bottom sheet on mobile, side/full surface on larger screens — used for
 * mobile menu, filters and lighter overlays. */
export function Sheet({
  open,
  onClose,
  children,
  className,
  side = "bottom",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  side?: "bottom" | "full";
}) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const variants =
    side === "bottom"
      ? {
          initial: { y: "100%" },
          animate: { y: 0 },
          exit: { y: "100%" },
        }
      : {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-100 flex items-end justify-center md:items-center">
          <motion.div
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              side === "bottom"
                ? "relative max-h-[90vh] w-full overflow-y-auto rounded-t-[28px] border-t border-ink/10 bg-paper p-6 shadow-[0_-20px_60px_rgba(0,0,0,0.15)]"
                : "relative flex h-full w-full flex-col overflow-y-auto bg-off-white p-6",
              className
            )}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 transition-colors hover:bg-ink hover:text-off-white"
            >
              <X size={18} />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
