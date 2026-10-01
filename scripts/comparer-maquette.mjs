// Compare le site construit (dist/, servi par astro preview) à la maquette, qui reste la référence — design/maquette/index.html?panneau=off, ouverte en
// file:// —, à 1521 × 705, 1920 × 1080 et 390 × 844, polices chargées, les captures sous prefers-reduced-motion (anneau plein des deux côtés) :
//   · le socle (lot 4, message 1) : captures de .site-header et de .site-footer identiques au pixel près, mêmes positions (logo, liens, colonnes, mail,
//     citation) ; en-tête collant (hors de l'écran après 600 px vers le bas, revenu après 100 px vers le haut, retour au focus clavier, pas de transition
//     en mouvement réduit) ; polices depuis /fonts/, aucune requête hors du site, meta robots noindex sur / et /dev/photos, console vide ;
//   · la Home (lot 4, message 2) : même hauteur totale de page ; captures identiques au pixel près de .stats-band, .hero__text, .section--chart,
//     .section--autres et .section--collectif (défilement à 0, puis section par section) ; mêmes positions (accroche, chiffres, paragraphes, signature,
//     anneau, légende, carte et étiquettes, logos) ; photo du premier écran — même boîte, même cadrage (object-position, object-fit cover), version servie
//     jamais agrandie à 1× et la plus grande à 2×, capture comparée avec une tolérance de compression (l'AVIF du site n'est pas le JPEG de la maquette :
//     l'écart moyen par canal doit rester faible), l'accroche en blanc dessus identique au pixel près une fois la photo masquée ; le remplissage de l'anneau
//     sans réduire les animations : vide avant l'arrivée à l'écran, encore vide quand la section est à moitié visible mais l'anneau coupé par le bas de la
//     fenêtre (retouche du 01/10 : il démarre quand l'anneau est entièrement à l'écran), en cours à 500 ms, plein à 2,3 s.
// En cas d'écart sur une capture : le nombre de pixels différents et une image des écarts (en rouge) dans scripts/ecarts/ (dossier ignoré par Git), avec
// les deux captures. Affiche « Tout est identique » quand tout passe (code de sortie 1 sinon).
// Usage, depuis la racine du dépôt, après npm run build : NODE_PATH=$(npm root -g) npm run comparer
// (Playwright global et Chromium de /opt/pw-browsers/chromium s'il existe, comme design/maquette/src/check.mjs ; sharp, déjà là, décode PNG, AVIF et JPEG.)
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
const TOLERANCE_PHOTO = 4;   // écart moyen par canal (sur 255) admis entre l'AVIF du site et le JPEG de la maquette, dans la zone de la photo du premier écran
if (!fs.existsSync(path.join(REPO, 'dist/index.html'))) { console.error('dist/ introuvable : npm run build d\'abord'); process.exit(2); }

let ko = 0;
const ok = (cond, msg) => { console.log((cond ? '  ok  ' : '  KO  ') + msg); if (!cond) ko++; };
const fmt = ([w, h]) => `${w} × ${h}`;
const slug = s => s.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');

// ---------- le site (astro preview sur dist/) et le navigateur ----------
const serveur = await preview({ root: REPO, logLevel: 'silent', server: { host: '127.0.0.1', port: 4399 } });
const SITE = `http://127.0.0.1:${serveur.port}`;
// --disable-partial-raster : sans lui, Chromium ne retrame que la partie invalidée d'une tuile ; la photo du premier écran (AVIF côté site, JPEG côté
// maquette) n'arrivant pas au même moment, un bord anticrénelé voisin (les anneaux de la bande, première ligne) pouvait différer de 1/255 une fois sur deux.
const browser = await chromium.launch({ args: ['--disable-partial-raster'], ...(fs.existsSync(CHROMIUM_PREINSTALLE) ? { executablePath: CHROMIUM_PREINSTALLE } : {}) });

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
const haut = p => p.evaluate(() => window.scrollTo(0, 0));
// Boîtes des éléments ([x, y, largeur, hauteur] au pixel ; y depuis le haut de la section `origine`, ou depuis le haut du document) : « .site-nav a », « .site-nav a[2] »…
const boites = (p, sels, origine) => p.evaluate(([sels, origine]) => {
  const o = origine ? document.querySelector(origine).getBoundingClientRect().top : -window.scrollY, r = {};
  for (const s of sels) document.querySelectorAll(s).forEach((el, i) => { const b = el.getBoundingClientRect(); r[s + (i ? `[${i + 1}]` : '')] = [Math.round(b.left), Math.round(b.top - o), Math.round(b.width), Math.round(b.height)]; });
  return r;
}, [sels, origine]);
function memesBoites(a, b, nom, ou) {
  const ecarts = Object.keys({ ...a, ...b }).filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k])).map(k => `${k} : site ${JSON.stringify(a[k])} / maquette ${JSON.stringify(b[k])}`);
  ok(!ecarts.length, `${nom} : mêmes positions (${Object.keys(a).length} boîtes, x absolu, y depuis ${ou})` + (ecarts.length ? ' — ' + ecarts.slice(0, 6).join(' ; ') + (ecarts.length > 6 ? ` ; … ${ecarts.length} écarts` : '') : ''));
}
// Une zone amenée à l'écran, ses images chargées (les paresseuses comprises), deux rendus plus tard.
async function amener(p, sel) {
  await p.evaluate(async s => {
    const zone = document.querySelector(s);
    zone.scrollIntoView({ block: 'start' });
    const imgs = [...zone.querySelectorAll('img')];
    await Promise.all(imgs.map(i => (i.complete && i.naturalWidth) ? null : Promise.race([new Promise(r => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); }), new Promise(r => setTimeout(r, 5000))])));
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, sel);
  await p.waitForTimeout(350);   // l'en-tête collant du site a le temps de se cacher (transition de 0,3 s) : il ne recouvre pas la zone
}
// Le pied de page n'est pas forcément à la même hauteur dans les deux pages : son haut peut tomber sur un sous-pixel d'un côté et pas de l'autre, et le
// rendu des textes et des filets en dépend (arrondi au pixel). Pour comparer les captures, on fait défiler jusqu'en bas, on laisse la page se stabiliser,
// puis on cale le haut du pied de page sur un pixel entier (un padding de moins d'un pixel sous <main>) et on redescend : le pied de page est entier dans
// la fenêtre, à une position entière, des deux côtés. (Sur la Home, les deux pages ont la même mise en page : le padding ajouté est le même des deux côtés.)
async function preparerPied(p) {
  for (let i = 0; i < 4; i++) {
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(400);
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
// Une section, capturée dans la fenêtre (recadrage), par tranches de la hauteur de la fenêtre recollées si elle est plus haute — pas une capture d'élément :
// celle-ci retrame la zone, et sur un bord anticrénelé voisin de la photo du premier écran (AVIF côté site, JPEG côté maquette) le rendu peut différer
// de 1/255 ; la fenêtre, elle, est capturée telle qu'elle est composée. La section est amenée en haut de la fenêtre, ses images chargées.
async function captureSection(p, sel) {
  const vh = p.viewportSize().height;
  await amener(p, sel);
  const z = await p.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return { top: r.top + window.scrollY, left: r.left, width: r.width, height: r.height }; }, sel);
  const tranches = [];
  for (let y = 0; y < z.height - 0.01; y += vh) {
    await p.evaluate(t => window.scrollTo(0, t), z.top + y);
    await p.waitForTimeout(100);
    const haut = z.top + y - (await p.evaluate(() => window.scrollY));   // 0, sauf en fin de page où le défilement est borné
    const h = Math.min(vh - haut, z.height - y);
    tranches.push(await p.screenshot({ type: 'png', animations: 'disabled', clip: { x: z.left, y: haut, width: z.width, height: h } }));
  }
  if (tranches.length === 1) return tranches[0];
  const metas = await Promise.all(tranches.map(t => sharp(t).metadata()));
  let top = 0;
  const couches = tranches.map((t, i) => { const c = { input: t, top, left: 0 }; top += metas[i].height; return c; });
  return sharp({ create: { width: metas[0].width, height: top, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(couches).png().toBuffer();
}
const captureZone = (p, b) => p.screenshot({ type: 'png', animations: 'disabled', clip: { x: b.left, y: b.top, width: b.width, height: b.height } });

// Deux PNG décodés en RGBA ; null si les tailles diffèrent.
async function decoder(a, b) {
  const A = await sharp(a).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const B = await sharp(b).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { A, B, memeTaille: A.info.width === B.info.width && A.info.height === B.info.height, taille: `${A.info.width} × ${A.info.height}`, tailleB: `${B.info.width} × ${B.info.height}` };
}
function garder(nom, site, maquette) { fs.mkdirSync(ECARTS, { recursive: true }); fs.writeFileSync(path.join(ECARTS, `${nom}-site.png`), site); fs.writeFileSync(path.join(ECARTS, `${nom}-maquette.png`), maquette); }
// Compare deux PNG pixel par pixel ; en cas d'écart, écrit les deux captures et l'image des écarts (pixels différents en rouge sur le site pâli).
async function comparer(nom, site, maquette) {
  const { A, B, memeTaille, taille, tailleB } = await decoder(site, maquette);
  if (!memeTaille) { garder(nom, site, maquette); return { differents: -1, taille, detail: `tailles différentes : site ${taille}, maquette ${tailleB}` }; }
  const n = A.info.width * A.info.height, ecarts = Buffer.alloc(n * 4);
  let differents = 0;
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    if (A.data[o] === B.data[o] && A.data[o + 1] === B.data[o + 1] && A.data[o + 2] === B.data[o + 2] && A.data[o + 3] === B.data[o + 3]) {
      const g = Math.round(255 - (255 - (A.data[o] * .299 + A.data[o + 1] * .587 + A.data[o + 2] * .114)) * .25);
      ecarts[o] = ecarts[o + 1] = ecarts[o + 2] = g; ecarts[o + 3] = 255;
    } else { differents++; ecarts[o] = 220; ecarts[o + 1] = 30; ecarts[o + 2] = 30; ecarts[o + 3] = 255; }
  }
  let detail = '';
  if (differents) {
    garder(nom, site, maquette);
    await sharp(ecarts, { raw: { width: A.info.width, height: A.info.height, channels: 4 } }).png().toFile(path.join(ECARTS, `${nom}-ecarts.png`));
    detail = `${differents} pixel(s) différent(s) sur ${n} — scripts/ecarts/${nom}-ecarts.png`;
  }
  return { differents, taille, detail };
}
// Écart moyen par canal (R, V, B, sur 255) entre deux captures de même taille : la photo du premier écran, AVIF contre JPEG.
async function ecartMoyen(nom, site, maquette) {
  const { A, B, memeTaille, taille, tailleB } = await decoder(site, maquette);
  if (!memeTaille) { garder(nom, site, maquette); return { ok: false, taille, detail: `tailles différentes : site ${taille}, maquette ${tailleB}` }; }
  const n = A.info.width * A.info.height, somme = [0, 0, 0];
  for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) somme[c] += Math.abs(A.data[i * 4 + c] - B.data[i * 4 + c]);
  const moyennes = somme.map(s => +(s / n).toFixed(2)), max = Math.max(...moyennes);
  if (max > TOLERANCE_PHOTO) garder(nom, site, maquette);
  return { ok: max <= TOLERANCE_PHOTO, taille, moyennes, detail: `écart moyen R ${moyennes[0]}, V ${moyennes[1]}, B ${moyennes[2]} sur 255 (tolérance ${TOLERANCE_PHOTO})` };
}
// Dimensions du fichier servi pour la photo du premier écran : le site (fetch sur astro preview : AVIF, WebP ou JPEG) ou la maquette (fichier en file://).
async function tailleServie(url) {
  const buf = url.startsWith('file:') ? fs.readFileSync(fileURLToPath(url)) : Buffer.from(await (await fetch(url)).arrayBuffer());
  const m = await sharp(buf).metadata();
  return { largeur: m.width, hauteur: m.height, format: m.format, nom: url.replace(/^.*\//, '').replace(/\?.*$/, '') };
}
const infosPhoto = p => p.evaluate(() => {
  const z = document.querySelector('.hero__photo'), i = z.querySelector('img'), b = z.getBoundingClientRect(), bi = i.getBoundingClientRect(), s = getComputedStyle(i);
  return { boite: { left: b.left, top: b.top, width: b.width, height: b.height }, img: [Math.round(bi.left), Math.round(bi.top), Math.round(bi.width), Math.round(bi.height)], position: s.objectPosition, fit: s.objectFit, src: i.currentSrc, w: bi.width, h: bi.height };
});
const masquerPhoto = (p, oui) => p.evaluate(m => { let st = document.getElementById('masque-photo'); if (m && !st) { st = document.createElement('style'); st.id = 'masque-photo'; st.textContent = '.hero__photo img{visibility:hidden}'; document.head.appendChild(st); } if (!m && st) st.remove(); }, oui);
const dasharrays = p => p.evaluate(() => [...document.querySelectorAll('.graph__part')].map(c => ({ l: parseFloat(c.style.getPropertyValue('--l')), v: parseFloat(getComputedStyle(c).strokeDasharray) })));

try {
  const ENTETE = ['.logo', '.logo__mark', '.logo__texte', '.site-nav', '.site-nav a'];
  const PIED = ['.site-footer > .container', '.footer__contact', '.footer__name', '.footer__mail', '.footer__addr', '.footer__nav', '.footer__nav a', '.footer__quote', '.footer__quote p', '.footer__quote cite', '.footer__legal'];
  const SECTIONS = ['.stats-band', '.hero__text', '.section--chart', '.section--autres', '.section--collectif'];
  const HOME = ['.hero__photo', '.hero__title', '.hero__title span', '.stats-band', '.stat', '.stat__value', '.stat__label', '.hero__text', '.hero__text>p', '.hero__col p', '.signature',
    '.section--chart', '.section--chart .h2', '.graph__svg', '.graph__legende li', '.graph__val', '.section--autres', '.section--autres .eyebrow', '.carte__svg', '.carte__lieu', '.carte__lab',
    '.carte__texte .h2', '.carte__texte p', '.autres__lien', '.section--collectif', '.section--collectif .eyebrow', '.collectif__text p', '.chute', '.partners', '.partner', '.partner__couleur'];
  for (const format of FORMATS) {
    console.log(`\n${fmt(format)}`);
    const nom = `${format[0]}x${format[1]}`;
    // les captures : sous prefers-reduced-motion, l'anneau est plein des deux côtés et rien ne bouge
    const site = await ouvrir(SITE + '/', format, { reducedMotion: 'reduce' }), maq = await ouvrir(MAQUETTE, format, { reducedMotion: 'reduce' });
    ok(!maq.erreurs.length, `maquette ouverte sans erreur (${MAQUETTE.replace(/^.*design\//, 'design/')})` + (maq.erreurs.length ? ' — ' + maq.erreurs.join(' | ') : ''));

    // en-tête : captures et positions, défilement à 0
    const e = await comparer(`en-tete-${nom}`, await capture(site.p, '.site-header'), await capture(maq.p, '.site-header'));
    ok(e.differents === 0, `en-tête : capture de .site-header identique au pixel près (${e.taille})` + (e.differents ? ' — ' + e.detail : ''));
    memesBoites(await boites(site.p, ENTETE, '.site-header'), await boites(maq.p, ENTETE, '.site-header'), 'en-tête', 'le haut de la section');

    // Home : la même hauteur totale de page
    const hauteurDe = p => p.evaluate(() => ({ defilement: document.documentElement.scrollHeight, corps: document.body.getBoundingClientRect().height }));
    const hs = await hauteurDe(site.p), hm = await hauteurDe(maq.p);
    ok(hs.defilement === hm.defilement && Math.abs(hs.corps - hm.corps) < 0.01, `Home : même hauteur totale de page (site ${hs.defilement} px, maquette ${hm.defilement} px ; corps ${hs.corps} / ${hm.corps})`);

    // les sections, une à une (amenées à l'écran, images chargées)
    for (const sel of SECTIONS) {
      const c = await comparer(`${slug(sel)}-${nom}`, await captureSection(site.p, sel), await captureSection(maq.p, sel));
      ok(c.differents === 0, `${sel} : capture identique au pixel près (${c.taille})` + (c.differents ? ' — ' + c.detail : ''));
    }
    // positions, dans le document, défilement à 0
    await haut(site.p); await haut(maq.p); await site.p.waitForTimeout(350);
    memesBoites(await boites(site.p, HOME, null), await boites(maq.p, HOME, null), 'Home', 'le haut du document');
    const anneau = await site.p.evaluate(() => { const g = document.querySelector('.graph'), parts = [...document.querySelectorAll('.graph__part')]; return { aRemplir: g.classList.contains('a-remplir'), pleines: parts.every(c => Math.abs(parseFloat(getComputedStyle(c).strokeDasharray) - parseFloat(c.style.getPropertyValue('--l'))) < 0.01), n: parts.length, legende: [...document.querySelectorAll('.graph__legende li')].map(li => [...li.querySelectorAll('span')].map(e => e.textContent).filter(Boolean).join(' ')).join(' · ') }; });
    ok(!anneau.aRemplir && anneau.pleines && anneau.n === 3, `graphique, prefers-reduced-motion : l'anneau est plein d'emblée (${anneau.n} parts à leur longueur, pas de .a-remplir) — ${anneau.legende}`);

    // pied de page : positions (défilement à 0) puis captures (calées sur un pixel entier)
    const bs = await boites(site.p, PIED, '.site-footer'), bm = await boites(maq.p, PIED, '.site-footer');
    ok((await preparerPied(site.p)) && (await preparerPied(maq.p)), 'pied de page : entier dans la fenêtre, haut calé sur un pixel entier des deux côtés (pour la capture)');
    const f = await comparer(`pied-${nom}`, await capture(site.p, '.site-footer'), await capture(maq.p, '.site-footer'));
    ok(f.differents === 0, `pied de page : capture de .site-footer identique au pixel près (${f.taille})` + (f.differents ? ' — ' + f.detail : ''));
    memesBoites(bs, bm, 'pied de page', 'le haut de la section');

    // photo du premier écran, en dernier (masquer la photo puis la démasquer fait re-tramer des tuiles : à ±1/255 près sur un bord anticrénelé — rien ne se
    // capture après) : boîte et cadrage, version servie, écart de compression, puis l'accroche photo masquée
    await amener(site.p, '.hero__photo'); await amener(maq.p, '.hero__photo'); await haut(site.p); await haut(maq.p); await site.p.waitForTimeout(350);
    const ps = await infosPhoto(site.p), pm = await infosPhoto(maq.p);
    ok(JSON.stringify(ps.boite) === JSON.stringify(pm.boite) && JSON.stringify(ps.img) === JSON.stringify(pm.img) && ps.position === '50% 20%' && pm.position === '50% 20%' && ps.fit === 'cover' && pm.fit === 'cover',
      `photo du premier écran : même boîte (${Math.round(ps.boite.width)} × ${Math.round(ps.boite.height)} à y = ${Math.round(ps.boite.top)}), même cadrage (object-position ${ps.position} / ${pm.position}, object-fit ${ps.fit} / ${pm.fit})`);
    const ts = await tailleServie(ps.src), tm = await tailleServie(pm.src), echelle = +Math.max(ps.w / ts.largeur, ps.h / ts.hauteur).toFixed(3);
    ok(ts.largeur >= format[0] && echelle <= 1 && tm.largeur >= format[0], `photo du premier écran : ${ts.nom} (${ts.format} ${ts.largeur} × ${ts.hauteur}) servi par le site, jamais agrandi à 1× (échelle ${echelle}) ; maquette : ${tm.nom} (${tm.largeur} × ${tm.hauteur})`);
    const ph = await ecartMoyen(`photo-${nom}`, await captureZone(site.p, ps.boite), await captureZone(maq.p, pm.boite));
    ok(ph.ok, `photo du premier écran : capture de .hero__photo (${ph.taille}) comparée avec tolérance — ${ph.detail}`);
    await masquerPhoto(site.p, true); await masquerPhoto(maq.p, true);
    const ac = await comparer(`accroche-${nom}`, await captureZone(site.p, ps.boite), await captureZone(maq.p, pm.boite));
    ok(ac.differents === 0, `accroche : la zone de la photo (${ac.taille}), photo masquée, identique au pixel près (le voile et l'accroche en blanc)` + (ac.differents ? ' — ' + ac.detail : ''));
    await masquerPhoto(site.p, false); await masquerPhoto(maq.p, false);

    // polices et requêtes, noindex, console (la page du site telle qu'elle s'est chargée)
    const polices = await site.p.evaluate(w => ({ ok: ['400 17px "Instrument Sans"', 'italic 400 22px Newsreader', '400 34px Newsreader'].concat(w > 640 ? ['400 27.7px Jost'] : []).every(f => document.fonts.check(f)), etat: document.fonts.status, chargees: [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family))].join(', ') }), format[0]);
    const woff = site.requetes.filter(u => u.endsWith('.woff2')).map(u => u.replace(/^.*\//, '')), hors = site.requetes.filter(u => !u.startsWith(SITE + '/'));
    const prechargees = ['instrument-sans-latin-wght-normal.woff2', 'newsreader-latin-opsz-normal.woff2', 'jost-latin-wght-normal.woff2'].every(f => woff.includes(f));
    ok(polices.ok && polices.etat === 'loaded' && prechargees && site.requetes.filter(u => u.endsWith('.woff2')).every(u => u.startsWith(SITE + '/fonts/')) && !hors.length,
      `polices : ${polices.chargees} chargées, ${woff.length} fichiers woff2 depuis /fonts/ (les trois préchargées comprises), aucune requête hors du site (${site.requetes.length} requêtes)` + (hors.length ? ' — HORS SITE : ' + hors.join(', ') : ''));
    ok((await site.p.evaluate(() => document.querySelector('meta[name="robots"]')?.getAttribute('content'))) === 'noindex', 'meta robots noindex sur /');
    ok(!site.erreurs.length, 'aucune erreur dans la console sur /' + (site.erreurs.length ? ' — ' + site.erreurs.join(' | ') : ''));
    await site.ctx.close(); await maq.ctx.close();

    // en-tête collant, sans réduire les animations : la page est allongée pour pouvoir défiler quelle que soit sa hauteur
    const normal = await ouvrir(SITE + '/', format);
    const avant = await dasharrays(normal.p), classesAvant = await normal.p.evaluate(() => ({ aRemplir: document.querySelector('.graph').classList.contains('a-remplir'), estRempli: document.querySelector('.graph').classList.contains('est-rempli') }));
    await normal.p.evaluate(() => { window.scrollTo(0, 0); document.querySelector('main').style.minHeight = '4000px'; });
    await normal.p.waitForFunction(() => document.querySelector('.entete-collante').getBoundingClientRect().top === 0, null, { timeout: 2000 }).catch(() => {});
    const hauteur = (await rect(normal.p, '.entete-collante')).height;
    const transition = await normal.p.evaluate(() => getComputedStyle(document.querySelector('.entete-collante')).transitionDuration);
    ok((await rect(normal.p, '.entete-collante')).top === 0 && hauteur === (await rect(normal.p, '.site-header')).height && transition === '0.3s',
      `en-tête collant : en haut de la fenêtre au départ, ${hauteur} px de haut (celle de .site-header), transition de ${transition}`);
    await normal.p.evaluate(() => window.scrollTo(0, 600));
    const cache = await normal.p.waitForFunction(() => document.querySelector('.entete-collante').getBoundingClientRect().bottom <= 0, null, { timeout: 2000 }).then(() => true, () => false);
    ok(cache, `en-tête collant : hors de l'écran après un défilement de 600 px vers le bas (bas à ${(await rect(normal.p, '.entete-collante')).bottom} px)`);
    await normal.p.evaluate(() => window.scrollTo(0, 500));
    const revenu = await normal.p.waitForFunction(() => document.querySelector('.entete-collante').getBoundingClientRect().top === 0, null, { timeout: 2000 }).then(() => true, () => false);
    const r1 = await rect(normal.p, '.entete-collante');
    ok(revenu && r1.top === 0 && r1.height === hauteur && (await normal.p.evaluate(() => window.scrollY)) === 500, `en-tête collant : revenu en haut de la fenêtre après une remontée de 100 px (haut à ${r1.top} px, défilement ${await normal.p.evaluate(() => window.scrollY)})`);
    await normal.p.evaluate(() => window.scrollTo(0, 1200));
    await normal.p.waitForFunction(() => document.querySelector('.entete-collante').getBoundingClientRect().bottom <= 0, null, { timeout: 2000 }).catch(() => {});
    await normal.p.evaluate(() => document.querySelector('.entete-collante').dispatchEvent(new FocusEvent('focusin', { bubbles: true })));
    const focus = await normal.p.waitForFunction(() => document.querySelector('.entete-collante').getBoundingClientRect().top === 0, null, { timeout: 2000 }).then(() => true, () => false);
    ok(focus, 'en-tête collant : caché après un nouveau défilement vers le bas, il revient quand le focus clavier entre dedans');
    const liens = await normal.p.evaluate(() => [...document.querySelectorAll('.site-nav a')].map(a => `${a.textContent} → ${a.getAttribute('href')}${a.classList.contains('is-active') ? ' (actif)' : ''}`).join(' · '));
    ok(liens === 'Réalisations → /realisations · Engagements → /engagements · Contact → #contact' && (await normal.p.evaluate(() => document.querySelector('.logo').getAttribute('href') + ' ' + document.querySelector('.logo').getAttribute('aria-label'))) === '/ Perpetual — accueil',
      `navigation : ${liens} ; logo vers / (« Perpetual — accueil »), aucun lien actif sur la Home`);
    ok((await normal.p.evaluate(() => document.title)) === 'Perpetual — Le trait d’union entre les idées et le capital.', `titre de l'onglet : « ${await normal.p.evaluate(() => document.title)} »`);
    await normal.ctx.close();

    // le remplissage de l'anneau, sans réduire les animations : vide avant l'arrivée à l'écran, en cours à 500 ms, plein à 2,3 s
    const rempl = await ouvrir(SITE + '/', format);
    const vide = await dasharrays(rempl.p), cl0 = await rempl.p.evaluate(() => ({ a: document.querySelector('.graph').classList.contains('a-remplir'), e: document.querySelector('.graph').classList.contains('est-rempli'), visible: document.querySelector('.section--chart').getBoundingClientRect().top < window.innerHeight / 2 }));
    ok(cl0.a && !cl0.e && !cl0.visible && vide.every(d => d.v === 0) && vide.length === 3, `remplissage : avant l'arrivée à l'écran, l'anneau est vide (.a-remplir, traits à ${vide.map(d => d.v).join(', ')} sur ${vide.map(d => d.l).join(', ')})`);
    // la section à moitié visible mais l'anneau coupé par le bas de la fenêtre : il reste vide (retouche du 01/10 : le remplissage démarre quand l'anneau est entier à l'écran)
    await rempl.p.evaluate(() => { const s = document.querySelector('.section--chart').getBoundingClientRect(); window.scrollTo(0, s.top + window.scrollY - (window.innerHeight - s.height / 2)); });
    await rempl.p.waitForTimeout(600);
    const moitie = await rempl.p.evaluate(() => { const s = document.querySelector('.section--chart').getBoundingClientRect(), a = document.querySelector('.graph__svg').getBoundingClientRect(), h = window.innerHeight;
      return { section: Math.round((Math.min(s.bottom, h) - Math.max(s.top, 0)) / s.height * 100), coupe: a.top < h && a.bottom > h, estRempli: document.querySelector('.graph').classList.contains('est-rempli') }; });
    const encoreVide = await dasharrays(rempl.p);
    ok(moitie.section >= 50 && moitie.coupe && !moitie.estRempli && encoreVide.every(d => d.v === 0), `remplissage : la section à moitié visible (${moitie.section} %) mais l'anneau coupé par le bas de la fenêtre → l'anneau reste vide (traits à ${encoreVide.map(d => d.v).join(', ')})`);
    const t0 = Date.now();
    await rempl.p.evaluate(() => document.querySelector('.section--chart').scrollIntoView({ block: 'center' }));
    await rempl.p.waitForTimeout(500 - (Date.now() - t0));
    const encours = await dasharrays(rempl.p), cl1 = await rempl.p.evaluate(() => document.querySelector('.graph').classList.contains('est-rempli'));
    ok(cl1 && encours.some(d => d.v > 0.5 && d.v < d.l - 0.5), `remplissage : en cours à 500 ms (.est-rempli ; traits à ${encours.map(d => d.v.toFixed(1)).join(', ')} sur ${encours.map(d => d.l).join(', ')})`);
    await rempl.p.waitForTimeout(Math.max(0, 2300 - (Date.now() - t0)));
    const plein = await dasharrays(rempl.p);
    ok(plein.every(d => Math.abs(d.v - d.l) < 0.01), `remplissage : plein à 2,3 s (traits à ${plein.map(d => d.v.toFixed(2)).join(', ')})`);
    await rempl.ctx.close();
  }

  // à 2× (écran Retina, 1521 × 705) : la plus grande version de la photo du premier écran est servie
  console.log('\n1521 × 705 à 2×');
  const retina = await ouvrir(SITE + '/', [1521, 705], { deviceScaleFactor: 2, reducedMotion: 'reduce' });
  await amener(retina.p, '.hero__photo');
  const pr = await infosPhoto(retina.p), tr = await tailleServie(pr.src);
  const cle = pr.src.replace(/^.*\//, '').replace(/[._].*$/, '');   // la clé de la photo, lue dans le nom du fichier servi (community-05-l.xxx.avif → community-05, cf. src/lib/photos.ts)
  const sources = await Promise.all(fs.readdirSync(path.join(REPO, 'design/directions/img')).filter(f => new RegExp(`^${cle.replace(/-l$/, '')}(-l)?\\.jpg$`).test(f)).map(async f => (await sharp(path.join(REPO, 'design/directions/img', f)).metadata()).width));
  ok(tr.largeur === Math.max(...sources), `photo du premier écran à 2× : ${tr.nom} (${tr.format} ${tr.largeur} × ${tr.hauteur}) servi, la plus grande version disponible (${Math.max(...sources)} px) pour ${pr.w} px × 2`);
  await retina.ctx.close();

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
