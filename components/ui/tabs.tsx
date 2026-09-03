"use client";

import { cn } from "@/lib/utils";

export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: { value: string; label: string }[];
  active: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "no-scrollbar flex items-center gap-1 overflow-x-auto rounded-full border border-ink/12 bg-paper p-1",
        className
      )}
    >
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          type="button"
          aria-selected={active === t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            "label-mono shrink-0 rounded-full px-4 py-2.5 transition-colors",
            active === t.value ? "bg-ink text-off-white" : "text-ink/55 hover:text-ink"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
