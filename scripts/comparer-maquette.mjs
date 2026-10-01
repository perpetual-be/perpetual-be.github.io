// Compare le socle du site (lot 4) à la maquette, qui reste la référence : l'en-tête et le pied de page du site construit (dist/, servi par astro preview)
// et ceux de design/maquette/index.html?panneau=off (ouverte en file://), à 1521 × 705, 1920 × 1080 et 390 × 844, polices chargées, défilement à 0 —
//   · captures de .site-header et de .site-footer identiques au pixel près ; sinon le nombre de pixels différents et une image des écarts (en rouge)
//     dans scripts/ecarts/ (dossier ignoré par Git), avec les deux captures ;
//   · mêmes positions (getBoundingClientRect, au pixel) : logo, liens de la navigation, colonnes du pied de page, mail, citation ;
//   · en-tête collant : après un défilement vers le bas de 600 px il est hors de l'écran, après une remontée de 100 px il est revenu en haut de la fenêtre,
//     il revient quand le focus clavier entre dedans, et sous prefers-reduced-motion il n'y a pas de transition ;
//   · les polices viennent de /fonts/ (aucune requête hors du site), meta robots noindex sur / et /dev/photos, aucune erreur dans la console.
// Affiche « Tout est identique » quand tout passe (code de sortie 1 sinon).
// Usage, depuis la racine du dépôt, après npm run build : NODE_PATH=$(npm root -g) npm run comparer
// (Playwright global et Chromium de /opt/pw-browsers/chromium s'il existe, comme design/maquette/src/check.mjs ; sharp, déjà là, décode les PNG.)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import sharp from 'sharp';
import { preview } from 'astro';

let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); }
catch { console.error('Playwright introuvable : NODE_PATH=$(npm root -g) npm run comparer (cf. design/maquette/src/check.mjs)'); process.exit(2); }

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const ECARTS = path.join(HERE, 'ecarts');
const MAQUETTE = pathToFileURL(path.join(REPO, 'design/maquette/index.html')).href + '?panneau=off';
const FORMATS = [[1521, 705], [1920, 1080], [390, 844]];
const CHROMIUM_PREINSTALLE = '/opt/pw-browsers/chromium';
if (!fs.existsSync(path.join(REPO, 'dist/index.html'))) { console.error('dist/ introuvable : npm run build d\'abord'); process.exit(2); }

let ko = 0;
const ok = (cond, msg) => { console.log((cond ? '  ok  ' : '  KO  ') + msg); if (!cond) ko++; };
const fmt = ([w, h]) => `${w} × ${h}`;

// ---------- le site (astro preview sur dist/) et le navigateur ----------
const serveur = await preview({ root: REPO, logLevel: 'silent', server: { host: '127.0.0.1', port: 4399 } });
const SITE = `http://127.0.0.1:${serveur.port}`;
const browser = await chromium.launch(fs.existsSync(CHROMIUM_PREINSTALLE) ? { executablePath: CHROMIUM_PREINSTALLE } : {});

async function ouvrir(url, [w, h], options = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, ...options });
  const p = await ctx.newPage();
  const erreurs = [], requetes = [];   // erreurs de script et de console ; toutes les requêtes (polices comprises)
  p.on('pageerror', e => erreurs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') erreurs.push(m.text()); });
  p.on('request', r => requetes.push(r.url()));
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => window.scrollTo(0, 0));
  return { p, ctx, erreurs, requetes };
}
const rect = (p, sel) => p.evaluate(s => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, width: r.width, height: r.height }; }, sel);
// Boîtes des éléments (x absolu, y depuis le haut de la section `origine`, largeur, hauteur, au pixel) : « .site-nav a », « .site-nav a[2] »…
const boites = (p, sels, origine) => p.evaluate(([sels, origine]) => {
  const o = document.querySelector(origine).getBoundingClientRect(), r = {};
  for (const s of sels) document.querySelectorAll(s).forEach((el, i) => { const b = el.getBoundingClientRect(); r[s + (i ? `[${i + 1}]` : '')] = [Math.round(b.left), Math.round(b.top - o.top), Math.round(b.width), Math.round(b.height)]; });
  return r;
}, [sels, origine]);
function memesBoites(a, b, nom) {
  const ecarts = Object.keys({ ...a, ...b }).filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k])).map(k => `${k} : site ${JSON.stringify(a[k])} / maquette ${JSON.stringify(b[k])}`);
  ok(!ecarts.length, `${nom} : mêmes positions (${Object.keys(a).length} boîtes, x absolu, y depuis le haut de la section)` + (ecarts.length ? ' — ' + ecarts.join(' ; ') : ''));
}
// Le pied de page n'est pas à la même hauteur dans les deux pages (contenus différents) : son haut peut tomber sur un sous-pixel d'un côté et pas de l'autre,
// et le rendu des textes et des filets en dépend (arrondi au pixel). Pour comparer les captures, on fait défiler jusqu'en bas, on laisse la page se
// stabiliser (les images paresseuses de la maquette l'allongent), puis on cale le haut du pied de page sur un pixel entier (un padding de moins d'un
// pixel sous <main>) et on redescend : le pied de page est entier dans la fenêtre, à une position entière, des deux côtés.
async function preparerPied(p) {
  for (let i = 0; i < 4; i++) {
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(400);   // l'en-tête collant du site a le temps de se cacher (transition de 0,3 s)
    const entier = await p.evaluate(() => {
      const main = document.querySelector('main'), haut = document.querySelector('.site-footer').getBoundingClientRect().top + window.scrollY, reste = Math.ceil(haut) - haut;
      if (reste > 0) main.style.paddingBottom = ((parseFloat(main.style.paddingBottom) || 0) + reste) + 'px';
      return reste === 0 && Number.isInteger(window.scrollY);
    });
    if (entier) return true;
  }
  return false;
}
const capture = (p, sel) => p.locator(sel).screenshot({ type: 'png', animations: 'disabled' });

// Compare deux PNG pixel par pixel ; en cas d'écart, écrit les deux captures et l'image des écarts (pixels différents en rouge sur le site pâli).
async function comparer(nom, site, maquette) {
  const A = await sharp(site).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const B = await sharp(maquette).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const taille = `${A.info.width} × ${A.info.height}`;
  let differents = 0, detail = '';
  if (A.info.width !== B.info.width || A.info.height !== B.info.height) { differents = -1; detail = `tailles différentes : site ${taille}, maquette ${B.info.width} × ${B.info.height}`; }
  else {
    const n = A.info.width * A.info.height, ecarts = Buffer.alloc(n * 4);
    for (let i = 0; i < n; i++) {
      const o = i * 4;
      if (A.data[o] === B.data[o] && A.data[o + 1] === B.data[o + 1] && A.data[o + 2] === B.data[o + 2] && A.data[o + 3] === B.data[o + 3]) {
        const g = Math.round(255 - (255 - (A.data[o] * .299 + A.data[o + 1] * .587 + A.data[o + 2] * .114)) * .25);
        ecarts[o] = ecarts[o + 1] = ecarts[o + 2] = g; ecarts[o + 3] = 255;
      } else { differents++; ecarts[o] = 220; ecarts[o + 1] = 30; ecarts[o + 2] = 30; ecarts[o + 3] = 255; }
    }
    if (differents) {
      fs.mkdirSync(ECARTS, { recursive: true });
      await sharp(ecarts, { raw: { width: A.info.width, height: A.info.height, channels: 4 } }).png().toFile(path.join(ECARTS, `${nom}-ecarts.png`));
      detail = `${differents} pixel(s) différent(s) sur ${n} — scripts/ecarts/${nom}-ecarts.png`;
    }
  }
  if (differents) { fs.mkdirSync(ECARTS, { recursive: true }); fs.writeFileSync(path.join(ECARTS, `${nom}-site.png`), site); fs.writeFileSync(path.join(ECARTS, `${nom}-maquette.png`), maquette); }
  return { differents, taille, detail };
}

try {
  const ENTETE = ['.logo', '.logo__mark', '.logo__texte', '.site-nav', '.site-nav a'];
  const PIED = ['.site-footer > .container', '.footer__contact', '.footer__name', '.footer__mail', '.footer__addr', '.footer__nav', '.footer__nav a', '.footer__quote', '.footer__quote p', '.footer__quote cite', '.footer__legal'];
  for (const format of FORMATS) {
    console.log(`\n${fmt(format)}`);
    const site = await ouvrir(SITE + '/', format), maq = await ouvrir(MAQUETTE, format);
    const nom = `${format[0]}x${format[1]}`;
    ok(!maq.erreurs.length, `maquette ouverte sans erreur (${MAQUETTE.replace(/^.*design\//, 'design/')})` + (maq.erreurs.length ? ' — ' + maq.erreurs.join(' | ') : ''));

    // en-tête : captures et positions, défilement à 0
    const e = await comparer(`en-tete-${nom}`, await capture(site.p, '.site-header'), await capture(maq.p, '.site-header'));
    ok(e.differents === 0, `en-tête : capture de .site-header identique au pixel près (${e.taille})` + (e.differents ? ' — ' + e.detail : ''));
    memesBoites(await boites(site.p, ENTETE, '.site-header'), await boites(maq.p, ENTETE, '.site-header'), 'en-tête');

    // pied de page : captures et positions
    const bs = await boites(site.p, PIED, '.site-footer'), bm = await boites(maq.p, PIED, '.site-footer');
    ok((await preparerPied(site.p)) && (await preparerPied(maq.p)), 'pied de page : entier dans la fenêtre, haut calé sur un pixel entier des deux côtés (pour la capture)');
    const f = await comparer(`pied-${nom}`, await capture(site.p, '.site-footer'), await capture(maq.p, '.site-footer'));
    ok(f.differents === 0, `pied de page : capture de .site-footer identique au pixel près (${f.taille})` + (f.differents ? ' — ' + f.detail : ''));
    memesBoites(bs, bm, 'pied de page');

    // en-tête collant (site seulement) : la page est allongée pour pouvoir défiler
    await site.p.evaluate(() => { window.scrollTo(0, 0); document.querySelector('main').style.minHeight = '4000px'; });
    await site.p.waitForFunction(() => document.querySelector('.entete-collante').getBoundingClientRect().top === 0, null, { timeout: 2000 }).catch(() => {});   // il revient (0,3 s) si la page avait défilé
    const hauteur = (await rect(site.p, '.entete-collante')).height;
    const transition = await site.p.evaluate(() => getComputedStyle(document.querySelector('.entete-collante')).transitionDuration);
    ok((await rect(site.p, '.entete-collante')).top === 0 && hauteur === (await rect(site.p, '.site-header')).height && transition === '0.3s',
      `en-tête collant : en haut de la fenêtre au départ, ${hauteur} px de haut (celle de .site-header), transition de ${transition}`);
    await site.p.evaluate(() => window.scrollTo(0, 600));
    const cache = await site.p.waitForFunction(() => document.querySelector('.entete-collante').getBoundingClientRect().bottom <= 0, null, { timeout: 2000 }).then(() => true, () => false);
    ok(cache, `en-tête collant : hors de l'écran après un défilement de 600 px vers le bas (bas à ${(await rect(site.p, '.entete-collante')).bottom} px)`);
    await site.p.evaluate(() => window.scrollTo(0, 500));
    const revenu = await site.p.waitForFunction(() => document.querySelector('.entete-collante').getBoundingClientRect().top === 0, null, { timeout: 2000 }).then(() => true, () => false);
    const r1 = await rect(site.p, '.entete-collante');
    ok(revenu && r1.top === 0 && r1.height === hauteur && (await site.p.evaluate(() => window.scrollY)) === 500, `en-tête collant : revenu en haut de la fenêtre après une remontée de 100 px (haut à ${r1.top} px, défilement ${await site.p.evaluate(() => window.scrollY)})`);
    await site.p.evaluate(() => window.scrollTo(0, 1200));
    await site.p.waitForFunction(() => document.querySelector('.entete-collante').getBoundingClientRect().bottom <= 0, null, { timeout: 2000 }).catch(() => {});
    await site.p.evaluate(() => document.querySelector('.entete-collante').dispatchEvent(new FocusEvent('focusin', { bubbles: true })));
    const focus = await site.p.waitForFunction(() => document.querySelector('.entete-collante').getBoundingClientRect().top === 0, null, { timeout: 2000 }).then(() => true, () => false);
    ok(focus, 'en-tête collant : caché après un nouveau défilement vers le bas, il revient quand le focus clavier entre dedans');
    const liens = await site.p.evaluate(() => [...document.querySelectorAll('.site-nav a')].map(a => `${a.textContent} → ${a.getAttribute('href')}${a.classList.contains('is-active') ? ' (actif)' : ''}`).join(' · '));
    ok(liens === 'Réalisations → /realisations · Engagements → /engagements · Contact → #contact' && (await site.p.evaluate(() => document.querySelector('.logo').getAttribute('href') + ' ' + document.querySelector('.logo').getAttribute('aria-label'))) === '/ Perpetual — accueil',
      `navigation : ${liens} ; logo vers / (« Perpetual — accueil »), aucun lien actif sur la Home`);

    // mouvement réduit : l'en-tête se cache et revient sans transition
    const reduit = await ouvrir(SITE + '/', format, { reducedMotion: 'reduce' });
    await reduit.p.evaluate(() => { document.querySelector('main').style.minHeight = '4000px'; window.scrollTo(0, 600); });
    await reduit.p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const tr = await reduit.p.evaluate(() => getComputedStyle(document.querySelector('.entete-collante')).transitionDuration);
    const basReduit = (await rect(reduit.p, '.entete-collante')).bottom;
    await reduit.p.evaluate(() => window.scrollTo(0, 500));
    await reduit.p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const hautReduit = (await rect(reduit.p, '.entete-collante')).top;
    ok(tr === '0s' && basReduit <= 0 && hautReduit === 0, `en-tête collant, prefers-reduced-motion : pas de transition (${tr}), caché puis revenu sans glisser (bas ${basReduit}, haut ${hautReduit})`);
    await reduit.ctx.close();

    // polices et requêtes, noindex, console
    // les polices utilisées par la page sont chargées (Jost ne sert qu'au wordmark, masqué au téléphone) et tous les fichiers viennent de /fonts/
    const polices = await site.p.evaluate(w => ({ ok: ['400 17px "Instrument Sans"', 'italic 400 22px Newsreader'].concat(w > 640 ? ['400 27.7px Jost'] : []).every(f => document.fonts.check(f)), etat: document.fonts.status, chargees: [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family))].join(', ') }), format[0]);
    const woff = site.requetes.filter(u => u.endsWith('.woff2')).map(u => u.replace(/^.*\//, '')), hors = site.requetes.filter(u => !u.startsWith(SITE + '/'));
    const prechargees = ['instrument-sans-latin-wght-normal.woff2', 'newsreader-latin-opsz-normal.woff2', 'jost-latin-wght-normal.woff2'].every(f => woff.includes(f));
    ok(polices.ok && polices.etat === 'loaded' && prechargees && site.requetes.filter(u => u.endsWith('.woff2')).every(u => u.startsWith(SITE + '/fonts/')) && !hors.length,
      `polices : ${polices.chargees} chargées, ${woff.length} fichiers woff2 depuis /fonts/ (les trois préchargées comprises), aucune requête hors du site (${site.requetes.length} requêtes)` + (hors.length ? ' — HORS SITE : ' + hors.join(', ') : ''));
    ok((await site.p.evaluate(() => document.querySelector('meta[name="robots"]')?.getAttribute('content'))) === 'noindex', 'meta robots noindex sur /');
    ok(!site.erreurs.length, 'aucune erreur dans la console sur /' + (site.erreurs.length ? ' — ' + site.erreurs.join(' | ') : ''));
    await site.ctx.close(); await maq.ctx.close();
  }

  console.log('\n/dev/photos');
  const dev = await ouvrir(SITE + '/dev/photos', FORMATS[0]);
  ok((await dev.p.evaluate(() => document.querySelector('meta[name="robots"]')?.getAttribute('content'))) === 'noindex', 'meta robots noindex sur /dev/photos');
  ok(!dev.erreurs.length, 'aucune erreur dans la console sur /dev/photos' + (dev.erreurs.length ? ' — ' + dev.erreurs.join(' | ') : ''));
  ok(dev.requetes.every(u => u.startsWith(SITE + '/')) && (await dev.p.evaluate(() => !!document.querySelector('.entete-collante .site-header') && !!document.querySelector('.site-footer#contact'))), 'en-tête collant et pied de page présents, aucune requête hors du site');
  await dev.ctx.close();
} finally {
  await browser.close();
  await serveur.stop();
}

console.log(ko ? `\n${ko} écart(s)` : '\nTout est identique');
process.exit(ko ? 1 : 0);
