import * as THREE from 'three';

/** Small deterministic RNG so the city looks identical every run. */
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function toTexture(c, { repeat = [1, 1], srgb = true, aniso = 4 } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  t.needsUpdate = true;
  return t;
}

/**
 * Tower facade drawn once into two canvases that stay in lockstep:
 * the colour map and the emissive map (only lit windows).
 * @returns {{map:THREE.Texture, emissive:THREE.Texture}}
 */
export function facadePair(seed = 7, tint = '#1b2030') {
  const S = 512, cols = 8, rows = 8;
  const [cc, g] = canvas(S, S);   // colour
  const [ce, e] = canvas(S, S);   // emissive
  const r = rng(seed);
  g.fillStyle = tint; g.fillRect(0, 0, S, S);
  e.fillStyle = '#000'; e.fillRect(0, 0, S, S);
  // concrete mottling (colour only)
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `rgba(${200 + r() * 55 | 0},${200 + r() * 55 | 0},255,${0.03 + r() * 0.05})`;
    g.fillRect(r() * S, r() * S, 1 + r() * 3, 1 + r() * 3);
  }
  const cw = S / cols, ch = S / rows;
  const lit = ['#ffd9a0', '#fff3d0', '#a8e8ff', '#cfe3ff', '#ffb36b', '#e8fbff'];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = i * cw, y = j * ch;
      const pad = cw * 0.18, padY = ch * 0.22;
      g.fillStyle = 'rgba(8,10,16,0.85)';
      g.fillRect(x + pad * 0.5, y + padY * 0.5, cw - pad, ch - padY);
      if (r() < 0.42) {
        const col = lit[(r() * lit.length) | 0];
        const a = 0.55 + r() * 0.45;
        g.globalAlpha = a; g.fillStyle = col;
        g.fillRect(x + pad, y + padY, cw - pad * 2, ch - padY * 2);
        g.globalAlpha = 1;
        e.globalAlpha = a * 0.95; e.fillStyle = col;
        e.fillRect(x + pad, y + padY, cw - pad * 2, ch - padY * 2);
        e.globalAlpha = 1;
        if (r() < 0.5) { // half-drawn blind
          const bh = (ch - padY * 2) * (0.2 + r() * 0.5);
          g.fillStyle = 'rgba(0,0,0,0.45)';
          g.fillRect(x + pad, y + padY, cw - pad * 2, bh);
          e.fillStyle = 'rgba(0,0,0,0.85)';
          e.fillRect(x + pad, y + padY, cw - pad * 2, bh);
        }
      } else {
        g.fillStyle = `rgba(${18 + r() * 20 | 0},${22 + r() * 24 | 0},${34 + r() * 30 | 0},1)`;
        g.fillRect(x + pad, y + padY, cw - pad * 2, ch - padY * 2);
      }
      g.fillStyle = 'rgba(0,0,0,0.22)';
      g.fillRect(x, y + ch - padY * 0.45, cw, padY * 0.45);
    }
  }
  return { map: toTexture(cc), emissive: toTexture(ce) };
}

/** Pseudo-kanji vertical sign, transparent background, emissive friendly. */
export function signTexture(seed = 3, color = '#ff2d6f', vertical = true) {
  const W = vertical ? 128 : 512, H = vertical ? 512 : 128;
  const [c, g] = canvas(W, H);
  const r = rng(seed);
  // panel
  g.fillStyle = 'rgba(6,6,10,0.92)';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = color;
  g.lineWidth = 6;
  g.strokeRect(5, 5, W - 10, H - 10);
  const n = vertical ? 4 : 4;
  const cell = (vertical ? H : W) / n;
  g.strokeStyle = color;
  g.lineCap = 'square';
  for (let k = 0; k < n; k++) {
    const ox = vertical ? W / 2 : cell * k + cell / 2;
    const oy = vertical ? cell * k + cell / 2 : H / 2;
    const s = Math.min(cell, vertical ? W : H) * 0.62;
    const strokes = 3 + ((r() * 4) | 0);
    g.lineWidth = Math.max(4, s * 0.11);
    for (let i = 0; i < strokes; i++) {
      const horiz = r() < 0.55;
      const t = (r() - 0.5) * s * 0.8;
      g.beginPath();
      if (horiz) {
        const len = s * (0.45 + r() * 0.55);
        g.moveTo(ox - len / 2, oy + t);
        g.lineTo(ox + len / 2, oy + t);
      } else {
        const len = s * (0.45 + r() * 0.55);
        g.moveTo(ox + t, oy - len / 2);
        g.lineTo(ox + t, oy + len / 2);
      }
      g.stroke();
    }
    // occasional box radical
    if (r() < 0.4) {
      g.lineWidth = Math.max(3, s * 0.08);
      const bs = s * (0.3 + r() * 0.25);
      g.strokeRect(ox - bs / 2, oy - bs / 2, bs, bs);
    }
  }
  const t = toTexture(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** Asphalt: dark, slightly wet, tiling. */
export function asphaltTexture(seed = 11) {
  const S = 512;
  const [c, g] = canvas(S, S);
  const r = rng(seed);
  g.fillStyle = '#212329';
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 26000; i++) {
    const v = 30 + r() * 58 | 0;
    g.fillStyle = `rgba(${v},${v + 2},${v + 6},${0.25 + r() * 0.5})`;
    g.fillRect(r() * S, r() * S, 1 + r() * 2, 1 + r() * 2);
  }
  // patches & cracks
  for (let i = 0; i < 26; i++) {
    g.strokeStyle = `rgba(10,10,12,${0.3 + r() * 0.4})`;
    g.lineWidth = 1 + r() * 2;
    g.beginPath();
    let x = r() * S, y = r() * S;
    g.moveTo(x, y);
    for (let k = 0; k < 7; k++) { x += (r() - 0.5) * 90; y += (r() - 0.5) * 90; g.lineTo(x, y); }
    g.stroke();
  }
  for (let i = 0; i < 9; i++) {
    g.fillStyle = `rgba(40,42,50,${0.05 + r() * 0.08})`;
    g.beginPath();
    g.ellipse(r() * S, r() * S, 40 + r() * 90, 30 + r() * 70, r() * 3.14, 0, 6.29);
    g.fill();
  }
  return toTexture(c, { repeat: [1, 1] });
}

/** Roughness map that makes the road read as damp. */
export function wetnessTexture(seed = 13) {
  const S = 256;
  const [c, g] = canvas(S, S);
  const r = rng(seed);
  g.fillStyle = '#8a8a8a';
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 40; i++) {
    const x = r() * S, y = r() * S, rad = 18 + r() * 60;
    const grd = g.createRadialGradient(x, y, 0, x, y, rad);
    grd.addColorStop(0, 'rgba(86,86,86,0.8)');
    grd.addColorStop(1, 'rgba(140,140,140,0)');
    g.fillStyle = grd;
    g.beginPath(); g.arc(x, y, rad, 0, 6.29); g.fill();
  }
  const t = toTexture(c, { srgb: false });
  return t;
}

/** Soft radial blob: light pools, smoke, glows. */
export function glowTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)', power = 1) {
  const S = 128;
  const [c, g] = canvas(S, S);
  const grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grd.addColorStop(0, inner);
  grd.addColorStop(Math.min(0.9, 0.42 * power), inner.replace(/[\d.]+\)$/, '0.22)'));
  grd.addColorStop(1, outer);
  g.fillStyle = grd;
  g.fillRect(0, 0, S, S);
  const t = toTexture(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** Puffy smoke sprite. */
export function smokeTexture(seed = 5) {
  const S = 128;
  const [c, g] = canvas(S, S);
  const r = rng(seed);
  for (let i = 0; i < 16; i++) {
    const x = S / 2 + (r() - 0.5) * 38, y = S / 2 + (r() - 0.5) * 38, rad = 16 + r() * 30;
    const grd = g.createRadialGradient(x, y, 0, x, y, rad);
    grd.addColorStop(0, 'rgba(255,255,255,0.42)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.beginPath(); g.arc(x, y, rad, 0, 6.29); g.fill();
  }
  const t = toTexture(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}
