"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet } from "@/components/ui/sheet";
import { buttonVariants } from "@/components/ui/button-variants";

const LINKS = [
  { href: "/program", label: "Program" },
  { href: "/creators", label: "Creators" },
  { href: "/studio", label: "Studio" },
  { href: "/community", label: "Community" },
  { href: "/about", label: "About" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-90 flex justify-center px-3 pt-3 md:px-6 md:pt-5">
        <motion.div
          animate={{
            width: scrolled ? "min(100%, 900px)" : "min(100%, 1180px)",
            paddingTop: scrolled ? 6 : 10,
            paddingBottom: scrolled ? 6 : 10,
          }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex w-full items-center justify-between rounded-full border border-ink/12 bg-off-white/70 px-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl md:px-6"
        >
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="h-2 w-2 rounded-full bg-lime" />
            <span className="text-[15px] font-bold tracking-tight">SYNTEZIS</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "label-mono rounded-full px-4 py-2 transition-colors",
                  pathname.startsWith(l.href)
                    ? "bg-ink text-off-white"
                    : "text-ink/60 hover:text-ink"
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <Link
              href="/contact"
              className="label-mono px-3 py-2 text-ink/60 transition-colors hover:text-ink"
            >
              Contact
            </Link>
            <Link href="/apply" className={buttonVariants({ size: "sm", variant: "lime" })}>
              Apply
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 md:hidden"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
        </motion.div>
      </header>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} side="full">
        <div className="flex h-full flex-col justify-between pt-14">
          <nav className="flex flex-col gap-1">
            {LINKS.map((l, i) => (
              <motion.div
                key={l.href}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.4 }}
              >
                <Link
                  href={l.href}
                  className="block border-b border-ink/10 py-5 text-4xl font-semibold tracking-tight"
                >
                  {l.label}
                </Link>
              </motion.div>
            ))}
          </nav>
          <div className="flex flex-col gap-3 pb-4">
            <Link href="/apply" className={buttonVariants({ size: "lg", variant: "primary", className: "w-full" })}>
              Apply to Syntezis
            </Link>
            <Link href="/contact" className={buttonVariants({ size: "lg", variant: "outline", className: "w-full" })}>
              Contact
            </Link>
          </div>
        </div>
      </Sheet>
    </>
  );
}
