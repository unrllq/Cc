// Procedural artwork for SQOD: every image on the site is an SVG drawn here
// and inlined as a data URI, so the page needs no image host. Each kind is a
// stylised piece of integration work — a data-flow graph, a dashboard, an
// API log, a sync ring, a halftone field. Swap `ART` entries for real
// project photos whenever they exist.

type Kind = "flow" | "dash" | "code" | "rings" | "dots" | "map";

const INK = "#ece6da";
const ORANGE = "#ff5a1f";
const COBALT = "#4a63ff";
const SAND = "#c9b48a";

const BASES = [
  ["#141311", "#1f1c18"],
  ["#0f1220", "#1b2140"],
  ["#1a0f0a", "#2b160c"],
  ["#101310", "#1c221c"],
  ["#161616", "#262422"],
];

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MONO = "ui-monospace,SFMono-Regular,Menlo,monospace";
const f = (n: number) => +n.toFixed(1);

function frame(w: number, h: number, base: string[], body: string, accent: string) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${base[0]}"/><stop offset="1" stop-color="${base[1]}"/></linearGradient>` +
    `<radialGradient id="r" cx=".78" cy=".2" r=".7"><stop offset="0" stop-color="${accent}" stop-opacity=".28"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>` +
    `<pattern id="p" width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="${INK}" fill-opacity=".09"/></pattern></defs>` +
    `<rect width="${w}" height="${h}" fill="url(#g)"/><rect width="${w}" height="${h}" fill="url(#p)"/><rect width="${w}" height="${h}" fill="url(#r)"/>` +
    body +
    `</svg>`
  );
}

const SYSTEMS = ["ERP", "CRM", "SHOP", "DATEV", "BI", "HR", "PIM", "WMS", "API", "MAIL", "SSO", "BANK"];

function flow(w: number, h: number, r: () => number, accent: string) {
  const nodes: { x: number; y: number; l: string }[] = [];
  const cols = 4;
  for (let c = 0; c < cols; c++) {
    const rows = c === 1 || c === 2 ? 1 : 3;
    for (let k = 0; k < rows; k++) {
      nodes.push({
        x: 140 + (c * (w - 280)) / (cols - 1),
        y: rows === 1 ? h / 2 + (c === 1 ? -60 : 60) : h * (0.22 + k * 0.28),
        l: SYSTEMS[Math.floor(r() * SYSTEMS.length)],
      });
    }
  }
  let s = "";
  const hub = nodes[3];
  const hub2 = nodes[4];
  const links: [number, number][] = [[0, 3], [1, 3], [2, 3], [3, 4], [4, 5], [4, 6], [4, 7]];
  links.forEach(([a, b], i) => {
    const A = nodes[a];
    const B = nodes[b];
    const mx = (A.x + B.x) / 2;
    const hot = i === 3 || i === Math.floor(r() * links.length);
    s += `<path d="M${f(A.x)},${f(A.y)} C${f(mx)},${f(A.y)} ${f(mx)},${f(B.y)} ${f(B.x)},${f(B.y)}" fill="none" stroke="${hot ? accent : INK}" stroke-opacity="${hot ? 0.95 : 0.28}" stroke-width="${hot ? 3 : 2}" ${hot ? "" : 'stroke-dasharray="6 8"'}/>`;
    if (hot) s += `<circle cx="${f(mx)}" cy="${f((A.y + B.y) / 2)}" r="7" fill="${accent}"/>`;
  });
  nodes.forEach((n, i) => {
    const big = n === hub || n === hub2;
    const bw = big ? 190 : 150;
    const bh = big ? 84 : 64;
    s += `<rect x="${f(n.x - bw / 2)}" y="${f(n.y - bh / 2)}" width="${bw}" height="${bh}" rx="14" fill="${big ? INK : "#000"}" fill-opacity="${big ? 1 : 0.35}" stroke="${INK}" stroke-opacity=".35"/>`;
    s += `<text x="${f(n.x)}" y="${f(n.y + 9)}" text-anchor="middle" font-family="${MONO}" font-size="${big ? 26 : 22}" letter-spacing="4" fill="${big ? "#111" : INK}">${big ? (i === 3 ? "SQOD" : "SYNC") : n.l}</text>`;
  });
  s += `<text x="48" y="${h - 44}" font-family="${MONO}" font-size="20" letter-spacing="5" fill="${INK}" fill-opacity=".5">PIPELINE · ${Math.floor(r() * 900 + 100)} EVENTS/MIN</text>`;
  return s;
}

function dash(w: number, h: number, r: () => number, accent: string) {
  let s = "";
  const pad = 56;
  s += `<rect x="${pad}" y="${pad}" width="${w - pad * 2}" height="${h - pad * 2}" rx="22" fill="#000" fill-opacity=".3" stroke="${INK}" stroke-opacity=".14"/>`;
  s += `<rect x="${pad + 32}" y="${pad + 30}" width="160" height="14" rx="7" fill="${INK}" fill-opacity=".8"/>`;
  s += `<rect x="${pad + 32}" y="${pad + 56}" width="260" height="10" rx="5" fill="${INK}" fill-opacity=".25"/>`;
  [0, 1, 2].forEach((k) => {
    const x = pad + 32 + k * 250;
    s += `<rect x="${x}" y="${pad + 96}" width="226" height="120" rx="14" fill="${INK}" fill-opacity=".05" stroke="${INK}" stroke-opacity=".1"/>`;
    s += `<text x="${x + 20}" y="${pad + 168}" font-family="${MONO}" font-size="40" fill="${k === 0 ? accent : INK}">${k === 0 ? "+" : ""}${Math.floor(r() * 90 + 10)}${k === 1 ? "%" : k === 2 ? "k" : ""}</text>`;
    s += `<rect x="${x + 20}" y="${pad + 188}" width="${80 + r() * 80}" height="8" rx="4" fill="${INK}" fill-opacity=".22"/>`;
  });
  const cx = pad + 32;
  const cy = h - pad - 40;
  const cw = w - pad * 2 - 64;
  const chH = h - pad * 2 - 300;
  let d = "";
  let v = 0.3;
  const n = 14;
  for (let i = 0; i < n; i++) {
    v = Math.min(0.95, Math.max(0.1, v + (r() - 0.38) * 0.22));
    const x = cx + (i / (n - 1)) * cw;
    const y = cy - v * chH;
    d += (i ? " L" : "M") + f(x) + "," + f(y);
    s += `<rect x="${f(x - 9)}" y="${f(cy - v * chH * 0.6)}" width="18" height="${f(v * chH * 0.6)}" rx="3" fill="${INK}" fill-opacity=".1"/>`;
  }
  s += `<path d="${d}" fill="none" stroke="${accent}" stroke-width="4" stroke-linejoin="round"/>`;
  s += `<line x1="${cx}" x2="${cx + cw}" y1="${cy}" y2="${cy}" stroke="${INK}" stroke-opacity=".2"/>`;
  return s;
}

const VERBS = ["GET", "POST", "PUT", "SYNC", "MAP", "PUSH"];
const PATHS = ["/orders", "/invoices", "/customers", "/stock", "/payroll", "/leads", "/webhooks", "/products"];

function code(w: number, h: number, r: () => number, accent: string) {
  let s = "";
  const lines = 13;
  const lh = (h - 160) / lines;
  for (let i = 0; i < lines; i++) {
    const y = 110 + i * lh;
    const ok = r() > 0.18;
    s += `<text x="64" y="${f(y)}" font-family="${MONO}" font-size="20" fill="${INK}" fill-opacity=".28">${String(i + 1).padStart(2, "0")}</text>`;
    s += `<text x="130" y="${f(y)}" font-family="${MONO}" font-size="24" fill="${i % 4 === 0 ? accent : INK}" fill-opacity="${i % 4 === 0 ? 1 : 0.85}">${VERBS[Math.floor(r() * VERBS.length)]}</text>`;
    s += `<text x="250" y="${f(y)}" font-family="${MONO}" font-size="24" fill="${INK}" fill-opacity=".6">${PATHS[Math.floor(r() * PATHS.length)]}</text>`;
    s += `<rect x="${f(520 + r() * 60)}" y="${f(y - 16)}" width="${f(120 + r() * 380)}" height="14" rx="7" fill="${INK}" fill-opacity=".12"/>`;
    s += `<text x="${w - 70}" y="${f(y)}" text-anchor="end" font-family="${MONO}" font-size="22" fill="${ok ? "#7ee2a8" : accent}">${ok ? "200" : "RETRY"}</text>`;
  }
  return s;
}

function rings(w: number, h: number, r: () => number, accent: string) {
  let s = "";
  const cx = w * 0.5;
  const cy = h * 0.52;
  for (let i = 1; i <= 6; i++) {
    const rad = i * Math.min(w, h) * 0.075;
    s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rad)}" fill="none" stroke="${INK}" stroke-opacity="${0.08 + i * 0.03}" ${i % 2 ? 'stroke-dasharray="4 10"' : ""}/>`;
    const a = r() * Math.PI * 2;
    const hot = i === 3 || i === 5;
    s += `<circle cx="${f(cx + Math.cos(a) * rad)}" cy="${f(cy + Math.sin(a) * rad)}" r="${hot ? 12 : 7}" fill="${hot ? accent : INK}"/>`;
    if (hot)
      s += `<text x="${f(cx + Math.cos(a) * rad + 22)}" y="${f(cy + Math.sin(a) * rad + 7)}" font-family="${MONO}" font-size="20" letter-spacing="3" fill="${INK}" fill-opacity=".7">${SYSTEMS[Math.floor(r() * SYSTEMS.length)]}</text>`;
  }
  s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="46" fill="${INK}"/>`;
  s += `<text x="${f(cx)}" y="${f(cy + 8)}" text-anchor="middle" font-family="${MONO}" font-size="22" letter-spacing="3" fill="#111">SQOD</text>`;
  return s;
}

function dots(w: number, h: number, r: () => number, accent: string) {
  let s = "";
  const gap = 46;
  const fx = 0.3 + r() * 0.4;
  const fy = 0.3 + r() * 0.4;
  for (let y = gap / 2; y < h; y += gap) {
    for (let x = gap / 2; x < w; x += gap) {
      const d = Math.hypot(x / w - fx, (y / h - fy) * 0.6);
      const v = Math.max(0, 1 - d * 1.9);
      if (v < 0.04) continue;
      s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(v * gap * 0.48)}" fill="${v > 0.72 ? accent : INK}" fill-opacity="${v > 0.72 ? 1 : 0.75}"/>`;
    }
  }
  return s;
}

// A loose dot map of Germany: sampled points inside a hand-drawn outline.
const DE = [
  [0.47, 0.02], [0.58, 0.07], [0.66, 0.06], [0.72, 0.16], [0.82, 0.2], [0.86, 0.36], [0.83, 0.5],
  [0.74, 0.6], [0.8, 0.74], [0.76, 0.86], [0.66, 0.96], [0.46, 0.98], [0.34, 0.92], [0.26, 0.8],
  [0.2, 0.66], [0.15, 0.5], [0.2, 0.36], [0.28, 0.26], [0.36, 0.2], [0.42, 0.1],
];
function inside(x: number, y: number) {
  let c = false;
  for (let i = 0, j = DE.length - 1; i < DE.length; j = i++) {
    const [xi, yi] = DE[i];
    const [xj, yj] = DE[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
const CITIES: [number, number, string][] = [
  [0.7, 0.3, "BERLIN"], [0.5, 0.18, "HAMBURG"], [0.6, 0.86, "MÜNCHEN"], [0.28, 0.5, "KÖLN"], [0.4, 0.62, "FRANKFURT"],
];
function map(w: number, h: number, _r: () => number, accent: string) {
  let s = "";
  const size = h * 0.86;
  const ox = (w - size) / 2;
  const oy = h * 0.07;
  const gap = 0.022;
  for (let y = 0; y <= 1; y += gap) {
    for (let x = 0; x <= 1; x += gap) {
      if (inside(x, y)) s += `<circle cx="${f(ox + x * size)}" cy="${f(oy + y * size)}" r="3.4" fill="${INK}" fill-opacity=".45"/>`;
    }
  }
  CITIES.forEach(([x, y, l], i) => {
    const X = ox + x * size;
    const Y = oy + y * size;
    if (i) {
      const [x0, y0] = CITIES[0];
      s += `<path d="M${f(ox + x0 * size)},${f(oy + y0 * size)} Q${f((ox + x0 * size + X) / 2)},${f(Math.min(oy + y0 * size, Y) - 80)} ${f(X)},${f(Y)}" fill="none" stroke="${accent}" stroke-width="2.5" stroke-opacity=".8"/>`;
    }
    s += `<circle cx="${f(X)}" cy="${f(Y)}" r="11" fill="${accent}"/><circle cx="${f(X)}" cy="${f(Y)}" r="22" fill="none" stroke="${accent}" stroke-opacity=".5"/>`;
    s += `<text x="${f(X + 30)}" y="${f(Y + 7)}" font-family="${MONO}" font-size="20" letter-spacing="3" fill="${INK}" fill-opacity=".8">${l}</text>`;
  });
  return s;
}

const DRAW: Record<Kind, typeof flow> = { flow, dash, code, rings, dots, map };

export function art(kind: Kind, seed: number, w = 1600, h = 900) {
  const r = rng(seed * 9973 + 17);
  const base = BASES[seed % BASES.length];
  const accent = [ORANGE, ORANGE, COBALT, SAND][seed % 4];
  const svg = frame(w, h, base, DRAW[kind](w, h, r, accent), accent);
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

export type Artwork = { src: string; alt: string; title: string; tag: string };

export const HERO_IMAGES: Artwork[] = [
  { src: art("flow", 1), alt: "Datenfluss zwischen ERP, CRM und Shop", title: "ERP ↔ Shop", tag: "Middleware" },
  { src: art("dash", 2), alt: "Live-Dashboard mit Umsatzkennzahlen", title: "Live-Reporting", tag: "BI" },
  { src: art("code", 3), alt: "Protokoll von API-Aufrufen", title: "API-Gateway", tag: "Schnittstellen" },
  { src: art("rings", 4), alt: "Synchronisierte Systeme um einen zentralen Knoten", title: "Single Source", tag: "Stammdaten" },
  { src: art("map", 5), alt: "Standorte in Deutschland verbunden", title: "Multi-Standort", tag: "Infrastruktur" },
  { src: art("dots", 6), alt: "Abstraktes Punktraster", title: "Datenqualität", tag: "Analyse" },
  { src: art("flow", 7), alt: "Automatisierter Rechnungsfluss", title: "Rechnung → DATEV", tag: "Automation" },
  { src: art("dash", 8), alt: "Lagerbestand in Echtzeit", title: "Lager in Echtzeit", tag: "WMS" },
  { src: art("code", 9), alt: "Webhook-Protokoll", title: "Webhooks", tag: "Events" },
  { src: art("rings", 10), alt: "Synchronisierungsringe", title: "Sync-Engine", tag: "Plattform" },
];

export const TIMELINE_IMAGE = art("map", 11, 1200, 1200);
