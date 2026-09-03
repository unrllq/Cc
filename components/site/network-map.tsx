"use client";

import { motion } from "framer-motion";
import { CITIES } from "@/lib/data";

const W = 760;
const H = 460;
const LNG_RANGE: [number, number] = [-2, 23];
const LAT_RANGE: [number, number] = [44, 57];

function project(lat: number, lng: number) {
  const x = ((lng - LNG_RANGE[0]) / (LNG_RANGE[1] - LNG_RANGE[0])) * W;
  const y = H - ((lat - LAT_RANGE[0]) / (LAT_RANGE[1] - LAT_RANGE[0])) * H;
  return { x, y };
}

export function NetworkMap() {
  const berlin = CITIES.find((c) => c.id === "berlin")!;
  const berlinPos = project(berlin.lat, berlin.lng);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Map of the Syntezis European network, centered on Berlin">
      {/* abstract grid */}
      {Array.from({ length: 8 }).map((_, i) => (
        <line key={`v-${i}`} x1={(W / 7) * i} y1={0} x2={(W / 7) * i} y2={H} stroke="currentColor" strokeOpacity={0.06} />
      ))}
      {Array.from({ length: 6 }).map((_, i) => (
        <line key={`h-${i}`} x1={0} y1={(H / 5) * i} x2={W} y2={(H / 5) * i} stroke="currentColor" strokeOpacity={0.06} />
      ))}

      {CITIES.filter((c) => c.id !== "berlin").map((c, i) => {
        const pos = project(c.lat, c.lng);
        return (
          <motion.line
            key={c.id}
            x1={berlinPos.x}
            y1={berlinPos.y}
            x2={pos.x}
            y2={pos.y}
            stroke="currentColor"
            strokeOpacity={0.35}
            strokeWidth={1}
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, delay: 0.15 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          />
        );
      })}

      {CITIES.filter((c) => c.id !== "berlin").map((c) => {
        const pos = project(c.lat, c.lng);
        return (
          <g key={c.id}>
            <circle cx={pos.x} cy={pos.y} r={4} className="fill-ink/70" />
            <text x={pos.x + 9} y={pos.y + 4} className="fill-ink/60 text-[11px] font-mono uppercase tracking-widest">
              {c.name}
            </text>
          </g>
        );
      })}

      <motion.circle
        cx={berlinPos.x}
        cy={berlinPos.y}
        r={9}
        className="fill-lime"
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2, ease: "backOut" }}
      />
      <circle cx={berlinPos.x} cy={berlinPos.y} r={16} className="fill-none stroke-lime" strokeWidth={1} strokeOpacity={0.6} />
      <text x={berlinPos.x + 14} y={berlinPos.y - 12} className="fill-ink text-[13px] font-semibold">
        BERLIN
      </text>
      <text x={berlinPos.x + 14} y={berlinPos.y + 2} className="fill-ink/50 text-[10px] font-mono uppercase tracking-widest">
        Physical hub
      </text>
    </svg>
  );
}
