import { cn } from "@/lib/utils";

export function TechLabel({
  children,
  className,
  dot = true,
}: {
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <div className={cn("label-mono flex items-center gap-2 text-ink/50", className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-lime" />}
      {children}
    </div>
  );
}
