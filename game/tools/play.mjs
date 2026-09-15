// Drive the game headlessly and grab frames: node tools/play.mjs <out-prefix> <script>
// script = comma list of "key:ms" or "wait:ms" or "shot:name"
import { chromium } from 'playwright';

const [prefix, script = 'wait:1000,shot:boot'] = process.argv.slice(2);
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--mute-audio'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${(e.stack || '').split('\n').slice(0, 4).join('\n')}`));
await page.goto('http://127.0.0.1:8123/index.html', { waitUntil: 'load' });
await page.waitForFunction(() => window.__app && window.__app.state !== 'loading', null, { timeout: 180000 })
  .catch(() => logs.push('[warn] never left loading'));

const held = new Set();
for (const step of script.split(';;')) {
  const i = step.indexOf(':'); const cmd = i < 0 ? step : step.slice(0, i); const arg = i < 0 ? '' : step.slice(i + 1);
  if (cmd === 'wait') await page.waitForTimeout(+arg);
  else if (cmd === 'shot') await page.screenshot({ path: `${prefix}_${arg}.png` });
  else if (cmd === 'click') await page.click(arg);
  else if (cmd === 'down') { await page.keyboard.down(arg); held.add(arg); }
  else if (cmd === 'up') { await page.keyboard.up(arg); held.delete(arg); }
  else if (cmd === 'eval') logs.push('[eval] ' + JSON.stringify(await page.evaluate(arg)));
}
for (const k of held) await page.keyboard.up(k);
console.log(logs.join('\n'));
await browser.close();
