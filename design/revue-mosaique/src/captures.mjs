// Captures de la page de travail v4 (Cowork, 04/10 vers minuit) : les combinaisons du panneau à 1 521 px (écran d'Axel), quelques-unes à 1 920 et 390 px.
// Contrôles : aucune image en échec, aucun débordement horizontal, aucun texte rogné dans les cases, hauteur égale des cases d'une rangée.
// NODE_PATH=$(npm root -g) node design/revue-mosaique/src/captures.mjs   (Playwright, comme check.mjs)
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const REPO = process.cwd();
const PAGE = 'file://' + path.join(REPO, 'design/revue-mosaique/propositions/mosaique.html');
const OUT = path.join(REPO, 'design/revue-mosaique/captures-v4');
fs.mkdirSync(OUT, { recursive: true });
const CAS = [
  // [nom, état, largeur, hauteur, zone] — v4 : plus de panneau, l'état par défaut est écrit dans <html>
  ['projets', '', 1521, 705, 'projets'],
  ['agences', '', 1521, 705, 'bas'],
  ['projets-1920', '', 1920, 1080, 'projets'],
  ['agences-1920', '', 1920, 1080, 'bas'],
  ['page-1521', '', 1521, 705, 'page'],
  ['page-390', '', 390, 844, 'page'],
];
const browser = await chromium.launch();
for (const [nom, etat, w, h, zone] of CAS) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: w === 390 ? 2 : 1 });
  const erreurs = []; page.on('pageerror', e => erreurs.push(e.message));
  await page.goto(`${PAGE}?${etat}&panneau=off`);
  await page.evaluate(async () => { await document.fonts.ready; for (const i of document.images) { i.loading = 'eager'; i.decoding = 'sync'; } });
  await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) { scrollTo(0, y); await new Promise(r => setTimeout(r, 100)); } scrollTo(0, 0); });
  await page.waitForFunction(() => [...document.images].filter(i => i.offsetParent).every(i => i.complete));
  await page.waitForTimeout(400);
  const info = await page.evaluate(zone => {
    const vis = el => el && getComputedStyle(el).display !== 'none' && el.offsetParent !== null;
    const mos = [...document.querySelectorAll('.mos')].find(vis);
    const rangs = [...mos.querySelectorAll('.mos__rang')].map(r => {
      const hs = [...r.children].map(c => Math.round(c.getBoundingClientRect().height));
      return { n: r.children.length, h: hs[0], egales: Math.max(...hs) - Math.min(...hs) <= 1, l: [...r.children].map(c => Math.round(c.getBoundingClientRect().width)) };
    });
    const rognes = [...mos.querySelectorAll('.cas__in')].filter(c => c.scrollHeight > c.clientHeight + 1).map(c => c.textContent.slice(0, 30));
    const casses = [...document.images].filter(i => i.offsetParent && i.naturalWidth === 0).map(i => i.src.split('/').pop());
    let haut, bas;
    if (zone === 'projets') { const p = document.querySelector('#projets').getBoundingClientRect(); haut = p.top; bas = mos.getBoundingClientRect().top + 320; }
    else { haut = document.querySelector('#projets').getBoundingClientRect().bottom + 10; bas = document.querySelector('.site-footer').getBoundingClientRect().top; }
    return { haut: haut + scrollY, bas: bas + scrollY, rangs, rognes, casses, debord: document.documentElement.scrollWidth > innerWidth, mosH: Math.round(mos.getBoundingClientRect().height) };
  }, zone);
  const opts = { path: path.join(OUT, `${nom}.jpg`), type: 'jpeg', quality: 82, fullPage: true };
  if (zone !== 'page') opts.clip = { x: 0, y: info.haut, width: w, height: info.bas - info.haut };
  await page.screenshot(opts);
  console.log(nom.padEnd(22), `mosaïque ${info.mosH} px`, info.debord ? 'DÉBORDEMENT' : '', info.casses.length ? 'IMAGES EN ÉCHEC ' + info.casses : '',
    info.rognes.length ? 'TEXTE ROGNÉ ' + info.rognes : '', erreurs.length ? 'ERREURS ' + erreurs : '',
    w > 640 ? '\n   ' + info.rangs.map(r => `${r.n} cases, ${r.h} px${r.egales ? '' : ' (HAUTEURS INÉGALES)'} [${r.l.join(' ')}]`).join('\n   ') : '');
  await page.close();
}
// survol d'une tuile et de Brosse
const p = await browser.newPage({ viewport: { width: 1521, height: 705 } });
await p.goto(PAGE);
for (const [sel, nom] of [['.mos__rang--3 .tuile', 'survol-tuile'], ['.projets-var[data-projets="221"] .bloc--album', 'survol-brosse']]) {
  const t = p.locator(sel).first(); await t.scrollIntoViewIfNeeded(); await p.waitForTimeout(400); await t.hover(); await p.waitForTimeout(700);
  const bb = await t.boundingBox();
  await p.screenshot({ path: path.join(OUT, `${nom}.jpg`), type: 'jpeg', quality: 82, clip: { x: Math.max(0, bb.x - 20), y: Math.max(0, bb.y - 20), width: Math.min(1521 - Math.max(0, bb.x - 20), bb.width + 40), height: bb.height + 40 } });
}
await browser.close();
