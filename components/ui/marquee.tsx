import { cn } from "@/lib/utils";
import { Fragment } from "react";

export function Marquee({
  items,
  direction = "left",
  className,
  itemClassName,
  variant = "dark",
}: {
  items: string[];
  direction?: "left" | "right";
  className?: string;
  itemClassName?: string;
  variant?: "dark" | "light";
}) {
  return (
    <div
      className={cn(
        "marquee-group relative overflow-hidden py-5",
        variant === "dark" ? "bg-ink text-off-white" : "bg-off-white text-ink",
        className
      )}
    >
      <div
        className={cn(
          "flex w-max shrink-0 items-center",
          direction === "left" ? "animate-marquee-left" : "animate-marquee-right"
        )}
      >
        {[0, 1].map((rep) => (
          <Fragment key={rep}>
            {items.map((item, i) => (
              <span
                key={`${rep}-${i}`}
                className={cn(
                  "px-4 text-2xl font-semibold tracking-tight whitespace-nowrap md:text-4xl",
                  itemClassName
                )}
              >
                {item}
                <span className="ml-4 text-lime">•</span>
              </span>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
