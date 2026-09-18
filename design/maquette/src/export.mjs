// Captures PNG des pages de la maquette (Playwright + Chromium), panneau masqué, roue immobile.
// Usage, depuis la racine du dépôt :
//   NODE_PATH=$(npm root -g) node design/maquette/src/export.mjs [options]
// Options :
//   --etat "serif=literata&or=touches"   la combinaison à capturer (défaut : valeurs par défaut)
//   --pages index,projet-the-bank,projets    (défaut : les pages présentes dans design/maquette/)
//   --formats 1440,1366,390                  (défaut : 1440,390) — 1440 × 900, 1366 × 703, 390 × 844
//   --out <dossier>                          (défaut : design/maquette/export/)
//   --echelle 2                              facteur de pixels (défaut 2)
//   --ecran                                  capture le premier écran seulement (sinon page entière)
// Playwright : `npm install -D playwright` à la racine, ou l'installation globale avec NODE_PATH.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)('playwright');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const MAQ = path.resolve(HERE, '..');
const FORMATS = { 1440: [1440, 900], 1366: [1366, 703], 390: [390, 844] };

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf('--' + name); return i !== -1 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : def; };
const etat = opt('etat', '');
const pages = opt('pages', ['index', 'projet-the-bank', 'projets'].filter(p => fs.existsSync(path.join(MAQ, p + '.html'))).join(',')).split(',');
const formats = opt('formats', '1440,390').split(',');
const out = path.resolve(opt('out', path.join(MAQ, 'export')));
const echelle = Number(opt('echelle', '2'));
const ecran = args.includes('--ecran');
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
for (const page of pages) {
  for (const f of formats) {
    const [w, h] = FORMATS[f];
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: echelle, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    const url = 'file://' + path.join(MAQ, page + '.html') + '?panneau=off' + (etat ? '&' + etat : '');
    await p.goto(url, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    // parcourir la page pour déclencher les images en chargement paresseux, puis revenir en haut
    await p.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } window.scrollTo(0, 0); });
    await p.waitForLoadState('networkidle');
    await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const deb = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (deb > 0) console.warn(`débordement horizontal de ${deb} px : ${page} à ${w}`);
    const file = path.join(out, `${page}-${f}${ecran ? '-ecran' : ''}.png`);
    await p.screenshot({ path: file, fullPage: !ecran });
    console.log('écrit', path.relative(process.cwd(), file));
    await ctx.close();
  }
}
await browser.close();
