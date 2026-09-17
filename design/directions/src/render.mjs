// Rendu PNG des planches (optionnel) — nécessite Playwright : npm i -D playwright && npx playwright install chromium
// Usage : node design/directions/src/render.mjs
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '..');
const browser = await chromium.launch();
for (const f of ['direction-a', 'direction-b', 'planche-typo', 'planche-bande']) {
  for (const [suffix, w, h] of [['1440', 1440, 900], ['390', 390, 844]]) {
    if (f.startsWith('planche') && suffix === '390') continue;
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto('file://' + path.join(OUT, f + '.html'));
    await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, `${f}-${suffix}.png`), fullPage: true });
    await page.close();
  }
}
await browser.close();
