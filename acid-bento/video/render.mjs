#!/usr/bin/env node
// ACID BENTO — render video/scene.html (or any HTML with CSS animations) to MP4.
//
//   node render.mjs --title "BIG NEWS" --sub "drop 12.12" --cta "Get it" --out story.mp4
//   node render.mjs --w 1920 --h 1080 --duration 6 --fps 30 --out wide.mp4
//   node render.mjs --scene ./my-scene.html --out custom.mp4
//
// Needs: Node 18+, Playwright with Chromium, ffmpeg in PATH.
// Frames are rendered deterministically: every CSS/Web animation is paused and seeked to t,
// then screenshotted and piped into ffmpeg. No dropped frames, any fps.

import { spawn, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));

function args() {
  const a = process.argv.slice(2);
  const o = {};
  for (let i = 0; i < a.length; i++) {
    if (!a[i].startsWith('--')) continue;
    const k = a[i].slice(2);
    const v = a[i + 1] && !a[i + 1].startsWith('--') ? a[++i] : 'true';
    o[k] = v;
  }
  return o;
}

async function loadPlaywright() {
  try { return await import('playwright'); } catch {}
  try {
    const root = execSync('npm root -g', { encoding: 'utf8' }).trim();
    const req = createRequire(path.join(root, 'noop.js'));
    return req('playwright');
  } catch {}
  console.error('Playwright not found. Install: npm i -D playwright && npx playwright install chromium');
  process.exit(1);
}

const o = args();
const W = +(o.w || 1080);
const H = +(o.h || 1920);
const FPS = +(o.fps || 30);
const DUR = +(o.duration || 6);
const OUT = path.resolve(o.out || 'acid-bento.mp4');
const scene = path.resolve(o.scene || path.join(here, 'scene.html'));

const params = new URLSearchParams();
for (const k of ['title', 'sub', 'cta', 'chips', 'handle']) if (o[k]) params.set(k, o[k]);
const url = pathToFileURL(scene).href + (params.toString() ? '?' + params : '');

if (!fs.existsSync(scene)) { console.error('Scene not found:', scene); process.exit(1); }

const { chromium } = await loadPlaywright();
const launchOpts = {};
if (process.env.CHROMIUM_PATH) launchOpts.executablePath = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(launchOpts);
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });

await page.goto(url, { waitUntil: 'load' });
await page.evaluate(async () => {
  await document.fonts.ready;
  if (window.__ready) await window.__ready;
});

const ff = spawn('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '18',
  '-movflags', '+faststart',
  OUT,
], { stdio: ['pipe', 'inherit', 'inherit'] });
const ffDone = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exit ' + c)))));

const total = Math.round(DUR * FPS);
for (let f = 0; f < total; f++) {
  const ms = (f / FPS) * 1000;
  await page.evaluate((t) => {
    for (const a of document.getAnimations()) { a.pause(); a.currentTime = t; }
  }, ms);
  const buf = await page.screenshot({ type: 'png' });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (f % FPS === 0) process.stdout.write(`\rframe ${f}/${total}`);
}
ff.stdin.end();
await ffDone;
await browser.close();
console.log(`\rdone → ${OUT} (${W}x${H}, ${FPS}fps, ${DUR}s)`);
