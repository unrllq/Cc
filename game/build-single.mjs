// Builds a single self-contained .html that runs straight from the file system:
// the bundle is inlined as a classic script and both GLBs as base64.
import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';

const out = process.argv[2] || 'neo-street-rider.html';

const bundle = await esbuild.build({
  entryPoints: ['src/main.js'],
  bundle: true,
  format: 'iife',
  target: ['es2020'],
  minify: true,
  legalComments: 'none',
  write: false,
});
const js = bundle.outputFiles[0].text;

const b64 = (p) => readFileSync(p).toString('base64');
const assets = `window.__ASSETS={street:"${b64('assets/street.glb')}",rider:"${b64('assets/rider.glb')}"};`;

let html = readFileSync('index.html', 'utf8');
// NOTE: replacement must be a function - the minified bundle contains "$&"
// sequences that String.replace would otherwise expand.
html = html.replace(
  '<script type="module" src="./game.js"></script>',
  () => `<script>${assets}</script>\n<script>${js}</script>`,
);
// Google Fonts is a progressive enhancement; keep it but never block offline start
html = html.replace(
  /<link href="https:\/\/fonts\.googleapis\.com[^>]*>/,
  () => '<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@500;600;700&display=swap" rel="stylesheet" media="print" onload="this.media=\'all\'">',
);
writeFileSync(out, html);
const mb = (Buffer.byteLength(html) / 1048576).toFixed(1);
console.log(`${out} — ${mb} MB (offline, double-click to play)`);
