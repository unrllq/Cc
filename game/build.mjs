import * as esbuild from 'esbuild';
import { mkdirSync, cpSync, existsSync, rmSync } from 'node:fs';

const watch = process.argv.includes('--watch');
const outfile = 'game.js';

const options = {
  entryPoints: ['src/main.js'],
  bundle: true,
  format: 'esm',
  target: ['es2020'],
  minify: !process.argv.includes('--dev'),
  sourcemap: false,
  legalComments: 'none',
  outfile,
  logLevel: 'info',
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log('watching…');
} else {
  await esbuild.build(options);
  // dist/ is the shippable folder: page + bundle + assets
  if (existsSync('dist')) rmSync('dist', { recursive: true });
  mkdirSync('dist/assets', { recursive: true });
  cpSync('index.html', 'dist/index.html');
  cpSync(outfile, `dist/${outfile}`);
  cpSync('assets/rider.glb', 'dist/assets/rider.glb');
  cpSync('assets/street.glb', 'dist/assets/street.glb');
  console.log('dist/ ready');
}
