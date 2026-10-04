// Captures des trois options (Cowork, 04/10/2026) : la section des agences seule, à 1 521 px (écran d'Axel) et 1 920 px, la page entière à 1 521 px
// et au téléphone (390 px), et une tuile au survol. Contrôles : aucune image en échec, aucun débordement horizontal, ratio des photos dans leur case.
// node design/revue-mosaique/src/captures.mjs  (Playwright, comme check.mjs)
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import path from 'node:path';
import fs from 'node:fs';

const REPO = process.cwd();
const PAGE = 'file://' + path.join(REPO, 'design/revue-mosaique/propositions/mosaique.html');
const OUT = path.join(REPO, 'design/revue-mosaique/captures');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const options = (process.argv[2] || 'a,b,c').split(',');
const photo = process.argv[3] || 'actuelles';
for (const [w, h] of [[1521, 705], [1920, 1080], [390, 844]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: w === 390 ? 2 : 1 });
  for (const o of options) {
    await page.goto(`${PAGE}?option=${o}&photo=${photo}&panneau=off`);
    await page.evaluate(async () => { await document.fonts.ready; for (const i of document.images) { i.loading = 'eager'; i.decoding = 'sync'; } });
    await page.waitForFunction(() => [...document.querySelectorAll('.mos:not([style*="none"]) img')].filter(i => i.offsetParent).every(i => i.complete));
    await page.waitForTimeout(300);
    const info = await page.evaluate(() => {
      const mos = [...document.querySelectorAll('.mos')].find(m => getComputedStyle(m).display !== 'none');
      const r = mos.getBoundingClientRect();
      const casses = [...mos.querySelectorAll('img')].filter(i => i.offsetParent && i.naturalWidth === 0).map(i => i.src);
      const ratios = [...mos.querySelectorAll('.tuile')].map(t => {
        const i = [...t.querySelectorAll('img')].find(x => x.offsetParent); const b = t.getBoundingClientRect();
        return { nom: t.querySelector('.tuile__nom').textContent, w: Math.round(b.width), h: Math.round(b.height), garde: +(Math.min(b.width / b.height / (i.naturalWidth / i.naturalHeight), (i.naturalWidth / i.naturalHeight) / (b.width / b.height))).toFixed(2) };
      });
      const cas = [...mos.querySelectorAll('.cas')].map(c => ({ debord: c.scrollHeight > c.clientHeight + 1, w: Math.round(c.getBoundingClientRect().width), h: Math.round(c.getBoundingClientRect().height) }));
      return { top: r.top + scrollY, height: r.height, debordement: document.documentElement.scrollWidth > innerWidth, casses, ratios, cas };
    });
    // capture pleine page : on fait défiler la page d'abord (sinon Chromium ne peint pas les photos hors de l'écran)
    await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } scrollTo(0, 0); });
    await page.waitForTimeout(500);
    const nom = `${o}-${w}${photo !== 'actuelles' ? '-' + photo : ''}`;
    if (w === 390) await page.screenshot({ path: path.join(OUT, `${nom}-page.jpg`), fullPage: true, type: 'jpeg', quality: 82 });
    else {
      await page.screenshot({ path: path.join(OUT, `${nom}.jpg`), clip: { x: 0, y: info.top - 40, width: w, height: info.height + 80 }, fullPage: true, type: 'jpeg', quality: 82 });
      if (w === 1521) await page.screenshot({ path: path.join(OUT, `${nom}-page.jpg`), fullPage: true, type: 'jpeg', quality: 82 });
    }
    console.log(nom, `mosaïque ${Math.round(info.height)} px`, info.debordement ? 'DÉBORDEMENT' : 'ok', info.casses.length ? 'IMAGES EN ÉCHEC ' + info.casses : '',
      info.cas.some(c => c.debord) ? 'TEXTE ROGNÉ ' + JSON.stringify(info.cas) : '');
    if (w === 1521) console.log('  ', info.ratios.map(r => `${r.nom} ${r.w}×${r.h} (${Math.round(r.garde * 100)} %)`).join(' · '), '\n   cases', JSON.stringify(info.cas));
  }
  await page.close();
}
// une tuile au survol, option a, à 1 521 px
const p = await browser.newPage({ viewport: { width: 1521, height: 705 } });
await p.goto(`${PAGE}?option=${options[0]}&photo=${photo}&panneau=off`);
const t = p.locator(`.mos[data-option="${options[0]}"] .tuile`).nth(1);
await t.scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
await t.hover(); await p.waitForTimeout(700);
const bb = await t.boundingBox();
await p.screenshot({ path: path.join(OUT, `survol-${options[0]}.jpg`), clip: { x: Math.max(0, bb.x - 300), y: bb.y - 20, width: Math.min(1521, bb.width + 600), height: bb.height + 40 }, type: 'jpeg', quality: 82 });
await browser.close();
