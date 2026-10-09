"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * PixelLiquidBg — animated liquid (domain-warped fbm) field rendered through a
 * pixel grid with ordered dithering. WebGL, no deps.
 *
 * API mirrors `@unlumen-ui/pixel-liquid-bg`; swap with the registry version via
 * `npx shadcn@latest add @unlumen-ui/pixel-liquid-bg` if you prefer the original.
 */
export interface PixelLiquidBgProps {
  className?: string;
  /** Up to 4 hex colors, dark → bright. */
  colors?: string[];
  /** Size of one pixel cell in CSS px. */
  pixelSize?: number;
  /** Flow speed multiplier. */
  speed?: number;
  /** Strength of the domain warp. */
  turbulence?: number;
  /** How much the cursor stirs the liquid (0 disables). */
  mouseInfluence?: number;
  /** Ordered-dither strength 0..1. */
  dither?: number;
}

const DEFAULT_COLORS = ["#07060d", "#2a1460", "#6d3cff", "#c8ff3d"];

const VERT = `
attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2  u_res;
uniform float u_time;
uniform float u_pixel;
uniform float u_turb;
uniform float u_dither;
uniform vec3  u_mouse;   // xy in px, z = strength
uniform vec3  u_c0;
uniform vec3  u_c1;
uniform vec3  u_c2;
uniform vec3  u_c3;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), u.x),
             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++){ v += a * noise(p); p = r * p * 2.02; a *= 0.5; }
  return v;
}
float bayer4(vec2 p){
  int x = int(mod(p.x, 4.0)), y = int(mod(p.y, 4.0));
  int i = x + y * 4;
  float m[16];
  m[0]=0.;m[1]=8.;m[2]=2.;m[3]=10.;m[4]=12.;m[5]=4.;m[6]=14.;m[7]=6.;
  m[8]=3.;m[9]=11.;m[10]=1.;m[11]=9.;m[12]=15.;m[13]=7.;m[14]=13.;m[15]=5.;
  for (int k = 0; k < 16; k++){ if (k == i) return m[k] / 16.0 - 0.5; }
  return 0.0;
}
vec3 palette(float t){
  t = clamp(t, 0.0, 1.0);
  if (t < 0.33) return mix(u_c0, u_c1, t / 0.33);
  if (t < 0.66) return mix(u_c1, u_c2, (t - 0.33) / 0.33);
  return mix(u_c2, u_c3, (t - 0.66) / 0.34);
}
void main(){
  vec2 cell = floor(gl_FragCoord.xy / u_pixel);
  vec2 frag = (cell + 0.5) * u_pixel;
  vec2 uv = frag / u_res.y;
  float t = u_time;

  // cursor ripple
  vec2 m = u_mouse.xy / u_res.y;
  float d = distance(uv, m);
  float ripple = u_mouse.z * exp(-d * 5.0);

  vec2 q = vec2(fbm(uv * 1.6 + vec2(0.0, t * 0.12)),
                fbm(uv * 1.6 + vec2(5.2, -t * 0.10)));
  vec2 r = vec2(fbm(uv * 1.6 + u_turb * q + vec2(1.7, 9.2) + t * 0.15 + ripple),
                fbm(uv * 1.6 + u_turb * q + vec2(8.3, 2.8) - t * 0.126));
  float f = fbm(uv * 1.6 + u_turb * r);

  float v = smoothstep(0.15, 0.95, f * 1.15 + 0.15 * length(q) - 0.1 + ripple * 0.35);
  v += bayer4(cell) * u_dither * 0.22;
  // posterize for the chunky pixel look
  v = floor(v * 7.0 + 0.5) / 7.0;

  vec3 col = palette(v);
  // subtle cell bevel
  vec2 inCell = fract(gl_FragCoord.xy / u_pixel);
  float edge = step(0.12, inCell.x) * step(0.12, inCell.y);
  col *= mix(0.82, 1.0, edge);
  gl_FragColor = vec4(col, 1.0);
}
`;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

export function PixelLiquidBg({
  className,
  colors = DEFAULT_COLORS,
  pixelSize = 8,
  speed = 1,
  turbulence = 3.2,
  mouseInfluence = 0.6,
  dither = 1,
}: PixelLiquidBgProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- colors keyed by value
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = u("u_res"), uTime = u("u_time"), uPixel = u("u_pixel"), uTurb = u("u_turb");
    const uDither = u("u_dither"), uMouse = u("u_mouse");
    const palette = [...colors, ...Array(4).fill(colors[colors.length - 1])].slice(0, 4);
    palette.forEach((c, i) => gl.uniform3fv(u(`u_c${i}`), hexToRgb(c)));
    gl.uniform1f(uTurb, turbulence);
    gl.uniform1f(uDither, dither);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Render at a fraction of device resolution — the pixel grid hides it and saves GPU.
    const scale = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * scale));
      canvas.height = Math.max(1, Math.floor(h * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uPixel, pixelSize * scale);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const mouse = { x: -9999, y: -9999, s: 0, ts: 0 };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) * scale;
      mouse.y = (r.height - (e.clientY - r.top)) * scale;
      mouse.ts = mouseInfluence;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0, visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);
    const start = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden) return;
      mouse.s += (mouse.ts - mouse.s) * 0.06;
      mouse.ts *= 0.97;
      gl.uniform1f(uTime, reduced ? 12 : ((now - start) / 1000) * speed);
      gl.uniform3f(uMouse, mouse.x, mouse.y, mouse.s);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
  }, [colors.join(), pixelSize, speed, turbulence, mouseInfluence, dither]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("pointer-events-none block h-full w-full", className)}
      style={{ imageRendering: "pixelated" }}
    />
  );
}

export default PixelLiquidBg;
