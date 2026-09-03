import { hashSeed } from "./utils";

/**
 * SYNTEZIS does not use stock photography or real likenesses.
 * Every "portrait" in this demo is a procedurally generated synthetic
 * gradient composition, deterministic per seed string, evoking the
 * visual language of AI-rendered / virtual creators without depicting
 * anyone real.
 */
const PALETTES: [string, string, string][] = [
  ["#0A0A0A", "#8EB5CC", "#F1F1EE"],
  ["#161616", "#D8FF32", "#F1F1EE"],
  ["#0A0A0A", "#FF5A1F", "#D8D8D4"],
  ["#161616", "#8EB5CC", "#D8FF32"],
  ["#0A0A0A", "#D8D8D4", "#FF5A1F"],
  ["#161616", "#F1F1EE", "#8EB5CC"],
];

export function generateAvatar(seed: string, w = 480, h = 640): string {
  const s = hashSeed(seed);
  const palette = PALETTES[s % PALETTES.length];
  const [bg, mid, accent] = palette;
  const cx = 30 + (s % 40);
  const cy = 20 + ((s >> 3) % 30);
  const r1 = 55 + ((s >> 5) % 40);
  const angle = (s >> 7) % 360;
  const bandY = 40 + ((s >> 9) % 40);
  const shapeCount = 3 + (s % 3);

  const shapes: string[] = [];
  for (let i = 0; i < shapeCount; i++) {
    const si = s >> (i * 4);
    const sx = (si % 100);
    const sy = ((si >> 2) % 100);
    const sr = 8 + (si % 22);
    const op = (0.12 + ((si % 5) / 20)).toFixed(2);
    shapes.push(
      `<circle cx="${sx}%" cy="${sy}%" r="${sr}" fill="${accent}" opacity="${op}" />`
    );
  }

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <radialGradient id="g1" cx="${cx}%" cy="${cy}%" r="${r1}%" gradientTransform="rotate(${angle} 0.5 0.5)">
      <stop offset="0%" stop-color="${mid}" stop-opacity="0.9" />
      <stop offset="55%" stop-color="${bg}" stop-opacity="1" />
      <stop offset="100%" stop-color="${bg}" />
    </radialGradient>
    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${bg}" stop-opacity="0" />
      <stop offset="${bandY}%" stop-color="${bg}" stop-opacity="0" />
      <stop offset="100%" stop-color="${bg}" stop-opacity="0.55" />
    </linearGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="noise"/>
      <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.035 0"/>
      <feComposite operator="over" in2="SourceGraphic"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="${bg}" />
  <rect width="100%" height="100%" fill="url(#g1)" />
  ${shapes.join("\n  ")}
  <rect width="100%" height="100%" fill="url(#g2)" />
  <rect width="100%" height="100%" filter="url(#grain)" opacity="0.5" />
</svg>`.trim();

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function avatarPalette(seed: string) {
  const s = hashSeed(seed);
  return PALETTES[s % PALETTES.length];
}
