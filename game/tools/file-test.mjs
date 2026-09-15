// Verify the standalone build runs from file:// with no server at all.
import { chromium } from 'playwright';
const target = process.argv[2];
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--mute-audio'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto('file://' + target, { waitUntil: 'load' });
await page.waitForFunction(() => window.__app && window.__app.state === 'menu', null, { timeout: 240000 })
  .catch(() => logs.push('[FAIL] never reached the menu'));
await page.click('#btnTime').catch((e) => logs.push('[click failed] ' + String(e.message).slice(0, 80)));
await page.waitForTimeout(3000);
await page.screenshot({ path: process.argv[3] || '/tmp/file-test.png' });
logs.push('[state] ' + await page.evaluate(() => {
  if (!window.__app) return 'no app; loadText=' + (document.getElementById('loadText') || {}).textContent;
  return JSON.stringify({ state: __app.state, cps: __app.game.cp.list.length,
    tris: __app.world && __app.world.stats.tris,
    pos: __app.bike && __app.bike.pos.toArray().map((v) => +v.toFixed(1)) });
}));
console.log(logs.join('\n'));
await browser.close();
