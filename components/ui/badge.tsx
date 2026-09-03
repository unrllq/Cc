import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "lime" | "outline" | "signal" | "sky";
}) {
  const variants: Record<string, string> = {
    default: "bg-ink text-off-white",
    lime: "bg-lime text-ink",
    outline: "border border-ink/20 text-ink",
    signal: "bg-signal text-off-white",
    sky: "bg-sky text-ink",
  };
  return (
    <span
      className={cn(
        "label-mono inline-flex items-center gap-1.5 rounded-full px-3 py-1",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
