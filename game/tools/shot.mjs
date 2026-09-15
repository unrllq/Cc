// Screenshot + console capture for playtesting:
//   node tools/shot.mjs <url> <out.png> [waitMs] [keysCsv] [width] [height]
import { chromium } from 'playwright';

const [url, out, waitMs = '6000', keys = '', w = '1280', h = '720'] = process.argv.slice(2);
const browser = await chromium.launch({
  executablePath: process.env.CHROME_BIN || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--mute-audio'],
});
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));
await page.goto(url, { waitUntil: 'load' });
// let assets stream in
const deadline = Date.now() + +waitMs;
await page.waitForFunction(() => window.__ready === true, null, { timeout: +waitMs }).catch(() => logs.push('[warn] __ready never set'));
await page.waitForTimeout(Math.max(300, deadline - Date.now()));
for (const k of keys.split(',').filter(Boolean)) {
  const [key, ms = '600'] = k.split(':');
  await page.keyboard.down(key);
  await page.waitForTimeout(+ms);
  await page.keyboard.up(key);
}
if (keys) await page.waitForTimeout(400);
await page.screenshot({ path: out });
console.log(logs.join('\n'));
await browser.close();
