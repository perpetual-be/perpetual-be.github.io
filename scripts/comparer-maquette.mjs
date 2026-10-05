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
//     fenêtre (retouche du 01/10 : il démarre quand l'anneau est entièrement à l'écran), en cours à 500 ms, plein à 2,3 s ; « Contact » → #contact en
//     défilement fluide (scroll-behavior: smooth, site seulement), saut immédiat en mouvement réduit ;
//   · Engagements (lot 6), comparée à design/maquette/engagements.html?panneau=off : même hauteur de page ; captures identiques au pixel près de
//     .page-head et de chaque section.rang, l'image de l'œuvre masquée ; l'œuvre — même boîte, version servie jamais agrandie à 1× et assez grande à 2×,
//     capture comparée avec la tolérance de la photo du premier écran ; mêmes positions (titre, verbes, paragraphes, cimaise, cartel, haut du pied de
//     page) ; liens (Créahmbxl avec target, rel et « (nouvel onglet) », Écrivez-nous vers #contact) ; « Engagements » actif avec aria-current dans
//     l'en-tête, sur cette page seulement ; polices, requêtes, noindex, console ;
//   · les pages de texte sans maquette (lot 6 : mentions légales, confidentialité, 404), alignées sur Engagements : h1 au même x et au même y, colonnes de
//     gauche et de droite au même x que le verbe et le texte d'Engagements (la première ligne du texte à hauteur de l'œil du numéro ou du titre), filets
//     de même largeur, 72 px (44 à 390) entre la dernière rangée et le pied de page, numéros 01 à 07 sur la confidentialité et aucun sur les mentions, aucun
//     débordement horizontal, titre, description, aucune entrée active, noindex, console, requêtes ; la 404 (retouche du 01/10) tout dans la colonne de
//     gauche au-dessus de 640 px (filet et texte au x et à la largeur de la colonne du verbe, 30 px du filet au texte, la phrase sur une ligne et le lien
//     seul sur la suivante), inchangée au
//     téléphone ; aucune ligne ne finit par « e- » (« e-mail » insécable) ;
//   · les quatre fiches (lot 5), /realisations/<id>, comparées à design/maquette/projet-<id>.html?panneau=off : même hauteur de page ; mêmes positions et
//     mêmes textes ; captures identiques au pixel près de la colonne de gauche (titre, infos, chapitres ; au téléphone, ses trois blocs), de « Photos »,
//     des voisins et du pied de page, les photos masquées ; photo de tête — même boîte, même cadrage (object-position = tete.focal, object-fit cover), sa
//     clé, chargée tout de suite, jamais agrandie à 1×, assez grande à 2× (ou la plus grande version disponible), capture comparée avec la tolérance de la
//     photo du premier écran, les deux captures floutées (FLOU_FICHE) — et la photo qui suit à la même position que la maquette en haut de page, au milieu et
//     au bas des chapitres, puis juste après eux (sticky, plus au téléphone) ; mosaïque — mêmes rangées et mêmes boîtes au pixel pour chaque tuile, encore
//     après un passage de 1521 à 1280 px de large, clés, ratios, sizes sur chaque <source>, chaque photo servie au moins aussi large que sa tuile à 1×,
//     captures avec la même tolérance — ; visionneuse — rien d'elle chargé avant la première ouverture, ouverte sur la troisième tuile (« 3 / N »), la photo
//     entière dans le cadre 4:3, cadre et compteur dans la fenêtre (une photo en hauteur allonge le cadre de la maquette : défaut de maquette.css que le site
//     corrige, signalé en information), flèches et clavier en boucle avec les mêmes compteurs et les mêmes photos que la maquette, Tab gardé dedans, Échap qui
//     rend le focus à la tuile, photos en WebP de 1 800 px au plus, jamais au-delà de la source — ; voisins en boucle dans l'ordre du champ order, liens qui
//     répondent ; « Réalisations » actif sans aria-current ; titre de l'onglet, pas de description ; polices, requêtes, noindex, console ;
//   · tout dist/ : aucune occurrence de « julien@ » et chaque mailto égal à site.email, aucun commentaire venu de content/, espaces insécables avant « : »
//     dans les textes rendus, tous les liens internes répondent sauf /realisations (lot 5, message 2 : listé, pas compté), aucun lien vers les fiches de la
//     maquette (projet-<id>.html), une adresse inconnue sert la 404.
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
const MAQUETTE_ENGAGEMENTS = pathToFileURL(path.join(REPO, 'design/maquette/engagements.html')).href + '?panneau=off';
const FORMATS = [[1521, 705], [1920, 1080], [390, 844]];
const CHROMIUM_PREINSTALLE = '/opt/pw-browsers/chromium';
const TOLERANCE_PHOTO = 4;   // écart moyen par canal (sur 255) admis entre l'AVIF du site et le JPEG de la maquette, dans la zone de la photo du premier écran
// Photos des fiches (lot 5) : la même tolérance, les deux captures floutées avant la mesure (sigma 2,5, comme l'œuvre d'Engagements). La maquette réduit
// dans le navigateur un JPEG de 1 350 à 1 800 px (à 390 px, la vue de drone de Data Box passe de 1 800 à 559 px) ; le site sert un AVIF de 800 à
// 1 800 px réduit par sharp : les détails fins (briques, gravier, feuillages) n'ont pas le même grain — jusqu'à 12/255 d'écart moyen sans flou, 2,8 au plus
// flouté. Le cadrage est vérifié à part, exactement (boîtes, object-position, object-fit) : ce qui reste, flouté, est une erreur de photo ou de couleur.
const FLOU_FICHE = 2.5;
if (!fs.existsSync(path.join(REPO, 'dist/index.html'))) { console.error('dist/ introuvable : npm run build d\'abord'); process.exit(2); }

let ko = 0;
const ok = (cond, msg) => { console.log((cond ? '  ok  ' : '  KO  ') + msg); if (!cond) ko++; };
const fmt = ([w, h]) => `${w} × ${h}`;
const slug = s => s.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
// Un chemin relatif, en / sous Windows aussi (path.relative et readdirSync en récursif y séparent par \) : les contrôles de dist/ le comparent à
// « realisations/… » et en tirent des adresses
const posix = f => f.split(path.sep).join('/');

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
  await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  return { p, ctx, erreurs, requetes };
}
const rect = (p, sel) => p.evaluate(s => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, width: r.width, height: r.height }; }, sel);
// Les défilements du script sont instantanés (behavior: 'instant') : le site défile en fluide vers les ancres (scroll-behavior: smooth), pas le script.
const haut = p => p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
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
    zone.scrollIntoView({ block: 'start', behavior: 'instant' });
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
    await p.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
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
    await p.evaluate(t => window.scrollTo({ top: t, behavior: 'instant' }), z.top + y);
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
// Écart moyen par canal (R, V, B, sur 255) entre deux captures de même taille : la photo du premier écran, AVIF contre JPEG. `flou` (sigma, en px) :
// les deux captures sont floutées avant la mesure — pour l'œuvre d'Engagements, dont le site sert une réduction faite par sharp (340 px) quand la maquette
// réduit le JPEG de 870 px dans le navigateur : deux ré-échantillonnages des traits fins, qui diffèrent d'environ 11/255 en moyenne sans flou (18 entre deux
// réductions sans perte) ; flouté, ce qui reste est une erreur de couleur, de cadrage ou de position.
async function ecartMoyen(nom, site, maquette, flou = 0) {
  if (flou) [site, maquette] = await Promise.all([site, maquette].map(b => sharp(b).blur(flou).png().toBuffer()));
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
// Une feuille de style posée (oui) ou retirée (non) dans la page : masquer une image (visibility: hidden, sa boîte reste), ou l'en-tête collant du site.
const masquer = (p, id, css, oui) => p.evaluate(([id, css, m]) => { let st = document.getElementById(id); if (m && !st) { st = document.createElement('style'); st.id = id; st.textContent = css; document.head.appendChild(st); } if (!m && st) st.remove(); }, [id, css, oui]);
const masquerPhoto = (p, oui) => masquer(p, 'masque-photo', '.hero__photo img{visibility:hidden}', oui);
// L'en-tête collant du site (absent de la maquette) revient dès qu'on remonte dans la page et recouvre le haut de la fenêtre : masqué pendant les captures
// d'une page qui n'est pas parcourue de haut en bas (sa boîte reste, la mise en page ne bouge pas).
const masquerEntete = (p, oui) => masquer(p, 'masque-entete', '.entete-collante{visibility:hidden}', oui);
// Hauteur totale d'une page : le défilement et le corps.
const hauteurDe = p => p.evaluate(() => ({ defilement: document.documentElement.scrollHeight, corps: document.body.getBoundingClientRect().height }));
// Une page du site telle qu'elle s'est chargée : les polices qu'elle utilise (plus Jost au-dessus de 640 px), toutes depuis /fonts/ (les trois préchargées
// comprises), aucune requête hors du site, meta robots noindex, console vide.
async function controlesPage(site, chemin, largeur, polices, { statut404 = false } = {}) {
  const f = await site.p.evaluate(([fs, w]) => ({ ok: fs.concat(w > 640 ? ['400 27.7px Jost'] : []).every(f => document.fonts.check(f)), etat: document.fonts.status, chargees: [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family))].join(', ') }), [polices, largeur]);
  const woff = site.requetes.filter(u => u.endsWith('.woff2')).map(u => u.replace(/^.*\//, '')), hors = site.requetes.filter(u => !u.startsWith(SITE + '/'));
  const prechargees = ['instrument-sans-latin-wght-normal.woff2', 'newsreader-latin-opsz-normal.woff2', 'jost-latin-wght-normal.woff2'].every(f => woff.includes(f));
  ok(f.ok && f.etat === 'loaded' && prechargees && site.requetes.filter(u => u.endsWith('.woff2')).every(u => u.startsWith(SITE + '/fonts/')) && !hors.length,
    `polices : ${f.chargees} chargées, ${woff.length} fichiers woff2 depuis /fonts/ (les trois préchargées comprises), aucune requête hors du site (${site.requetes.length} requêtes)` + (hors.length ? ' — HORS SITE : ' + hors.join(', ') : ''));
  ok((await site.p.evaluate(() => document.querySelector('meta[name="robots"]')?.getAttribute('content'))) === 'noindex', `meta robots noindex sur ${chemin}`);
  const erreurs = statut404 ? site.erreurs.filter(e => !/status of 404/.test(e)) : site.erreurs;   // la page 404 est servie avec son statut : le navigateur le note en console
  ok(!erreurs.length && (!statut404 || site.erreurs.length === 1), `aucune erreur dans la console sur ${chemin}${statut404 ? ' (hors le 404 de l\'adresse elle-même, attendu)' : ''}` + (erreurs.length ? ' — ' + erreurs.join(' | ') : ''));
}
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
    await controlesPage(site, '/', format[0], ['400 17px "Instrument Sans"', 'italic 400 22px Newsreader', '400 34px Newsreader']);
    // en mouvement réduit, « Contact » saute au pied de page sans défiler (scroll-behavior: auto)
    const saut = await site.p.evaluate(() => { window.scrollTo({ top: 0, behavior: 'instant' }); document.querySelector('.site-nav a[href="#contact"]').click();
      return { y: Math.round(window.scrollY), attendu: Math.round(Math.min(document.querySelector('#contact').getBoundingClientRect().top + window.scrollY, document.documentElement.scrollHeight - window.innerHeight)), comportement: getComputedStyle(document.documentElement).scrollBehavior }; });
    ok(saut.y === saut.attendu && saut.comportement === 'auto', `« Contact », mouvement réduit : saut immédiat au pied de page (scrollY ${saut.y} px, attendu ${saut.attendu} ; scroll-behavior ${saut.comportement})`);
    await site.ctx.close(); await maq.ctx.close();

    // en-tête collant, sans réduire les animations : la page est allongée pour pouvoir défiler quelle que soit sa hauteur
    const normal = await ouvrir(SITE + '/', format);
    const avant = await dasharrays(normal.p), classesAvant = await normal.p.evaluate(() => ({ aRemplir: document.querySelector('.graph').classList.contains('a-remplir'), estRempli: document.querySelector('.graph').classList.contains('est-rempli') }));
    await normal.p.evaluate(() => { window.scrollTo({ top: 0, behavior: 'instant' }); document.querySelector('main').style.minHeight = '4000px'; });
    await normal.p.waitForFunction(() => document.querySelector('.entete-collante').getBoundingClientRect().top === 0, null, { timeout: 2000 }).catch(() => {});
    const hauteur = (await rect(normal.p, '.entete-collante')).height;
    const transition = await normal.p.evaluate(() => getComputedStyle(document.querySelector('.entete-collante')).transitionDuration);
    ok((await rect(normal.p, '.entete-collante')).top === 0 && hauteur === (await rect(normal.p, '.site-header')).height && transition === '0.3s',
      `en-tête collant : en haut de la fenêtre au départ, ${hauteur} px de haut (celle de .site-header), transition de ${transition}`);
    await normal.p.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
    const cache = await normal.p.waitForFunction(() => document.querySelector('.entete-collante').getBoundingClientRect().bottom <= 0, null, { timeout: 2000 }).then(() => true, () => false);
    ok(cache, `en-tête collant : hors de l'écran après un défilement de 600 px vers le bas (bas à ${(await rect(normal.p, '.entete-collante')).bottom} px)`);
    await normal.p.evaluate(() => window.scrollTo({ top: 500, behavior: 'instant' }));
    const revenu = await normal.p.waitForFunction(() => document.querySelector('.entete-collante').getBoundingClientRect().top === 0, null, { timeout: 2000 }).then(() => true, () => false);
    const r1 = await rect(normal.p, '.entete-collante');
    ok(revenu && r1.top === 0 && r1.height === hauteur && (await normal.p.evaluate(() => window.scrollY)) === 500, `en-tête collant : revenu en haut de la fenêtre après une remontée de 100 px (haut à ${r1.top} px, défilement ${await normal.p.evaluate(() => window.scrollY)})`);
    await normal.p.evaluate(() => window.scrollTo({ top: 1200, behavior: 'instant' }));
    await normal.p.waitForFunction(() => document.querySelector('.entete-collante').getBoundingClientRect().bottom <= 0, null, { timeout: 2000 }).catch(() => {});
    await normal.p.evaluate(() => document.querySelector('.entete-collante').dispatchEvent(new FocusEvent('focusin', { bubbles: true })));
    const focus = await normal.p.waitForFunction(() => document.querySelector('.entete-collante').getBoundingClientRect().top === 0, null, { timeout: 2000 }).then(() => true, () => false);
    ok(focus, 'en-tête collant : caché après un nouveau défilement vers le bas, il revient quand le focus clavier entre dedans');
    const liens = await normal.p.evaluate(() => [...document.querySelectorAll('.site-nav a')].map(a => `${a.textContent} → ${a.getAttribute('href')}${a.classList.contains('is-active') ? ' (actif)' : ''}`).join(' · '));
    ok(liens === 'Réalisations → /realisations · Engagements → /engagements · Contact → #contact' && (await normal.p.evaluate(() => document.querySelector('.logo').getAttribute('href') + ' ' + document.querySelector('.logo').getAttribute('aria-label'))) === '/ Perpetual — accueil',
      `navigation : ${liens} ; logo vers / (« Perpetual — accueil »), aucun lien actif sur la Home`);
    ok((await normal.p.evaluate(() => document.title)) === 'Perpetual — Le trait d’union entre les idées et le capital.', `titre de l'onglet : « ${await normal.p.evaluate(() => document.title)} »`);
    // « Contact » → #contact en défilement fluide (scroll-behavior: smooth, demande d'Axel du 01/10) : en route 80 ms après le clic, arrivé au pied de page ensuite
    await normal.p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await normal.p.waitForTimeout(400);
    const attendu = await normal.p.evaluate(() => Math.round(Math.min(document.querySelector('#contact').getBoundingClientRect().top + window.scrollY, document.documentElement.scrollHeight - window.innerHeight)));
    await normal.p.click('.site-nav a[href="#contact"]');
    await normal.p.waitForTimeout(80);
    const enRoute = await normal.p.evaluate(() => window.scrollY);
    const arrive = await normal.p.waitForFunction(a => Math.abs(window.scrollY - a) < 1, attendu, { timeout: 3000 }).then(() => true, () => false);
    ok(enRoute > 0 && enRoute < attendu - 1 && arrive && (await normal.p.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)) === 'smooth',
      `« Contact » : défilement fluide vers #contact (scrollY ${Math.round(enRoute)} px à 80 ms, ${attendu} px à l'arrivée ; html scroll-behavior smooth)`);
    await normal.ctx.close();

    // le remplissage de l'anneau, sans réduire les animations : vide avant l'arrivée à l'écran, en cours à 500 ms, plein à 2,3 s
    const rempl = await ouvrir(SITE + '/', format);
    const vide = await dasharrays(rempl.p), cl0 = await rempl.p.evaluate(() => ({ a: document.querySelector('.graph').classList.contains('a-remplir'), e: document.querySelector('.graph').classList.contains('est-rempli'), visible: document.querySelector('.section--chart').getBoundingClientRect().top < window.innerHeight / 2 }));
    ok(cl0.a && !cl0.e && !cl0.visible && vide.every(d => d.v === 0) && vide.length === 3, `remplissage : avant l'arrivée à l'écran, l'anneau est vide (.a-remplir, traits à ${vide.map(d => d.v).join(', ')} sur ${vide.map(d => d.l).join(', ')})`);
    // la section à moitié visible mais l'anneau coupé par le bas de la fenêtre : il reste vide (retouche du 01/10 : le remplissage démarre quand l'anneau est entier à l'écran)
    await rempl.p.evaluate(() => { const s = document.querySelector('.section--chart').getBoundingClientRect(); window.scrollTo({ top: s.top + window.scrollY - (window.innerHeight - s.height / 2), behavior: 'instant' }); });
    await rempl.p.waitForTimeout(600);
    const moitie = await rempl.p.evaluate(() => { const s = document.querySelector('.section--chart').getBoundingClientRect(), a = document.querySelector('.graph__svg').getBoundingClientRect(), h = window.innerHeight;
      return { section: Math.round((Math.min(s.bottom, h) - Math.max(s.top, 0)) / s.height * 100), coupe: a.top < h && a.bottom > h, estRempli: document.querySelector('.graph').classList.contains('est-rempli') }; });
    const encoreVide = await dasharrays(rempl.p);
    ok(moitie.section >= 50 && moitie.coupe && !moitie.estRempli && encoreVide.every(d => d.v === 0), `remplissage : la section à moitié visible (${moitie.section} %) mais l'anneau coupé par le bas de la fenêtre → l'anneau reste vide (traits à ${encoreVide.map(d => d.v).join(', ')})`);
    const t0 = Date.now();
    await rempl.p.evaluate(() => document.querySelector('.section--chart').scrollIntoView({ block: 'center', behavior: 'instant' }));
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

  // ---------- Engagements (lot 6) : comparée à design/maquette/engagements.html?panneau=off, aux trois formats, l'œuvre masquée pour les captures ----------
  const ENGAGEMENTS = ['.page-head', '.page__titre', '.registre', '.rang', '.rang__g', '.rang__d', '.rang__verbe', '.eng-texte', '.eng-texte p', '.lien-texte', '.cimaise', '.oeuvre', '.oeuvre img', '.cartel', '.cartel b', '.cartel span', '.site-footer'];
  const masquerOeuvre = (p, oui) => masquer(p, 'masque-oeuvre', '.oeuvre img{visibility:hidden}', oui);
  const infosOeuvre = p => p.evaluate(() => {
    const i = document.querySelector('.oeuvre img'), b = i.getBoundingClientRect(), s = getComputedStyle(i);
    return { boite: [Math.round(b.left), Math.round(b.top + window.scrollY), Math.round(b.width), Math.round(b.height)], zone: { left: b.left, top: b.top, width: b.width, height: b.height }, fit: s.objectFit, lien: !!i.closest('a'),
      attrs: i.getAttribute('width') + ' × ' + i.getAttribute('height'), src: i.currentSrc, w: b.width, h: b.height, alt: i.alt, lazy: i.getAttribute('loading'), dans: !!i.closest('#soutenir .rang__g > .cimaise > figure.oeuvre') };
  });
  for (const format of FORMATS) {
    console.log(`\nEngagements, ${fmt(format)}`);
    const nom = `engagements-${format[0]}x${format[1]}`;
    const site = await ouvrir(SITE + '/engagements', format, { reducedMotion: 'reduce' }), maq = await ouvrir(MAQUETTE_ENGAGEMENTS, format, { reducedMotion: 'reduce' });
    ok(!maq.erreurs.length, `maquette ouverte sans erreur (${MAQUETTE_ENGAGEMENTS.replace(/^.*design\//, 'design/')})` + (maq.erreurs.length ? ' — ' + maq.erreurs.join(' | ') : ''));
    const hs = await hauteurDe(site.p), hm = await hauteurDe(maq.p);
    ok(hs.defilement === hm.defilement && Math.abs(hs.corps - hm.corps) < 0.01, `Engagements : même hauteur totale de page (site ${hs.defilement} px, maquette ${hm.defilement} px ; corps ${hs.corps} / ${hm.corps})`);
    // l'ouverture et chaque rangée, l'image de l'œuvre masquée (sa boîte reste : AVIF côté site, JPEG côté maquette, elle est comparée à part) ; l'en-tête
    // collant du site masqué (il recouvrirait .page-head, juste sous lui, puis l'œuvre quand on remonte vers elle)
    await masquerEntete(site.p, true);
    const rangs = await site.p.evaluate(() => [...document.querySelectorAll('.registre > section.rang')].map(s => '#' + s.id)), rangsMaq = await maq.p.evaluate(() => [...document.querySelectorAll('.registre > section.rang')].map(s => '#' + s.id));
    ok(rangs.length === 3 && rangs.join(' ') === rangsMaq.join(' '), `rangées du registre : ${rangs.join(' ')} (maquette : ${rangsMaq.join(' ')})`);
    await masquerOeuvre(site.p, true); await masquerOeuvre(maq.p, true);
    for (const sel of ['.page-head', ...rangs]) {
      const c = await comparer(`${slug(sel)}-${nom}`, await captureSection(site.p, sel), await captureSection(maq.p, sel));
      ok(c.differents === 0, `${sel} : capture identique au pixel près, l'œuvre masquée (${c.taille})` + (c.differents ? ' — ' + c.detail : ''));
    }
    await masquerOeuvre(site.p, false); await masquerOeuvre(maq.p, false);
    // l'œuvre : même boîte, version servie jamais agrandie à 1×, capture comparée avec la tolérance de la photo du premier écran
    await amener(site.p, '.cimaise'); await amener(maq.p, '.cimaise');
    const os = await infosOeuvre(site.p), om = await infosOeuvre(maq.p);
    ok(JSON.stringify(os.boite) === JSON.stringify(om.boite) && os.fit === 'fill' && om.fit === 'fill' && !os.lien && os.dans && os.attrs === om.attrs && os.alt === om.alt && os.lazy === 'lazy',
      `l'œuvre : même boîte (${os.boite[2]} × ${os.boite[3]} à y = ${os.boite[1]}) dans la cimaise de #soutenir, width / height ${os.attrs}, object-fit ${os.fit} / ${om.fit}, pas un lien, chargement paresseux, même texte alternatif`);
    const ts = await tailleServie(os.src), tm = await tailleServie(om.src);
    ok(ts.largeur >= Math.round(os.w) && ts.largeur <= tm.largeur, `l'œuvre : ${ts.nom} (${ts.format} ${ts.largeur} × ${ts.hauteur}) servi par le site, jamais agrandi à 1× (${Math.round(os.w)} px affichés) ; maquette : ${tm.nom} (${tm.largeur} × ${tm.hauteur})`);
    const po = await ecartMoyen(`oeuvre-${nom}`, await captureZone(site.p, os.zone), await captureZone(maq.p, om.zone), 2.5);
    ok(po.ok, `l'œuvre : capture de l'image (${po.taille}) comparée avec tolérance, les deux captures floutées (sigma 2,5 : la maquette réduit le JPEG de 870 px dans le navigateur, le site sert la réduction de sharp) — ${po.detail}`);
    // positions dans le document, défilement à 0 : titre, verbes, paragraphes, cimaise, cartel, haut du pied de page
    await haut(site.p); await haut(maq.p); await site.p.waitForTimeout(350);
    memesBoites(await boites(site.p, ENGAGEMENTS, null), await boites(maq.p, ENGAGEMENTS, null), 'Engagements', 'le haut du document');
    await masquerEntete(site.p, false);
    // liens dans le texte : Créahmbxl dans un nouvel onglet, annoncé ; Écrivez-nous vers #contact, le pied de page
    const l = await site.p.evaluate(() => ({ liens: [...document.querySelectorAll('.eng-texte a')].map(a => `${a.className} ${a.firstChild.textContent} → ${a.getAttribute('href')}${a.target ? ' ' + a.target : ''}${a.rel ? ' ' + a.rel : ''}${a.querySelector('.visuellement-masque') ? ' +' + JSON.stringify(a.querySelector('.visuellement-masque').textContent) : ''}`).join(' | '),
      contact: document.getElementById('contact')?.tagName, masque: document.querySelector('.visuellement-masque') ? Math.round(document.querySelector('.visuellement-masque').getBoundingClientRect().width) + '×' + Math.round(document.querySelector('.visuellement-masque').getBoundingClientRect().height) : null }));
    ok(l.liens === 'lien-texte Créahmbxl → https://creahmbxl.be _blank noopener +" (nouvel onglet)" | lien-texte Écrivez-nous → #contact' && l.contact === 'FOOTER' && l.masque === '1×1', `liens : ${l.liens.replace(/lien-texte /g, '')} ; #contact est le pied de page ; « (nouvel onglet) » masqué visuellement (${l.masque})`);
    // navigation : Engagements actif, avec aria-current, sur cette page
    const nav = await site.p.evaluate(() => [...document.querySelectorAll('.site-nav a')].map(a => `${a.textContent}${a.classList.contains('is-active') ? ' actif' : ''}${a.hasAttribute('aria-current') ? ' aria-current=' + a.getAttribute('aria-current') : ''} → ${a.getAttribute('href')}`).join(' | '));
    ok(nav === 'Réalisations → /realisations | Engagements actif aria-current=page → /engagements | Contact → #contact', 'navigation : ' + nav);
    ok((await site.p.evaluate(() => [document.documentElement.dataset.page, document.title, document.querySelector('.page__titre').textContent, document.querySelector('meta[name="description"]')?.content].join(' · '))) === 'engagements · Engagements — Perpetual · Engagements · Aider bénévolement, transmettre à La Cambre-Horta, soutenir le Créahmbxl — les trois engagements de Perpetual.',
      `html data-page="engagements", titre « Engagements — Perpetual », h1 « Engagements » seul, description de l'en-tête`);
    await controlesPage(site, '/engagements', format[0], ['400 17px "Instrument Sans"', '400 42px Newsreader', 'italic 400 22px Newsreader']);
    await site.ctx.close(); await maq.ctx.close();
  }
  // à 2× (1521 × 705) : l'œuvre servie assez grande, sans dépasser la source
  {
    const retina = await ouvrir(SITE + '/engagements', [1521, 705], { deviceScaleFactor: 2, reducedMotion: 'reduce' });
    await amener(retina.p, '.cimaise');
    const oe = await infosOeuvre(retina.p), te = await tailleServie(oe.src);
    ok(te.largeur >= 2 * oe.w && te.largeur <= 870, `l'œuvre à 2× : ${te.nom} (${te.format} ${te.largeur} × ${te.hauteur}) servi pour ${Math.round(oe.w)} px × 2, assez grand sans dépasser la source (870 px)`);
    await retina.ctx.close();
  }
  // « Engagements » actif (aria-current) sur sa page seulement : les pages construites, sous-dossiers compris (les fiches, dist/realisations/)
  {
    const pages = fs.readdirSync(path.join(REPO, 'dist'), { recursive: true }).filter(f => f.endsWith('.html')).map(posix).sort();
    const actifs = pages.map(f => { const h = fs.readFileSync(path.join(REPO, 'dist', f), 'utf8'); const m = h.match(/<a href="([^"]+)" class="trait is-active"[^>]*aria-current="page"[^>]*>([^<]+)<\/a>/g) || []; return `${f} : ${m.length ? m.map(x => x.replace(/^.*>([^<]+)<\/a>$/, '$1')).join(', ') : '—'}`; });
    ok(pages.includes('engagements.html') && actifs.every(a => a === 'engagements.html : Engagements' || a.endsWith(' : —')) && pages.every(f => (fs.readFileSync(path.join(REPO, 'dist', f), 'utf8').match(/aria-current/g) || []).length === (f === 'engagements.html' ? 1 : 0)),
      `aria-current="page" sur le lien « Engagements » de engagements.html seulement — ${actifs.join(' · ')}`);
  }

  // ---------- pages de texte sans maquette (lot 6) : mentions légales, confidentialité et 404, sur le gabarit d'Engagements ----------
  // Les repères sont pris sur la page Engagements du site (identique à la maquette) : x et y du h1, x de la colonne de gauche (le verbe) et de la colonne
  // de droite (le texte), largeur des filets. Sur chaque page : le h1 au même x et au même y ; le numéro ou le titre de chapitre au x du verbe, le texte au x
  // du texte d'Engagements, sa première ligne à hauteur de l'œil de la première ligne de gauche (le numéro, sinon le titre : ± 1 px) ; filets de même largeur ;
  // 72 px (44 à 390) entre le bas de la dernière rangée et le pied de page ; numéros 01 à 07 sur la confidentialité, aucun sur les mentions ; aucun
  // débordement horizontal ; titre de l'onglet, description, data-page="texte", aucune entrée active ; noindex, console vide, aucune requête hors du site.
  const PAGES_TEXTE = [
    ['/mentions-legales', { h1: 'Mentions légales', nums: '', sections: 'editeur-du-site hebergement propriete-intellectuelle', gauche: 'titre' }],
    ['/confidentialite', { h1: 'Politique de confidentialité', nums: '01 02 03 04 05 06 07', sections: 'responsable-du-traitement donnees-traitees destinataires-et-transferts-hors-union-europeenne duree-de-conservation vos-droits cookies modification-de-cette-politique', gauche: 'numero' }],
    ['/adresse-inconnue', { h1: 'Page introuvable', nums: '', sections: '', gauche: 'colonne', titre: 'Page introuvable — Perpetual' }],   // retouche du 01/10 : tout dans la colonne de gauche au-dessus de 640 px
  ];
  // l'œil d'une ligne de texte : sa ligne de base (un inline-block de hauteur nulle, inséré en tête) moins la moitié de la hauteur d'x (canvas)
  const oeil = `(el) => { const s = document.createElement('span'); s.style.cssText = 'display:inline-block;width:0;height:0'; el.prepend(s); const base = s.getBoundingClientRect().bottom; s.remove();
    const cs = getComputedStyle(el), c = document.createElement('canvas').getContext('2d'); c.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily; return base - c.measureText('x').actualBoundingBoxAscent / 2; }`;
  for (const format of FORMATS) {
    console.log(`\nPages de texte, ${fmt(format)}`);
    const tel = format[0] <= 640;
    const eng = await ouvrir(SITE + '/engagements', format, { reducedMotion: 'reduce' });
    const repere = await eng.p.evaluate(() => { const r = s => document.querySelector(s).getBoundingClientRect(); const h1 = r('.page__titre'), g = r('#soutenir .rang__verbe'), col = r('#soutenir .rang__g'), d = r('#soutenir .eng-texte p'), rang = r('.rang');
      return { h1x: Math.round(h1.left), h1y: Math.round(h1.top), gauche: Math.round(g.left), colonne: Math.round(col.width), droite: Math.round(d.left), filet: Math.round(rang.width) }; });
    await eng.ctx.close();
    for (const [chemin, attendu] of PAGES_TEXTE) {
      const page = await ouvrir(SITE + chemin, format, { reducedMotion: 'reduce' });
      const m = await page.p.evaluate((oeilSrc) => {
        const oeil = eval(oeilSrc), r = e => e.getBoundingClientRect(), h1 = document.querySelector('.page__titre'), rangs = [...document.querySelectorAll('.registre > section.rang')], dernier = rangs[rangs.length - 1];
        const gauches = rangs.map(s => s.querySelector('.rang__g > :first-child')).filter(Boolean), textes = rangs.map(s => s.querySelector('.page-texte > :first-child'));
        const premier = textes.map(t => t.tagName === 'UL' || t.tagName === 'OL' ? t.querySelector('li') : t);
        return { h1: h1.textContent, h1x: Math.round(r(h1).left), h1y: Math.round(r(h1).top), page: document.documentElement.dataset.page, title: document.title, description: document.querySelector('meta[name="description"]')?.content ?? '',
          sections: rangs.map(s => s.id).join(' '), nums: [...document.querySelectorAll('.chapitre__num')].map(e => e.textContent).join(' '), numerotees: document.querySelectorAll('.rang--numerote').length, h2: [...document.querySelectorAll('h2')].map(h => h.className + (h.id ? '#' + h.id : '')).join(' '),
          gauche: [...new Set(gauches.map(g => Math.round(r(g).left)))].join(','), droite: [...new Set(premier.map(t => Math.round(r(t).left)))].join(','), filets: [...new Set(rangs.map(s => Math.round(r(s).width)))].join(','),
          // le filet : la bordure haute de la rangée, ou de sa colonne de gauche (la 404 au-dessus de 640 px) — x, largeur, et l'écart au texte
          filet: (() => { const el = [document.querySelector('.rang__g'), rangs[0]].find(e => e && getComputedStyle(e).borderTopWidth !== '0px'); const b = r(el); return { x: Math.round(b.left), l: Math.round(b.width), texte: Math.round(r(premier[0]).top - b.top - parseFloat(getComputedStyle(el).borderTopWidth)) }; })(),   // l'écart se compte sous le filet
          lignes: [...document.querySelectorAll('.page-texte a')].map(a => a.getClientRects().length).join(','),
          // la 404 : la phrase avant le lien sur une ligne, le lien seul sur la suivante (sa boîte ne dépasse pas son texte)
          phrase: (() => { const a = document.querySelector('.page-texte a'); if (!a || !a.previousSibling) return null; const rg = document.createRange(); rg.selectNodeContents(a.previousSibling); const t = rg.getClientRects(); const ra = r(a), rp = r(a.parentElement);
            return { lignes: t.length, lienDessous: Math.round(ra.top) >= Math.round(t[t.length - 1].bottom), lienX: Math.round(ra.left) === Math.round(rp.left), lienLarge: Math.round(ra.width) < Math.round(rp.width) }; })(),
          finEnE: (() => { const n = []; const w = document.createTreeWalker(document.querySelector('.registre'), NodeFilter.SHOW_TEXT); let t; while ((t = w.nextNode())) { for (const m of t.nodeValue.matchAll(/e-\w/gi)) { const rg = document.createRange(); rg.setStart(t, m.index); rg.setEnd(t, m.index + 3); if (rg.getClientRects().length > 1) n.push(m[0]); } } return n; })(),
          ecarts: gauches.map((g, i) => +(oeil(premier[i]) - oeil(g)).toFixed(1)), sousTitre: [...new Set(rangs.map(s => s.querySelector('.chapitre__titre')).filter(Boolean).map((t, i) => Math.round(r(premier[i]).top - r(t).bottom)))].join(','), pied: Math.round(r(document.querySelector('.site-footer')).top), bas: Math.round(Math.max(...[...dernier.querySelectorAll('*')].map(r).filter(b => b.height > 0).map(b => b.bottom))),
          deb: document.documentElement.scrollWidth - document.documentElement.clientWidth, actifs: document.querySelectorAll('.site-nav .is-active, .site-nav [aria-current]').length, maj: document.querySelector('.page__maj')?.textContent ?? null,
          liens: [...document.querySelectorAll('.page-texte a')].map(a => `${a.className} ${a.getAttribute('href')}${a.target ? ' ' + a.target : ''}`).join(' | ') };
      }, oeil);
      ok(m.h1 === attendu.h1 && m.h1x === repere.h1x && m.h1y === repere.h1y, `${chemin} : h1 « ${m.h1} » au même x et au même y qu'Engagements (${m.h1x}, ${m.h1y} ; Engagements ${repere.h1x}, ${repere.h1y})`);
      ok(m.sections === attendu.sections && m.nums === attendu.nums && m.numerotees === attendu.nums.split(' ').filter(Boolean).length && !/#/.test(m.h2),
        `${chemin} : rangées ${m.sections || '(une, sans titre)'} ; numéros ${m.nums || 'aucun'} ; titres en h2.chapitre__titre sans id (l'id est sur la section)`);
      if (attendu.gauche === 'colonne' && !tel) ok(m.filet.x === repere.gauche && m.filet.l === repere.colonne && m.droite === String(repere.gauche) && m.filet.texte === 30 && m.lignes === '1' && m.phrase && m.phrase.lignes === 1 && m.phrase.lienDessous && m.phrase.lienX && m.phrase.lienLarge && m.deb === 0,
        `${chemin} : tout dans la colonne de gauche — filet à x = ${m.filet.x}, ${m.filet.l} px de large (colonne du verbe d'Engagements : ${repere.gauche}, ${repere.colonne} px), texte à x = ${m.droite}, ${m.filet.texte} px sous le filet ; la phrase sur une ligne, le lien « Revenir à l'accueil » seul sur la ligne suivante, à la largeur de son texte`);
      else if (attendu.gauche === 'colonne') ok(m.droite === String(repere.gauche) && m.filets === String(repere.filet) && m.filet.l === repere.filet && m.filet.texte === 22,
        `${chemin} : au téléphone, comme avant — une colonne, texte à x = ${m.droite}, filet du container (${m.filet.l} px), ${m.filet.texte} px sous le filet`);
      else ok(m.gauche === String(repere.gauche) && m.droite === String(repere.droite) && m.filets === String(repere.filet),
        `${chemin} : colonne de gauche à x = ${m.gauche || '—'} (verbe d'Engagements ${repere.gauche}), texte à x = ${m.droite} (texte d'Engagements ${repere.droite}), filets de ${m.filets} px (${repere.filet})`);
      ok(!m.finEnE.length, `${chemin} : aucune ligne ne finit par « e- » (« e-mail » insécable)` + (m.finEnE.length ? ' — coupés : ' + m.finEnE.join(', ') : ''));
      if (attendu.gauche !== 'colonne' && !tel) ok(m.ecarts.every(e => Math.abs(e) <= 1), `${chemin} : première ligne du texte à hauteur de l'œil du ${attendu.gauche === 'numero' ? 'numéro' : 'titre'} (écarts ${m.ecarts.join(', ')} px, ± 1 admis)`);
      if (attendu.gauche !== 'colonne' && tel) ok(m.sousTitre === '16', `${chemin} : une colonne — ${attendu.gauche === 'numero' ? 'le numéro, ' : ''}le titre, puis le texte ${m.sousTitre} px dessous (16 attendus)`);
      ok(m.pied - m.bas === (tel ? 44 : 72), `${chemin} : bas de la dernière rangée → haut du pied de page, ${m.pied - m.bas} px (${tel ? 44 : 72} attendus)`);
      ok(m.deb === 0 && m.page === (attendu.gauche === 'colonne' ? 'introuvable' : 'texte') && m.title === (attendu.titre ?? `${attendu.h1} — Perpetual`) && (chemin === '/adresse-inconnue' || m.description.length > 20) && m.actifs === 0,
        `${chemin} : aucun débordement horizontal (${m.deb} px), html data-page="${m.page}", titre « ${m.title} »${m.description ? ', description de l\'en-tête' : ''}, aucune entrée active dans l'en-tête`);
      if (chemin === '/confidentialite') ok(m.maj === null, `${chemin} : updated vide dans l'en-tête — pas de ligne « Dernière mise à jour » (le build l'a signalé)`);
      if (chemin === '/adresse-inconnue') ok(m.liens === 'lien-texte /', `${chemin} : la page 404 — un paragraphe, le lien « Revenir à l'accueil » vers / (${m.liens})`);
      await controlesPage(page, chemin, format[0], ['400 17px "Instrument Sans"', 'italic 400 22px Newsreader'].concat(attendu.gauche === 'colonne' ? [] : ['500 26px "Instrument Sans"']), { statut404: chemin === '/adresse-inconnue' });
      await page.ctx.close();
    }
  }

  // ---------- les quatre fiches (lot 5) : /realisations/<id>, comparées à design/maquette/projet-<id>.html?panneau=off, aux trois formats ----------
  const DETAILLES = JSON.parse(fs.readFileSync(path.join(REPO, 'data/projects.json'), 'utf8')).filter(p => p.kind === 'detailed').sort((a, b) => a.order - b.order);
  const maquetteFiche = id => pathToFileURL(path.join(REPO, `design/maquette/projet-${id}.html`)).href + '?panneau=off';
  const masquerPhotos = (p, oui) => masquer(p, 'masque-photos', '.fiche__photo img,.fiche__tuile img{visibility:hidden}', oui);
  const FICHE = ['.fiche__corps', '.fiche__gauche', '.fiche__titre', '.fiche__titre .eyebrow', '.page__titre', '.fiche__faits', '.fiche__fait', '.fiche__valeur', '.fiche__etiquette', '.fiche__chapitres', '.chapitre',
    '.chapitre__num', '.chapitre__titre', '.chapitre__texte', '.fiche__photo', '.fiche__autres', '.fiche__autres .eyebrow', '.fiche__mosaique', '.fiche__voisins', '.fiche__voisin', '.fiche__voisin .eyebrow', '.suivant__nom', '.site-footer'];
  const IMG_DIR = path.join(REPO, 'design/directions/img');
  // la plus grande version d'une clé (2 800, sinon 1 800 px), celle dont le site tire ses photos (src/lib/photos.ts)
  const tailleSource = async cle => { const f = [`${cle}-l.jpg`, `${cle}.jpg`].map(x => path.join(IMG_DIR, x)).find(x => fs.existsSync(x)); const m = await sharp(f).metadata(); return { largeur: m.width, hauteur: m.height }; };
  // la photo de tête : la boîte de son cadre (.fiche__photo) et de l'<img>, cadrage, version servie, sa position calculée ; la plus grande des largeurs de son srcset
  const infosTete = p => p.evaluate(() => {
    const z = document.querySelector('.fiche__photo'), i = z.querySelector('img'), b = z.getBoundingClientRect(), bi = i.getBoundingClientRect(), s = getComputedStyle(i), source = z.querySelector('source');
    return { boite: { left: b.left, top: b.top, width: b.width, height: b.height }, cadre: [Math.round(b.left), Math.round(b.top + window.scrollY), Math.round(b.width), Math.round(b.height)], img: [Math.round(bi.left), Math.round(bi.top + window.scrollY), Math.round(bi.width), Math.round(bi.height)],
      position: s.objectPosition, fit: s.objectFit, src: i.currentSrc, w: bi.width, h: bi.height, cle: i.dataset.cle ?? null, loading: i.getAttribute('loading'), alt: i.getAttribute('alt'), sizes: i.getAttribute('sizes'),
      maxSrcset: source ? Math.max(...source.srcset.split(',').map(x => parseInt(x.trim().split(' ')[1]))) : null, suit: getComputedStyle(z).position };
  });
  // la mosaïque : les rangées (nombre de photos par .fiche__rang), la boîte de chaque tuile au pixel (dans le document) et ses dimensions posées par le script
  const tuilesDe = p => p.evaluate(() => {
    const t = [...document.querySelectorAll('.fiche__tuile')];
    return { rangs: [...document.querySelectorAll('.fiche__rang')].map(r => r.children.length).join(' '), boites: t.map(x => { const b = x.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top + window.scrollY), Math.round(b.width), Math.round(b.height)]; }),
      exactes: t.map(x => `${x.style.width} ${x.style.height}`).join(' | '), r: t.map(x => `${x.style.getPropertyValue('--r')}/${x.dataset.r}`).join(' '), largeur: document.querySelector('.fiche__mosaique').getBoundingClientRect().width };
  });
  const memesTuiles = (a, b) => a.rangs === b.rangs && JSON.stringify(a.boites) === JSON.stringify(b.boites) && a.exactes === b.exactes;
  // la visionneuse : ouverte ou non, le compteur, la photo montrée (sa clé : le numéro de la tuile sur le site, le nom du fichier dans la maquette), chargée,
  // entière dans le cadre 4:3 (object-fit: contain, l'<img> occupe tout le cadre), et l'élément qui a le focus
  const etatVisio = p => p.evaluate(() => {
    const v = document.querySelector('.visio'), vp = v.querySelector('.visio__piste'), img = vp.children[Math.round(vp.scrollLeft / vp.clientWidth)], c = v.querySelector('.visio__cadre').getBoundingClientRect(), a = document.activeElement;
    const tuiles = [...document.querySelectorAll('.fiche__agrandir')].map(b => b.dataset.grande), bi = img && img.getBoundingClientRect(), src = img && img.getAttribute('src');
    return { ouvert: !v.hidden && getComputedStyle(v).display !== 'none', corps: document.body.classList.contains('visio-ouverte'), cpt: v.querySelector('.visio__compteur').textContent, legende: v.querySelector('.visio__legende').innerHTML,
      src, photo: src ? tuiles.indexOf(src) + 1 : 0, charge: !!img && img.complete && img.naturalWidth > 0, fit: img ? getComputedStyle(img).objectFit : null, ratio: c.width / c.height,
      entiere: !!bi && Math.abs(bi.left - c.left) < 0.5 && Math.abs(bi.top - c.top) < 0.5 && Math.abs(bi.width - c.width) < 0.5 && Math.abs(bi.height - c.height) < 0.5,
      dansFenetre: c.top >= -0.5 && c.left >= -0.5 && c.bottom <= window.innerHeight + 0.5 && c.right <= window.innerWidth + 0.5,
      compteurVisible: (() => { const b = v.querySelector('.visio__compteur').getBoundingClientRect(); return b.height > 0 && b.top >= 0 && b.bottom <= window.innerHeight; })(),
      focus: a ? (a.closest('.visio') ? 'visio' : a.getAttribute('aria-label') || a.tagName) : null };
  });
  const VISIO = ['.visio__cadre', '.visio__bas', '.visio__fermer', '.visio__fleche', '.visio__compteur'];
  const boucle = {};
  for (const [n, d] of DETAILLES.entries()) {
    const prec = DETAILLES[(n + DETAILLES.length - 1) % DETAILLES.length], suiv = DETAILLES[(n + 1) % DETAILLES.length], [tete, ...autres] = d.selection, N = autres.length;
    const chemin = `/realisations/${d.id}`;
    for (const format of FORMATS) {
      console.log(`\n${d.name} (${chemin}), ${fmt(format)}`);
      const nom = `fiche-${d.id}-${format[0]}x${format[1]}`, tel = format[0] <= 640;
      const site = await ouvrir(SITE + chemin, format, { reducedMotion: 'reduce' }), maq = await ouvrir(maquetteFiche(d.id), format, { reducedMotion: 'reduce' });
      ok(!maq.erreurs.length, `maquette ouverte sans erreur (design/maquette/projet-${d.id}.html)` + (maq.erreurs.length ? ' — ' + maq.erreurs.join(' | ') : ''));
      const hs = await hauteurDe(site.p), hm = await hauteurDe(maq.p);
      ok(hs.defilement === hm.defilement && Math.abs(hs.corps - hm.corps) < 0.01, `${d.name} : même hauteur de page (site ${hs.defilement} px, maquette ${hm.defilement} px ; corps ${hs.corps} / ${hm.corps})`);
      await masquerEntete(site.p, true);
      // positions dans le document, défilement à 0 ; les mêmes textes (région, titre, infos, chapitres ; voisins)
      memesBoites(await boites(site.p, FICHE, null), await boites(maq.p, FICHE, null), d.name, 'le haut du document');
      const textes = p => p.evaluate(() => ['.fiche__gauche', '.fiche__autres .eyebrow', '.fiche__voisins'].map(s => document.querySelector(s).textContent).join(' ¶ '));
      const ts = await textes(site.p);
      ok(ts === await textes(maq.p), `${d.name} : mêmes textes que la maquette — ${ts.slice(0, 90)}…`);

      // la photo de tête : même boîte au pixel, même cadrage ; la version servie jamais agrandie à 1× ; capture comparée avec la tolérance de la photo du
      // premier écran de la Home
      const ps = await infosTete(site.p), pm = await infosTete(maq.p);
      ok(JSON.stringify(ps.cadre) === JSON.stringify(pm.cadre) && JSON.stringify(ps.img) === JSON.stringify(pm.img) && ps.position === d.tete.focal && pm.position === d.tete.focal && ps.fit === 'cover' && pm.fit === 'cover'
        && ps.cle === tete && ps.loading === 'eager' && ps.alt === '',
        `photo de tête ${tete} : même boîte (${ps.cadre[2]} × ${ps.cadre[3]} à x = ${ps.cadre[0]}, y = ${ps.cadre[1]}), même cadrage (object-position ${ps.position} / ${pm.position}, tete.focal ${d.tete.focal} ; object-fit ${ps.fit} / ${pm.fit}), chargée tout de suite (loading="${ps.loading}"), texte alternatif vide`);
      const tss = await tailleServie(ps.src), tsm = await tailleServie(pm.src), echelle = +Math.max(ps.w / tss.largeur, ps.h / tss.hauteur).toFixed(3);
      ok(echelle <= 1, `photo de tête : ${tss.nom} (${tss.format} ${tss.largeur} × ${tss.hauteur}) servi par le site, jamais agrandi à 1× (échelle ${echelle} pour ${Math.round(ps.w)} × ${Math.round(ps.h)}) ; maquette : ${tsm.nom} (${tsm.largeur} × ${tsm.hauteur}) — sizes « ${ps.sizes} »`);
      const ph = await ecartMoyen(`${nom}-tete`, await captureZone(site.p, ps.boite), await captureZone(maq.p, pm.boite), FLOU_FICHE);
      ok(ph.ok, `photo de tête : capture de .fiche__photo (${ph.taille}) comparée avec tolérance, les deux captures floutées (sigma ${FLOU_FICHE}) — ${ph.detail}`);
      // la photo qui suit : même position que la maquette en haut de page, au milieu des chapitres (au milieu de la fenêtre), au bas des chapitres (au bas de la
      // fenêtre) — les deux reviennent au haut de page quand les chapitres tiennent dans la fenêtre — et juste après eux (le bas des chapitres en haut de la
      // fenêtre) ; sticky sur ordinateur, plus au téléphone
      const depths = [];
      for (const ou of ['haut', 'milieu', 'bas', 'après']) {
        const placer = p => p.evaluate(ou => { const c = document.querySelector('.fiche__chapitres').getBoundingClientRect(), y0 = c.top + window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
          const y = ou === 'haut' ? 0 : ou === 'milieu' ? y0 + c.height / 2 - window.innerHeight / 2 : ou === 'bas' ? y0 + c.height - window.innerHeight : y0 + c.height;
          window.scrollTo({ top: Math.max(0, Math.min(max, Math.round(y))), behavior: 'instant' }); return window.scrollY; }, ou);
        const ys = await placer(site.p), ym = await placer(maq.p);
        await site.p.waitForTimeout(50);
        const rs = await rect(site.p, '.fiche__photo'), rm = await rect(maq.p, '.fiche__photo');
        depths.push({ ou, ys, ym, rs, rm, meme: ys === ym && ['top', 'left', 'width', 'height'].every(k => Math.abs(rs[k] - rm[k]) < 0.01) });
      }
      const attendu = tel ? 'relative' : 'sticky';
      ok(depths.every(x => x.meme) && ps.suit === attendu && pm.suit === attendu,
        `photo qui suit : même position que la maquette en haut de page, au milieu et au bas des chapitres, puis après eux — ${depths.map(x => `${x.ou} (défilement ${x.ys}) : haut à ${x.rs.top.toFixed(1)} px`).join(' ; ')} ; position ${ps.suit}${tel ? ' (plus sticky au téléphone)' : ''}`);
      await haut(site.p); await haut(maq.p);

      // la mosaïque : les clés suivantes de selection, au ratio de leur <clé>.jpg ; mêmes rangées et mêmes boîtes au pixel pour chaque tuile ; chaque photo
      // servie au moins aussi large que sa tuile à 1× (sizes = la largeur de la tuile, sur chaque <source> comme sur l'<img>) ; captures avec tolérance
      const mts = await tuilesDe(site.p), mtm = await tuilesDe(maq.p);
      ok(memesTuiles(mts, mtm) && mts.r === mtm.r, `mosaïque : mêmes rangées [${mts.rangs.split(' ').join(', ')}] et mêmes boîtes pour les ${mts.boites.length} tuiles (${mts.boites.map(b => `${b[2]}×${b[3]}`).join(', ')}) ; --r et data-r identiques (${mts.r.split(' ').map(x => x.split('/')[0]).join(' ')})`
        + (memesTuiles(mts, mtm) ? '' : ` — site ${JSON.stringify(mts.boites)} / maquette ${JSON.stringify(mtm.boites)}`));
      const attrs = await site.p.evaluate(() => [...document.querySelectorAll('.fiche__tuile')].map((t, i) => { const im = t.querySelector('img'), w = t.style.width;
        return { cle: im.dataset.cle, lazy: im.getAttribute('loading'), alt: im.getAttribute('alt'), sizes: [...t.querySelectorAll('source, img')].every(s => s.getAttribute('sizes') === w), sources: t.querySelectorAll('source').length, label: t.querySelector('.fiche__agrandir').getAttribute('aria-label'), n: i + 1 }; }));
      ok(attrs.length === N && attrs.every((a, j) => a.cle === autres[j] && a.lazy === 'lazy' && a.alt === '' && a.sizes && a.sources === 2 && a.label === `Agrandir la photo ${j + 1} sur ${N}`),
        `mosaïque : les clés ${autres.join(' ')} dans l'ordre, chargement paresseux, texte alternatif vide, sizes = largeur de la tuile sur les deux <source> et l'<img>, boutons « Agrandir la photo n sur ${N} »`);
      for (const p of [site.p, maq.p]) await p.evaluate(() => document.querySelectorAll('.fiche__tuile').forEach((t, i) => t.setAttribute('data-n', String(i + 1))));
      const servies = [], ecarts = [];
      for (let j = 1; j <= N; j++) {
        const sel = `.fiche__tuile[data-n="${j}"]`;
        const cs = await captureSection(site.p, sel), cm = await captureSection(maq.p, sel);
        const ti = await site.p.evaluate(s => { const t = document.querySelector(s); return { w: t.getBoundingClientRect().width, src: t.querySelector('img').currentSrc }; }, sel);
        const sv = await tailleServie(ti.src);
        servies.push({ j, w: ti.w, servie: sv.largeur, format: sv.format });
        const e = await ecartMoyen(`${nom}-tuile-${j}`, cs, cm, FLOU_FICHE);
        ecarts.push({ j, ...e });
      }
      ok(servies.every(s => s.servie >= s.w - 0.01), `mosaïque : chaque photo servie au moins aussi large que sa tuile à 1× — ${servies.map(s => `${s.servie} (${s.format}) pour ${Math.round(s.w)}`).join(', ')}`);
      ok(ecarts.every(e => e.ok), `mosaïque : captures des ${N} tuiles comparées avec tolérance, floutées (sigma ${FLOU_FICHE}) — écart moyen le plus fort ${Math.max(...ecarts.flatMap(e => e.moyennes || [99]))} sur 255 (tolérance ${TOLERANCE_PHOTO})` + (ecarts.every(e => e.ok) ? '' : ' — ' + ecarts.filter(e => !e.ok).map(e => `tuile ${e.j} : ${e.detail}`).join(' ; ')));

      // les photos masquées : captures identiques au pixel près de la colonne de gauche (titre, infos, chapitres ; au téléphone, .fiche__gauche s'efface,
      // display: contents — ses trois blocs un à un), de « Photos », des voisins, puis du pied de page
      await masquerPhotos(site.p, true); await masquerPhotos(maq.p, true);
      for (const sel of [...(tel ? ['.fiche__titre', '.fiche__faits', '.fiche__chapitres'] : ['.fiche__gauche']), '.fiche__autres .eyebrow', '.fiche__voisins']) {
        const c = await comparer(`${nom}-${slug(sel)}`, await captureSection(site.p, sel), await captureSection(maq.p, sel));
        ok(c.differents === 0, `${sel} : capture identique au pixel près, les photos masquées (${c.taille})` + (c.differents ? ' — ' + c.detail : ''));
      }
      await haut(site.p); await haut(maq.p);
      const bs = await boites(site.p, PIED, '.site-footer'), bm = await boites(maq.p, PIED, '.site-footer');
      ok((await preparerPied(site.p)) && (await preparerPied(maq.p)), 'pied de page : entier dans la fenêtre, haut calé sur un pixel entier des deux côtés (pour la capture)');
      const f = await comparer(`${nom}-pied`, await capture(site.p, '.site-footer'), await capture(maq.p, '.site-footer'));
      ok(f.differents === 0, `pied de page : capture de .site-footer identique au pixel près (${f.taille})` + (f.differents ? ' — ' + f.detail : ''));
      memesBoites(bs, bm, 'pied de page', 'le haut de la section');
      await masquerPhotos(site.p, false); await masquerPhotos(maq.p, false);

      // la visionneuse : rien d'elle n'est chargé avant la première ouverture (la page parcourue, les photos de la mosaïque chargées) ; clic sur la troisième
      // tuile (la dernière s'il y en a moins) → ouverte sur sa photo, « 3 / N », entière dans le cadre 4:3 ; → puis ← ; de la dernière à la première ; Tab
      // et Maj+Tab restent dedans ; Échap la ferme et rend le focus à la tuile. Mêmes étapes dans la maquette : mêmes compteurs, mêmes photos, mêmes boîtes.
      const grandes = await site.p.evaluate(() => [...document.querySelectorAll('.fiche__agrandir')].map(b => new URL(b.dataset.grande, location.href).href));
      const avant = site.requetes.filter(u => grandes.includes(u)), imgsAvant = await site.p.evaluate(() => document.querySelectorAll('.visio img').length);
      ok(!avant.length && !imgsAvant && grandes.length === N && grandes.every(u => u.endsWith('.webp')), `visionneuse : aucune de ses ${N} photos chargée avant la première ouverture (${site.requetes.length} requêtes, la page parcourue ; aucune <img> dans la visionneuse)` + (avant.length ? ' — chargées : ' + avant.join(', ') : ''));
      const s = Math.min(3, N);
      const suite = async p => {
        const r = [];
        await p.locator('.fiche__agrandir').nth(s - 1).click(); await p.waitForTimeout(150);
        await p.waitForFunction(() => { const vp = document.querySelector('.visio__piste'), i = vp.children[Math.round(vp.scrollLeft / vp.clientWidth)]; return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 5000 }).catch(() => {});
        r.push(await etatVisio(p));
        const vb = await boites(p, VISIO, '.visio');
        if (!tel) { await p.click('.visio [data-v-suiv]'); await p.waitForTimeout(150); r.push(await etatVisio(p)); await p.click('.visio [data-v-prec]'); await p.waitForTimeout(150); r.push(await etatVisio(p)); }
        await p.keyboard.press('ArrowRight'); await p.waitForTimeout(100); r.push(await etatVisio(p));
        await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(100); r.push(await etatVisio(p));
        for (let k = s; k < N; k++) { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(60); }
        r.push(await etatVisio(p));
        await p.keyboard.press('ArrowRight'); await p.waitForTimeout(100); r.push(await etatVisio(p));
        const tab = [];
        for (let k = 0; k < 7; k++) { await p.keyboard.press(k < 5 ? 'Tab' : 'Shift+Tab'); tab.push((await etatVisio(p)).focus); }
        await p.keyboard.press('Escape'); await p.waitForTimeout(100);
        const fin = await etatVisio(p);
        return { r, vb, tab, fin };
      };
      const vs = await suite(site.p), vm = await suite(maq.p);
      const v1 = vs.r[0], cpts = vs.r.map(x => x.cpt), photos = vs.r.map(x => x.photo);
      const cptsMaq = vm.r.map(x => x.cpt), photosMaq = vm.r.map(x => x.photo);
      ok(v1.ouvert && v1.corps && v1.cpt === `${s} / ${N}` && v1.photo === s && v1.charge && v1.legende === '' && v1.fit === 'contain' && Math.abs(v1.ratio - 4 / 3) < 0.01 && v1.entiere && v1.dansFenetre && v1.compteurVisible && v1.focus === 'visio',
        `visionneuse : clic sur la tuile ${s} → ouverte sur sa photo (« ${v1.cpt} », ${grandes[s - 1].replace(/^.*\//, '')}, chargée), sans légende, entière dans le cadre 4:3 (object-fit ${v1.fit}, cadre ${v1.ratio.toFixed(3)}), le cadre et le compteur dans la fenêtre, focus sur « Fermer »`);
      const attenduCpts = [...(tel ? [] : [`${s % N + 1} / ${N}`, `${s} / ${N}`]), `${s % N + 1} / ${N}`, `${s} / ${N}`, `${N} / ${N}`, `1 / ${N}`];
      ok(JSON.stringify(cpts.slice(1)) === JSON.stringify(attenduCpts) && photos.slice(1).every((ph, k) => ph === +cpts[k + 1].split(' / ')[0]) && JSON.stringify(cpts) === JSON.stringify(cptsMaq) && JSON.stringify(photos) === JSON.stringify(photosMaq),
        `visionneuse : ${tel ? '' : 'flèches → puis ←, '}→ puis ← au clavier, jusqu'à la dernière puis la boucle vers la première — ${cpts.join(' → ')} ; mêmes compteurs et mêmes photos que la maquette`);
      // les boîtes de la visionneuse ouverte, comme dans la maquette — sauf, si la photo est en hauteur, celles du cadre et de ce qui le suit : la maquette
      // allonge alors son cadre au-delà du 4:3 (défaut de maquette.css), que le site garde (.visio__cadre{min-height:0}, src/styles/visionneuse.css)
      const cadreMaq = vm.r[0].ratio;
      if (Math.abs(cadreMaq - 4 / 3) < 0.01) memesBoites(vs.vb, vm.vb, 'visionneuse ouverte', 'le haut de la visionneuse');
      else {
        const sauf = o => Object.fromEntries(Object.entries(o).filter(([k]) => !/^\.visio__(cadre|bas|compteur)/.test(k)));
        memesBoites(sauf(vs.vb), sauf(vm.vb), 'visionneuse ouverte (« Fermer », flèches)', 'le haut de la visionneuse');
        ok(vs.vb['.visio__cadre'][0] === vm.vb['.visio__cadre'][0] && vs.vb['.visio__cadre'][2] === vm.vb['.visio__cadre'][2],
          `visionneuse : cadre au même x et de la même largeur que dans la maquette (${vs.vb['.visio__cadre'][2]} px), en 4:3 (${vs.vb['.visio__cadre'][2]} × ${vs.vb['.visio__cadre'][3]})`);
        console.log(`  info  maquette : sur cette photo en hauteur, son cadre s'allonge à ${vm.vb['.visio__cadre'][2]} × ${vm.vb['.visio__cadre'][3]} px (${cadreMaq.toFixed(3)} au lieu de 4:3)${vm.r[0].dansFenetre ? '' : ', hors de la fenêtre'}${vm.r[0].compteurVisible ? '' : ', compteur hors de la fenêtre'} — défaut de maquette.css que le site corrige (.visio__cadre{min-height:0}), à reporter dans la maquette`);
      }
      ok(vs.tab.every(x => x === 'visio') && !vs.fin.ouvert && !vs.fin.corps && vs.fin.focus === `Agrandir la photo ${s} sur ${N}` && vm.fin.focus === vs.fin.focus,
        `visionneuse : Tab et Maj+Tab restent dedans (${vs.tab.length} arrêts) ; Échap la ferme et rend le focus à la tuile (« ${vs.fin.focus} »)`);
      const apres = site.requetes.filter(u => grandes.includes(u));
      ok(apres.includes(grandes[s - 1]), `visionneuse : sa photo chargée à l'ouverture seulement (${[...new Set(apres)].length} sur ${N} après la première ouverture)`);

      // l'en-tête, le titre de l'onglet, les voisins
      const nav = await site.p.evaluate(() => [...document.querySelectorAll('.site-nav a')].map(a => `${a.textContent}${a.classList.contains('is-active') ? ' actif' : ''} → ${a.getAttribute('href')}`).join(' | '));
      const courant = await site.p.evaluate(() => document.querySelectorAll('[aria-current]').length);
      ok(nav === 'Réalisations actif → /realisations | Engagements → /engagements | Contact → #contact' && !courant, `navigation : ${nav} — « Réalisations » actif (le trait), sans aria-current (aucun dans la page)`);
      const page = await site.p.evaluate(() => ({ page: document.documentElement.dataset.page, title: document.title, description: !!document.querySelector('meta[name="description"]') }));
      ok(page.page === 'fiche' && page.title === `${d.name} — Perpetual` && !page.description, `html data-page="${page.page}", titre de l'onglet « ${page.title} », pas de description (lot 7)`);
      const voisins = await site.p.evaluate(() => [...document.querySelectorAll('.fiche__voisin')].map(a => `${a.getAttribute('href')} : ${a.querySelector('.eyebrow').textContent} « ${a.querySelector('.suivant__nom').textContent} »`).join(' | '));
      const reponses = await Promise.all([prec, suiv].map(async x => (await fetch(`${SITE}/realisations/${x.id}`)).status));
      ok(voisins === `/realisations/${prec.id} : Projet précédent « ← ${prec.name} » | /realisations/${suiv.id} : Projet suivant « ${suiv.name} → »` && reponses.every(r => r === 200),
        `voisins, en boucle dans l'ordre du champ order : ${voisins.replace(' | ', ' ; ')} (${reponses.join(', ')})`);
      boucle[d.id] = voisins;
      await controlesPage(site, chemin, format[0], ['400 17px "Instrument Sans"', '500 17px "Instrument Sans"', '400 64px Newsreader', 'italic 400 22px Newsreader']);

      // à 1521 px, la fenêtre passe à 1280 px de large : la mosaïque est replacée, ses tuiles toujours aux mêmes boîtes que dans la maquette
      if (format[0] === 1521) {
        await haut(site.p); await haut(maq.p);
        await site.p.setViewportSize({ width: 1280, height: format[1] }); await maq.p.setViewportSize({ width: 1280, height: format[1] });
        for (const p of [site.p, maq.p]) await p.waitForFunction(l => document.querySelector('.fiche__mosaique').getBoundingClientRect().width !== l, mts.largeur, { timeout: 2000 }).catch(() => {});
        await site.p.waitForTimeout(400);
        const rs = await tuilesDe(site.p), rm = await tuilesDe(maq.p);
        ok(memesTuiles(rs, rm) && JSON.stringify(rs.boites) !== JSON.stringify(mts.boites) && rs.largeur < mts.largeur,
          `mosaïque, de 1521 à 1280 px de large : replacée (${Math.round(mts.largeur)} → ${Math.round(rs.largeur)} px), mêmes rangées [${rs.rangs.split(' ').join(', ')}] et mêmes boîtes que la maquette (${rs.boites.map(b => `${b[2]}×${b[3]}`).join(', ')})`);
      }
      await site.ctx.close(); await maq.ctx.close();
    }
    // les photos de la visionneuse : WebP, 1 800 px au plus sur le grand côté, jamais au-delà de la source
    {
      const pg = await ouvrir(SITE + chemin, FORMATS[0], { reducedMotion: 'reduce' });
      const grandes = await pg.p.evaluate(() => [...document.querySelectorAll('.fiche__agrandir')].map(b => new URL(b.dataset.grande, location.href).href));
      await pg.ctx.close();
      const tailles = await Promise.all(grandes.map(async (u, j) => ({ ...(await tailleServie(u)), source: await tailleSource(autres[j]) })));
      ok(tailles.every(t => t.format === 'webp' && Math.max(t.largeur, t.hauteur) <= 1800 && t.largeur <= t.source.largeur && t.hauteur <= t.source.hauteur),
        `${d.name}, visionneuse : ${tailles.length} photos en WebP, 1 800 px au plus, jamais au-delà de la source — ${tailles.map(t => `${t.largeur} × ${t.hauteur}`).join(', ')}`);
    }
  }
  // la boucle des voisins, de bout en bout, dans l'ordre du champ order (The Bank → Data Box → Community → Ateliers 118 → The Bank)
  {
    const ordre = DETAILLES.map(d => d.id), suivants = ordre.map(id => boucle[id].match(/\| \/realisations\/([a-z0-9-]+)/)[1]);
    ok(ordre.join(' ') === 'the-bank data-box community ateliers-118' && suivants.every((s, k) => s === ordre[(k + 1) % ordre.length]),
      `fiches, projet suivant en boucle dans l'ordre du champ order : ${ordre.map((id, k) => `${id} → ${suivants[k]}`).join(' · ')}`);
  }
  // à 2× : la photo de tête servie assez grande (la fenêtre × 2), ou la plus grande version disponible
  console.log('\nFiches à 2×');
  for (const d of DETAILLES) for (const format of FORMATS) {
    const r = await ouvrir(`${SITE}/realisations/${d.id}`, format, { deviceScaleFactor: 2, reducedMotion: 'reduce' });
    const t = await infosTete(r.p), sv = await tailleServie(t.src), echelle = +Math.max(2 * t.w / sv.largeur, 2 * t.h / sv.hauteur).toFixed(3);
    ok(echelle <= 1 || sv.largeur === t.maxSrcset, `${d.name}, ${fmt(format)} à 2× : photo de tête ${sv.nom} (${sv.format} ${sv.largeur} × ${sv.hauteur}) pour ${Math.round(t.w)} × ${Math.round(t.h)} px × 2 — ${echelle <= 1 ? `assez grande (échelle ${echelle})` : `la plus grande version disponible (${t.maxSrcset} px)`}`);
    await r.ctx.close();
  }

  // ---------- tout dist/ ----------
  console.log('\ndist/');
  {
    const DIST = path.join(REPO, 'dist');
    const htmls = []; (function marcher(d) { for (const f of fs.readdirSync(d)) { const q = path.join(d, f); if (fs.statSync(q).isDirectory()) marcher(q); else if (f.endsWith('.html')) htmls.push(posix(path.relative(DIST, q))); } })(DIST);
    const lire = f => fs.readFileSync(path.join(DIST, f), 'utf8');
    const siteJson = JSON.parse(fs.readFileSync(path.join(REPO, 'data/site.json'), 'utf8'));
    // aucune occurrence de « julien@ » ; chaque mailto égal à site.email
    const juliens = htmls.filter(f => lire(f).includes('julien@')), mailtos = htmls.flatMap(f => [...lire(f).matchAll(/mailto:([^"'\s<>]+)/g)].map(x => x[1]));
    ok(!juliens.length && mailtos.length > 0 && mailtos.every(m => m === siteJson.email), `${htmls.length} pages : aucune occurrence de « julien@ » ; ${mailtos.length} mailto, tous vers ${siteJson.email}` + (juliens.length ? ' — julien@ dans ' + juliens.join(', ') : ''));
    // aucun commentaire venu de content/ (les notes internes des fichiers Markdown)
    const notes = fs.readdirSync(path.join(REPO, 'content')).filter(f => f.endsWith('.md')).flatMap(f => [...fs.readFileSync(path.join(REPO, 'content', f), 'utf8').matchAll(/<!--([\s\S]*?)-->/g)].map(x => x[1].trim()));
    const commentaires = htmls.flatMap(f => [...lire(f).matchAll(/<!--([\s\S]*?)-->/g)].map(x => ({ f, c: x[1].trim() })));
    const fuites = commentaires.filter(c => notes.some(n => n && (c.c.includes(n.slice(0, 40)) || n.includes(c.c.slice(0, 40)))));
    ok(!fuites.length && !commentaires.length, `aucun commentaire HTML dans les pages (${notes.length} notes dans content/, ${commentaires.length} commentaires publiés)` + (commentaires.length ? ' — ' + commentaires.map(c => `${c.f} : ${c.c.slice(0, 50)}`).join(' ; ') : ''));
    // espaces insécables avant « : » dans les textes rendus (le <main> de chaque page, balises et scripts retirés)
    // (les pages de ce lot, dont les textes passent par enLigne ou le plugin ; la Home et /dev/photos insèrent leurs textes tels quels, comme la maquette : en information)
    const LOT = ['engagements.html', 'mentions-legales.html', 'confidentialite.html', '404.html'];
    const textes = htmls.map(f => ({ f, t: (lire(f).match(/<main>([\s\S]*?)<\/main>/) || ['', ''])[1].replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, '') }));
    const simples = textes.filter(x => LOT.includes(x.f) && / :/.test(x.t)), insecables = textes.filter(x => LOT.includes(x.f)).reduce((n, x) => n + (x.t.match(/\u00A0:/g) || []).length, 0), autres = textes.filter(x => !LOT.includes(x.f) && / :/.test(x.t)).map(x => x.f);
    ok(LOT.every(f => htmls.includes(f)) && !simples.length && insecables > 0, `espaces insécables avant « : » dans les textes rendus des quatre pages (${insecables} « : », aucune espace simple devant)` + (simples.length ? ' — espace simple dans ' + simples.map(x => x.f).join(', ') : '') + (autres.length ? ` ; textes insérés tels quels, non vérifiés : ${autres.join(', ')}` : ''));
    // tous les liens internes répondent, sauf /realisations (lot 5 : listé, pas compté comme échec)
    const liens = new Map();
    for (const f of htmls) for (const m of lire(f).matchAll(/<a [^>]*href="([^"]+)"/g)) { const h = m[1]; if (/^(https?:|mailto:|tel:)/.test(h)) continue; const cible = h.startsWith('#') ? '/' + f.replace(/index\.html$/, '').replace(/\.html$/, '') + h : h; liens.set(cible, (liens.get(cible) || new Set()).add(f)); }
    const reponses = [];
    for (const [cible] of liens) { const chemin = cible.replace(/#.*$/, ''), r = await fetch(SITE + chemin), html = r.ok ? await r.text() : ''; const ancre = cible.includes('#') ? cible.slice(cible.indexOf('#') + 1) : null;
      reponses.push({ cible, chemin, statut: r.status, ancre: ancre ? new RegExp(`id="${ancre}"`).test(html) : true }); }
    const attendus = reponses.filter(r => r.chemin !== '/realisations'), echecs = attendus.filter(r => r.statut !== 200 || !r.ancre), real = reponses.find(r => r.chemin === '/realisations');
    ok(!echecs.length && attendus.length >= 5, `${reponses.length} liens internes : ${attendus.length} répondent (ancres comprises)${real ? ` ; /realisations → ${real.statut} (lot 5, message 2 : listé, pas compté)` : ''}` + (echecs.length ? ' — en échec : ' + echecs.map(r => `${r.cible} (${r.statut}${r.ancre ? '' : ', ancre absente'})`).join(', ') : ''));
    // aucun lien de la maquette vers ses fiches (projet-<id>.html) dans le site : les fiches sont à /realisations/<id>
    const versMaquette = htmls.filter(f => /href="[^"]*projet-[a-z0-9-]+\.html/.test(lire(f)));
    ok(!versMaquette.length && htmls.filter(f => f.startsWith('realisations/')).length === 4, `aucun lien vers projet-<id>.html (les fiches de la maquette) dans les ${htmls.length} pages ; les quatre fiches dans dist/realisations/` + (versMaquette.length ? ' — dans ' + versMaquette.join(', ') : ''));
    // une adresse inconnue sert la 404 (astro preview, comme GitHub Pages), en chemins absolus
    const r404 = await fetch(SITE + '/une/adresse/inconnue'), h404 = await r404.text();
    const relatifs = [...h404.matchAll(/(?:href|src)="([^"]+)"/g)].map(x => x[1]).filter(u => !/^(\/|https?:|mailto:|#)/.test(u));
    ok(r404.status === 404 && h404.includes('Page introuvable') && !relatifs.length, `une adresse inconnue répond ${r404.status} avec la page « Page introuvable » (dist/404.html), chemins absolus partout` + (relatifs.length ? ' — relatifs : ' + relatifs.join(', ') : ''));
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
