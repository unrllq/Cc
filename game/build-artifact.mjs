// Emits dist/artifact.html: the same page without the document wrapper,
// because the Artifact host supplies <!doctype>, <head> and <body> itself.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const src = readFileSync('index.html', 'utf8');
const head = src.slice(src.indexOf('<head>') + 6, src.indexOf('</head>'));
const body = src.slice(src.indexOf('<body>') + 6, src.indexOf('</body>'));

const keep = head
  .split('\n')
  .filter((l) => !/<meta\s+(charset|name="viewport")/.test(l))
  .join('\n')
  .trim();

// Binary files cannot be served as artifact assets, so the models ship as
// base64 payload scripts that the loader pulls in on demand.
mkdirSync('dist/assets', { recursive: true });
for (const name of ['street', 'rider']) {
  const b64 = readFileSync(`assets/${name}.glb`).toString('base64');
  const js = `window.__ASSETS=window.__ASSETS||{};window.__ASSETS.${name}="${b64}";`;
  writeFileSync(`dist/assets/${name}.js`, js);
  console.log(`dist/assets/${name}.js — ${(Buffer.byteLength(js) / 1048576).toFixed(1)} MB`);
}

const boot = '<script>window.__ASSET_SCRIPTS=["assets/street.js","assets/rider.js"];<' + '/script>';
const out = `${keep}\n${body.trim().replace('<script type="module" src="./game.js"></script>', boot + '\n<script type="module" src="game.js"><' + '/script>')}\n`;
mkdirSync('dist', { recursive: true });
writeFileSync('dist/artifact.html', out);
console.log(`dist/artifact.html — ${(Buffer.byteLength(out) / 1024).toFixed(1)} KB`);
