import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type GradientPreset = "acid" | "ultra" | "sunset" | "ice" | "toxic";

const PRESETS: Record<GradientPreset, CSSProperties> = {
  acid: { "--g1": "#6d3cff", "--g2": "#ff4fd8", "--g3": "#c8ff3d", "--g4": "#3de0ff" } as CSSProperties,
  ultra: { "--g1": "#2a14a0", "--g2": "#6d3cff", "--g3": "#ff4fd8", "--g4": "#3de0ff", "--g-base": "#0b0620" } as CSSProperties,
  sunset: { "--g1": "#ff7a2f", "--g2": "#ff4fd8", "--g3": "#ffd23d", "--g4": "#6d3cff" } as CSSProperties,
  ice: { "--g1": "#3de0ff", "--g2": "#6d3cff", "--g3": "#e8f7ff", "--g4": "#2a7bff", "--g-base": "#06122a" } as CSSProperties,
  toxic: { "--g1": "#c8ff3d", "--g2": "#1fd18a", "--g3": "#f3ff9e", "--g4": "#6d3cff", "--g-base": "#0b1a06" } as CSSProperties,
};

export function GradientWindow({
  preset = "acid",
  speed,
  title,
  chrome = true,
  className,
  children,
}: {
  preset?: GradientPreset;
  speed?: string;
  title?: string;
  chrome?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const style = { ...PRESETS[preset], ...(speed ? { "--g-speed": speed } : {}) } as CSSProperties;
  return (
    <div className={cn("flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/30", className)}>
      {chrome && (
        <div className="win-bar">
          <i />
          <i />
          <i />
          {title && <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-white/50">{title}</span>}
        </div>
      )}
      <div className="gwin flex-1" style={style}>
        <span className="blob" />
        <span className="blob" />
        <span className="blob" />
        <div className="relative z-[1] h-full">{children}</div>
      </div>
    </div>
  );
}
