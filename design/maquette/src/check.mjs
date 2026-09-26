// Vérifications de la maquette (Playwright + Chromium) : premier écran (structure F), débordement, effet de chaque bascule,
// valeurs figées et alignement (gel de la Home du 23/09 : signature, espacements, pied de page), en-tête (Φ, wordmark, limite de 1600 px) et pied de page
// sur la même grille (les trois pages), carte des réalisations, logos partenaires, photo 2800 px, srcset de l'aperçu des 4, mode présentation,
// page sans JavaScript, polices, contrastes ; puis la fiche The Bank
// (débordement horizontal, polices, gouttière du titre, premier écran et photo de tête, titres de chapitre, paire de photos, rythme) et la vue Réalisations,
// proposition P2 (débordement et erreurs, alignement sur la grille large, ouverture, blocs des 4 projets, programme agences, rangée en boucle, photos d'un bien,
// visionneuse, bascules 22 et 23, mobile, sans JavaScript).
// Usage, depuis la racine du dépôt : NODE_PATH=$(npm root -g) node design/maquette/src/check.mjs
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)('playwright');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const MAQ = path.resolve(HERE, '..');
const URL = page => 'file://' + path.join(MAQ, page + '.html');
let ko = 0;
const ok = (cond, msg) => { console.log((cond ? '  ok  ' : '  KO  ') + msg); if (!cond) ko++; };

// Sur certains environnements, un Chromium pré-installé (PLAYWRIGHT_BROWSERS_PATH) peut être une révision différente de celle que playwright
// vient de télécharger côté npm ; s'il est là, on le pointe explicitement plutôt que de retélécharger un navigateur.
const CHROMIUM_PREINSTALLE = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(fs.existsSync(CHROMIUM_PREINSTALLE) ? { executablePath: CHROMIUM_PREINSTALLE } : {});
async function ouvrir(etat, viewport = [1440, 900], options = {}, page = 'index') {
  const ctx = await browser.newContext({ viewport: { width: viewport[0], height: viewport[1] }, reducedMotion: 'reduce', ...options });
  const p = await ctx.newPage();
  const erreurs = [];   // erreurs de script et de console (un fichier manquant en file:// en est une)
  p.on('pageerror', e => erreurs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') erreurs.push(m.text()); });
  await p.goto(URL(page) + (etat ? '?' + etat : ''), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  return { p, ctx, erreurs };
}
const style = (p, sel, prop) => p.evaluate(([s, pr]) => { const el = document.querySelector(s); return el ? getComputedStyle(el)[pr] : null; }, [sel, prop]);
const rect = (p, sel) => p.evaluate(s => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) }; }, sel);
const largeur = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
// text-wrap: pretty — Chromium l'expose en text-wrap (raccourci) ou text-wrap-style selon la version
const pretty = (p, sel) => p.evaluate(s => { const c = getComputedStyle(document.querySelector(s)); return c.textWrapStyle === 'pretty' || c.textWrap === 'pretty'; }, sel);
// Photos des blocs des 4 projets (vue Réalisations) et de l'aperçu de la liste des 4 (Home) : clé (<clé>-s.jpg → clé), srcset, sizes, source servie, point focal posé en style,
// cadre (boîte de mise en page, insensible au zoom du survol) et l'échelle du rendu en object-fit: cover à 1× — max(cadre ÷ pixels du fichier servi) sur les deux axes,
// > 1 = photo agrandie. Les pixels sont lus dans l'en-tête JPEG du fichier servi : naturalWidth est corrigé de la densité sur une <img srcset>, il ne convient pas.
// Les images paresseuses sont amenées à l'écran et attendues.
const IMG_DIR = path.resolve(MAQ, '../directions/img');
function tailleJpeg(file) {
  const b = fs.readFileSync(file);
  for (let i = 2; i < b.length - 9;) {
    if (b[i] !== 0xFF) { i++; continue; }
    const m = b[i + 1];
    if (m === 0xFF) { i++; continue; }
    if (m === 0xD8 || m === 0x01 || (m >= 0xD0 && m <= 0xD7)) { i += 2; continue; }
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) };
    i += 2 + b.readUInt16BE(i + 2);
  }
  throw new Error(`${file} : dimensions JPEG introuvables`);
}
async function photosImg(p, sel) {
  await p.evaluate(async s => {
    const imgs = [...document.querySelectorAll(s)];
    for (const i of imgs) { i.scrollIntoView(); await new Promise(r => setTimeout(r, 50)); }
    await Promise.all(imgs.map(i => (i.complete && i.naturalWidth) ? null : Promise.race([new Promise(r => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); }), new Promise(r => setTimeout(r, 4000))])));
    await new Promise(r => requestAnimationFrame(r));
  }, sel);
  const liste = await p.evaluate(s => [...document.querySelectorAll(s)].map(i => ({ cle: i.getAttribute('src').replace(/^.*\//, '').replace(/-s\.jpg$/, ''), srcset: i.getAttribute('srcset') || '', sizes: i.getAttribute('sizes') || '', servi: i.currentSrc.replace(/^.*\//, ''), focal: i.style.objectPosition, w: i.offsetWidth, h: i.offsetHeight })), sel);
  return liste.map(i => { const t = tailleJpeg(path.join(IMG_DIR, i.servi)); return { ...i, pixels: `${t.width}×${t.height}`, echelle: +Math.max(i.w / t.width, i.h / t.height).toFixed(3) }; });
}
// srcset attendu : <clé>-s.jpg (800 px) et <clé>.jpg (1800 px) avec leur largeur ; le 1800 px doit exister (design/directions/src/reduire-photos.mjs --grand <original>).
function verifierSrcset(liste, nom) {
  for (const i of liste) {
    const grand = fs.existsSync(path.join(IMG_DIR, `${i.cle}.jpg`));
    ok(grand, `${nom} : ${i.cle}.jpg (1800 px) présent dans design/directions/img/` + (grand ? '' : ` — à produire : node design/directions/src/reduire-photos.mjs --grand <original ${i.cle}.jpg>, puis rebâtir`));
    if (grand) ok(new RegExp(`^[^,]*/${i.cle}-s\\.jpg \\d+w, [^,]*/${i.cle}\\.jpg \\d+w$`).test(i.srcset) && /(px|\))$/.test(i.sizes), `${nom} : ${i.cle} — srcset 800w / 1800w et sizes (${i.sizes})`);
    else ok(!i.srcset && !i.sizes, `${nom} : ${i.cle} — sans 1800 px, l'<img> n'a que le 800 px (pas de srcset)`);
  }
}

// la palette, telle que Chromium la rend
const ANTHRACITE = 'rgb(38, 35, 31)', GRIS = 'rgb(107, 101, 92)', GRIS_CHAUD = 'rgb(122, 116, 102)', OR = 'rgb(154, 122, 59)', OR_FONCE = 'rgb(138, 107, 47)', OR_CLAIR = 'rgb(184, 151, 90)',
  BRONZE = 'rgb(104, 78, 30)', PAPIER = 'rgb(249, 249, 246)', SABLE = 'rgb(246, 241, 230)', BLANC = 'rgb(255, 255, 255)', OR_DECO = 'rgb(201, 181, 138)', TRAIT_CARTE = 'rgb(214, 208, 196)';

console.log('\n1 · Premier écran — structure F : la photo porte l’accroche, la bande et ses quatre chiffres tiennent dans 900 à 1440 et dans 703 à 1366');
for (const [w, h] of [[1440, 900], [1366, 703]]) {
  for (const etat of ['', 'cadrage=haut']) {
    const { p, ctx } = await ouvrir(etat, [w, h]);
    const attendu = Math.min(560, Math.max(320, h - 270)), gauche = (w - 1200) / 2 + 40;
    const photo = await rect(p, '.hero__photo'), titre = await rect(p, '.hero__title span'), texte = await rect(p, '.hero__text'), sig = await rect(p, '.signature'), bande = await rect(p, '.stats-band');
    const nom = `${w}×${h} · ${etat || 'défaut'}`;
    ok(photo.top === 76 && photo.height === attendu && photo.width === w, `${nom} · photo pleine largeur sous l’en-tête, ${photo.height} px de haut (clamp → ${attendu})`);
    ok(titre.left === gauche && Math.abs(titre.top - (photo.top + 64)) <= 4 && titre.bottom < photo.bottom - 100 && (await style(p, '.hero__title', 'color')) === BLANC, `${nom} · accroche en blanc, en haut à gauche du container (x ${titre.left}, y ${titre.top})`);
    const par = await p.evaluate(() => [...document.querySelectorAll('.hero__text p:not(.signature)')].map(e => { const r = e.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left) }; }));
    ok(bande.top >= photo.bottom && texte.top >= bande.bottom && par.length === 2 && par[1].left > par[0].left && par[1].top === par[0].top && (await style(p, '.hero__text', 'gridTemplateColumns')).split(' ').length === 2,
      `${nom} · la bande vient juste après la photo, puis les paragraphes en deux colonnes`);
    ok(sig.left === par[1].left && sig.top >= par[1].bottom + 8 && sig.top <= par[1].bottom + 32 && sig.bottom <= texte.bottom, `${nom} · la signature est dans la colonne de droite, sous le second paragraphe (${sig.top - par[1].bottom} px dessous)`);
    const chiffres = await p.evaluate(() => [...document.querySelectorAll('.stat__value')].map(s => Math.round(s.getBoundingClientRect().bottom)));
    ok(bande.bottom <= h && chiffres.every(b => b <= h), `${nom} · la bande et ses quatre chiffres tiennent entièrement dans l’écran (bande à ${bande.bottom}, chiffres à ${chiffres.join(', ')})`);
    await ctx.close();
  }
}

console.log('\n2 · Aucun débordement horizontal');
for (const [w, h] of [[1440, 900], [1366, 703], [390, 844]]) {
  for (const etat of ['', 'cadrage=haut', 'carte=papier-contour']) {
    const { p, ctx } = await ouvrir(etat, [w, h]);
    ok((await largeur(p)) === 0, `${w} · ${etat || 'défaut'}`); await ctx.close();
  }
}

console.log('\n3 · Chaque valeur de chaque bascule change le rendu');
const tests = [
  ['cadrage=haut', p => style(p, '.hero__photo img', 'objectPosition').then(v => v === '50% 20%'), 'cadrage=haut : Community 05 en 50% 20%'],
  ['carte=papier-contour', async p => (await style(p, '.carte__pays', 'fill')) === PAPIER && (await style(p, '.carte__pays', 'stroke')) === TRAIT_CARTE && (await style(p, '.carte__pays', 'strokeWidth')) === '1px'],
];
for (const [etat, test, libelle] of tests) {
  const { p, ctx } = await ouvrir(etat);
  let res = false; try { res = await test(p); } catch (e) { res = false; }
  ok(res, libelle || etat); await ctx.close();
}
{
  // les bascules retirées le 23/09 (dont le gel de la Home : serif, graisse, cadrage=bas) : un paramètre resté dans une URL ne change plus rien
  const { p, ctx } = await ouvrir('ecran=colonnes&photo=data-box-03&accroche=droite&deco=arcs&signature=anthracite&autres=bande&pied=blanc&portee=partout&serif=source-serif&graisse=500&cadrage=bas');
  ok((await style(p, '.hero__photo', 'display')) === 'block' && ['left', 'start'].includes(await style(p, '.hero__title', 'textAlign')) && (await p.evaluate(() => document.querySelectorAll('.deco__svg').length)) === 1
    && (await style(p, '.signature', 'color')) === OR_FONCE && (await style(p, '.carte', 'display')) === 'grid' && (await style(p, '.site-footer', 'backgroundColor')) === PAPIER && (await style(p, '.h2--sans', 'fontWeight')) === '500'
    && (await style(p, '.hero__title', 'fontFamily')).startsWith('Newsreader') && (await style(p, '.hero__title', 'fontWeight')) === '400' && (await style(p, '.stat__value', 'fontWeight')) === '400' && (await style(p, '.hero__photo img', 'objectPosition')) === '50% 50%',
    'paramètres des bascules retirées (ecran, photo, accroche, deco, signature, autres, pied, portee, serif, graisse, cadrage=bas) : sans effet');
  await ctx.close();
}

console.log('\n4 · Valeurs figées et alignement (valeurs par défaut)');
{
  const { p, ctx } = await ouvrir('');
  ok((await style(p, 'body', 'fontFamily')).startsWith('"Instrument Sans"') && (await style(p, '.hero__title', 'fontFamily')).startsWith('Newsreader'), 'sans Instrument Sans, serif Newsreader');
  const h2 = await p.evaluate(() => [...document.querySelectorAll('.h2')].map(h => { const s = getComputedStyle(h); return { cls: h.className, texte: h.textContent, ff: s.fontFamily, fw: s.fontWeight, fs: s.fontSize }; }));
  const graphique = h2.find(h => h.cls === 'h2 h2--sans'), carteH2 = h2.find(h => h.cls === 'h2 h2--serif');
  ok(h2.length === 2 && graphique && /m² en cours de transformation/.test(graphique.texte) && graphique.ff.startsWith('"Instrument Sans"') && graphique.fw === '500' && graphique.fs === '28px', `titre du graphique : sans medium 28 px (.h2--sans) — « ${graphique && graphique.texte} »`);
  ok(carteH2 && carteH2.texte === 'Vingt adresses, de Haaltert à Welkenraedt.' && carteH2.ff.startsWith('Newsreader') && carteH2.fw === '400' && carteH2.fs === '34px', 'titre de la carte : serif 34 px (.h2--serif)');
  ok(await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--fs-chapitre').trim() === '26px' && getComputedStyle(document.documentElement).getPropertyValue('--font-titres') === ''), '--fs-chapitre conservée (à décider sur la fiche), --font-titres retirée');
  ok((await style(p, '.hero__title', 'fontWeight')) === '400' && (await style(p, '.stat__value', 'fontWeight')) === '400' && (await style(p, '.h2--serif', 'fontWeight')) === '400' && (await style(p, '.four__name', 'fontWeight')) === '400'
    && (await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--poids-serif') === '')) && !(await p.evaluate(() => [...document.styleSheets].some(ss => { try { return [...ss.cssRules].some(r => r.cssText.includes('Source Serif')); } catch (e) { return false; } }))),
    'serif figée : Newsreader 400 partout, plus de seconde serif ni de --poids-serif');
  // gel de la Home (23/09) : espacements
  const gel = await p.evaluate(() => {
    const b = s => { const r = document.querySelector(s).getBoundingClientRect(); return { top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY) }; };
    const p1 = b('.hero__text > p'), titre = b('.section--chart .h2'), pied = b('.site-footer'), nom = b('.footer__name'), nav = b('.footer__nav'), legal = b('.footer__legal'), quote = b('.footer__quote'), contact = b('.footer__contact');
    return { texteTitre: titre.top - p1.bottom, piedHaut: nom.top - pied.top, navFilet: legal.top - Math.max(nav.bottom, quote.bottom, contact.bottom), dernier: document.querySelector('.footer__nav a:last-child').textContent, filet: getComputedStyle(document.querySelector('.footer__legal')).borderTopWidth };
  });
  ok(gel.texteTitre >= 60 && gel.texteTitre <= 68, `64 px entre la fin du bloc de texte et « 11 150 m² … » (${gel.texteTitre} px)`);
  ok(gel.piedHaut === 48 && gel.navFilet === 32 && gel.dernier === 'Confidentialité' && gel.filet === '1px', `pied de page : 48 px en haut, ${gel.navFilet} px entre « ${gel.dernier} » et le filet du bas`);
  ok((await style(p, '.stats-band', 'backgroundColor')) === PAPIER, 'bande : surface papier');
  ok((await style(p, '.stat__value', 'color')) === OR, 'chiffres clés : or');
  const largeurEtiquette = parseFloat(await style(p, '.stat__label', 'maxWidth'));
  ok((await style(p, '.stat__label', 'color')) === GRIS_CHAUD && largeurEtiquette > 195 && largeurEtiquette < 215, `étiquettes des chiffres : gris chaud, figé, 22ch (${largeurEtiquette}px)`);
  ok((await p.evaluate(() => document.querySelectorAll('.stat__label')[1].getBoundingClientRect().height)) < 45, '« Agences bancaires transformées en quatre ans » ne se déchire plus sur trois lignes (22ch)');
  const deco = await p.evaluate(() => [...document.querySelectorAll('.deco__svg')].map(s => ({ cls: s.getAttribute('class'), display: getComputedStyle(s).display, color: getComputedStyle(s).color, cercles: s.querySelectorAll('circle').length })));
  ok(deco.length === 1 && /deco--anneaux/.test(deco[0].cls) && deco[0].display === 'block' && deco[0].color === OR_DECO && deco[0].cercles === 2, 'élément de la bande : anneaux, figés, or #C9B58A (les arcs ne sont plus dans la page)');
  ok((await style(p, '.bar__fill', 'backgroundColor')) === ANTHRACITE && (await style(p, '.bar__track', 'backgroundColor')) === SABLE, 'graphique : barres anthracite sur piste sable (--surface-piste détachée de --surface)');
  ok((await style(p, '.carte__pt', 'fill')) === ANTHRACITE && (await style(p, '.carte__pays', 'fill')) === SABLE && (await style(p, '.carte__pays', 'stroke')) === 'none', 'carte : points anthracite, fond du pays sable par défaut (bascule 15a)');
  ok((await style(p, '.site-footer', 'backgroundColor')) === PAPIER && (await style(p, '.site-footer', 'borderTopStyle')) === 'none', 'pied de page : fond papier, sans filet en haut (figé)');
  ok((await style(p, '.autres__lien', 'color')) === OR_FONCE && (await p.evaluate(() => document.querySelector('.autres__lien').textContent)) === 'Toutes les réalisations →', 'lien « Toutes les réalisations → » : or foncé');
  const libelles = await p.evaluate(() => ({ nav: document.querySelector('.site-nav a').textContent, plan: document.querySelector('.footer__nav a').textContent, liste: document.querySelector('.section--projets .eyebrow').textContent, carte: document.querySelector('.section--autres .eyebrow').textContent,
    chiffre: [...document.querySelectorAll('.stat__label')].some(l => l.textContent === 'Projets en cours'), onglet: [...document.querySelectorAll('.mq__pages a')].map(a => a.textContent).join(' · ') }));
  const siteNav = JSON.parse(fs.readFileSync(path.resolve(MAQ, '../../data/site.json'), 'utf8')).nav.find(n => n.href === '/realisations').label;
  ok(libelles.nav === siteNav && libelles.plan === siteNav && libelles.liste === 'Réalisations' && libelles.carte === 'Réalisations' && libelles.chiffre && libelles.onglet === 'Home · Fiche · Réalisations',
    `libellés : navigation et plan « ${libelles.nav} » (data/site.json), liste des 4 « ${libelles.liste} », « Projets en cours » inchangé, onglets ${libelles.onglet}`);
  const photos = await p.evaluate(() => [...document.querySelectorAll('.hero__photo img')].map(i => ({ key: i.dataset.photo, display: getComputedStyle(i).display, focal: getComputedStyle(i).objectPosition })));
  ok(photos.length === 1 && photos[0].key === 'community-05' && photos[0].display === 'block' && photos[0].focal === '50% 50%', `photo du premier écran : Community 05 seule, cadrage centre par défaut (${photos.map(x => x.focal).join(' · ')})`);
  ok(['left', 'start'].includes(await style(p, '.hero__title', 'textAlign')) && /at 0(px)? 0(px)?,/.test(await p.evaluate(() => getComputedStyle(document.querySelector('.hero__photo'), '::after').backgroundImage)) && !(await p.evaluate(() => [...document.querySelectorAll('head style')].some(s => /9d/.test(s.textContent)))), 'accroche à gauche, voile depuis le coin haut-gauche (plus d’aiguillage photo → côté dans la page)');
  ok((await style(p, '.footer__mail', 'color')) === ANTHRACITE && (await style(p, '.footer__mail', 'borderBottom')) === `1px solid ${OR_CLAIR}`, 'mail du pied de page : anthracite, souligné (--c-mail distinct de --c-lien)');
  ok((await style(p, '.signature', 'color')) === OR_FONCE && (await style(p, '.signature', 'fontStyle')) === 'italic', 'signature : or (or foncé), figée, italique');
  ok((await style(p, '.logo__mark', 'color')) === BRONZE && (await style(p, '.logo__mark', 'fill')) === BRONZE, 'Φ de l’en-tête : bronze');
  ok((await p.evaluate(() => getComputedStyle(document.querySelector('.site-nav a'), '::after').backgroundColor)) === OR, 'trait de survol : or');
  const wm = await p.evaluate(() => { const t = document.querySelector('.logo__texte'), s = getComputedStyle(t); return { trace: !!document.querySelector('.logo__trace'), display: s.display, ff: s.fontFamily, fs: s.fontSize, ls: parseFloat(s.letterSpacing), fw: s.fontWeight, tt: s.textTransform, w: Math.round(t.getBoundingClientRect().width) }; });
  ok(!wm.trace && wm.display !== 'none' && /^Jost/.test(wm.ff) && wm.fs === '27.7px' && Math.abs(wm.ls - 27.7 * 0.18) < 0.05 && wm.fw === '400' && wm.tt === 'uppercase', `wordmark : Jost 400, capitales, 0,18 em, sans tracé PNG (${wm.w} px de large)`);
  const hd = await p.evaluate(() => ({ header: document.querySelector('.site-header').getBoundingClientRect().width, logo: document.querySelector('.logo').getBoundingClientRect().left, nav: document.querySelector('.site-nav').getBoundingClientRect().right }));
  ok(hd.header === 1440 && Math.round(hd.logo) === 40 && Math.round(hd.nav) === 1400, `en-tête pleine largeur (logo à ${Math.round(hd.logo)} px, liens à ${1440 - Math.round(hd.nav)} px du bord)`);
  ok((await style(p, '.section--projets', 'display')) === 'block' && (await p.evaluate(() => document.querySelectorAll('.four__row').length)) === 4, 'section projets : liste des 4 (bascule 11 figée)');
  ok((await style(p, '.partner__couleur', 'display')) === 'block' && !(await p.evaluate(() => document.querySelector('.partner__encre'))), 'logos partenaires : couleur, figés (plus d’encre inline)');
  const cles = await p.evaluate(() => [...document.querySelectorAll('.mq__b')].map(f => f.dataset.cle));
  const inactives = await p.evaluate(() => [...document.querySelectorAll('.mq__b.is-inactif')].map(f => f.dataset.cle));
  ok(cles.join(' ') === 'cadrage carte papier bas' && inactives.join(' ') === 'papier bas', 'panneau : ' + cles.join(' · ') + ' (20 et 21 retirées ; 22 et 23, vue Réalisations, sans effet sur la Home)');
  ok(await pretty(p, '.four__line'), 'liste des 4 : text-wrap: pretty sur les lignes');
  // aperçu de la liste des 4 : srcset 800 / 1800 px (revue du 23/09) ; à 1×, aucune photo agrandie — Data Box 02 (800 × 450, cadre 440 × 550) reçoit le 1800 px
  const apercu = await photosImg(p, '.four__preview img');
  ok(apercu.length === 4 && apercu.map(i => i.cle).join(' ') === 'ateliers-118-05 the-bank-01 data-box-02 community-05', 'aperçu de la liste des 4 : ' + apercu.map(i => i.cle).join(' · '));
  verifierSrcset(apercu, 'aperçu');
  ok(apercu.every(i => i.w === 440 && i.h === 550), `aperçu : cadre 440 × 550 (${apercu.map(i => i.w + '×' + i.h).join(', ')})`);
  ok(apercu.every(i => i.echelle <= 1), `aperçu à 1× : aucune photo agrandie (${apercu.map(i => `${i.cle} ${i.pixels} ×${i.echelle}`).join(', ')})`);
  ok(apercu[2].servi === 'data-box-02.jpg', `aperçu à 1× : Data Box 02 est servie en 1800 px (${apercu[2].servi}), plus en 800 × 450 agrandi ×1,22`);
  const liens = await p.evaluate(() => ({ nav: document.querySelector('.site-nav a').getAttribute('href'), plan: document.querySelector('.footer__nav a').getAttribute('href'), tous: document.querySelector('.autres__lien').getAttribute('href'),
    quatre: [...document.querySelectorAll('.four__row a')].map(a => a.getAttribute('href')) }));
  ok(liens.nav === 'realisations.html' && liens.plan === 'realisations.html' && liens.tous === 'realisations.html' && liens.quatre.join(' ') === 'realisations.html#ateliers-118 projet-the-bank.html realisations.html#data-box realisations.html#community',
    'liens : navigation, plan et « Toutes les réalisations → » vers realisations.html ; The Bank vers sa fiche, les trois autres vers leur ancre');
  ok((await p.evaluate(() => [...document.querySelectorAll('.mq__b[data-cle="cadrage"] input')].map(i => i.value).join(' '))) === 'centre haut', 'bascule 9c : centre / haut seulement (« bas » retiré)');
  await ctx.close();
}
{
  // en-tête (26/09) : la même limite que le contenu large, 1600 px gouttière comprise — pleine largeur jusqu'à 1600 px de fenêtre, centré au-delà
  const { p, ctx } = await ouvrir('', [1920, 1080]);
  const hd = await p.evaluate(() => ({ w: Math.round(document.querySelector('.site-header').getBoundingClientRect().width), logo: Math.round(document.querySelector('.logo').getBoundingClientRect().left), nav: Math.round(document.querySelector('.site-nav').getBoundingClientRect().right) }));
  ok(hd.w === 1600 && hd.logo === 200 && hd.nav === 1720, `en-tête à 1920 : limité à 1600 px (${hd.w}), logo à ${hd.logo} px, liens jusqu'à ${hd.nav} px`);
  await ctx.close();
}
// pied de page (Cowork, 26/09) : sur la grille large comme l'en-tête, sur les trois pages, quelle que soit la grille du contenu — le contact commence
// au x du logo, le bord droit (le filet du bas, sur toute la largeur de la grille) tombe sur celui de la navigation
for (const page of ['index', 'projet-the-bank', 'realisations']) {
  for (const [w, h] of [[1920, 1080], [1521, 705], [390, 844]]) {
    const { p, ctx } = await ouvrir('', [w, h], {}, page);
    const x = await p.evaluate(() => { const r = s => document.querySelector(s).getBoundingClientRect(); return { logo: Math.round(r('.logo').left), nav: Math.round(r('.site-nav').right), contact: Math.round(r('.footer__contact').left), filet: Math.round(r('.footer__legal').right) }; });
    ok(x.contact === x.logo && x.filet === x.nav, `${page} · ${w} × ${h} : pied de page sur la grille de l'en-tête — contact à ${x.contact} px (logo à ${x.logo}), bord droit à ${x.filet} px (navigation jusqu'à ${x.nav})`);
    await ctx.close();
  }
}
{
  const { p, ctx } = await ouvrir('', [390, 844]);
  ok((await style(p, '.logo__texte', 'display')) === 'none' && (await style(p, '.logo__mark', 'display')) !== 'none' && (await style(p, '.site-header', 'height')) === '64px', 'mobile : Φ seul dans l’en-tête');
  const photo = await rect(p, '.hero__photo'), titre = await rect(p, '.hero__title span'), texte = await rect(p, '.hero__text'), bande = await rect(p, '.stats-band');
  const sigM = await rect(p, '.signature'), parM = await p.evaluate(() => [...document.querySelectorAll('.hero__text p:not(.signature)')].map(e => Math.round(e.getBoundingClientRect().bottom)));
  ok(photo.height === 420 && titre.left === 20 && photo.bottom - titre.bottom >= 24 && photo.bottom - titre.bottom <= 40 && bande.top >= photo.bottom && texte.top >= bande.bottom && (await style(p, '.hero__text', 'gridTemplateColumns')).split(' ').length === 1 && sigM.top >= parM[1] && parM[1] > parM[0], `mobile : photo de ${photo.height} px, accroche en bas à gauche (à ${photo.bottom - titre.bottom} px du bas), bande, puis paragraphes en une colonne et la signature en dernier`);
  ok(/to top/.test(await p.evaluate(() => getComputedStyle(document.querySelector('.hero__photo'), '::after').backgroundImage)), 'mobile : voile depuis le bas');
  ok((await style(p, '.h2--serif', 'fontSize')) === '26px' && (await style(p, '.h2--sans', 'fontSize')) === '24px', 'mobile : titre de la carte en serif 26 px, titre du graphique en sans 24 px');
  await ctx.close();
}

console.log('\n5 · Réalisations : la carte');
{
  const { p, ctx } = await ouvrir('');
  const c = await p.evaluate(() => ({
    place: document.querySelector('.section--projets').nextElementSibling.classList.contains('section--autres') && document.querySelector('.section--autres').nextElementSibling.classList.contains('section--collectif'),
    pts: document.querySelectorAll('.carte__pt').length, labs: document.querySelectorAll('.carte__lab').length, rang1: [...document.querySelectorAll('.carte__lab[data-rang="1"]')].map(t => t.textContent),
    groupe: document.querySelector('.carte__lab--groupe').textContent, fig: Math.round(document.querySelector('.carte__fig').getBoundingClientRect().width),
    bxl: [...document.querySelectorAll('.carte__lieu[data-lieu="Bruxelles"] .carte__pt')].map(c => c.getAttribute('r')), autres: [...document.querySelectorAll('.carte__lieu:not([data-lieu="Bruxelles"]) .carte__pt')].map(c => c.getAttribute('r')),
    section: Math.round(document.querySelector('.section--autres').getBoundingClientRect().height),
    bande: !!document.querySelector('.bande, .autres__tous'),
  }));
  ok(c.place, 'la section Réalisations est entre Projets et Collectif');
  ok(!c.bande, 'la bande défilante n’est plus dans la page');
  ok(c.pts === 17 && c.labs === 17 && c.groupe === 'Bruxelles', `carte : ${c.pts} points, ${c.labs} étiquettes, groupe « ${c.groupe} »`);
  ok(c.bxl.length === 1 && c.bxl[0] === '6.5' && c.autres.length === 16 && c.autres.every(r => r === '4.5'), 'carte : Bruxelles = un seul point r 6,5, les seize autres r 4,5');
  ok(c.rang1.length === 3, 'carte : étiquettes de rang 1 — ' + c.rang1.join(' · '));
  ok(c.fig <= 600, `carte : SVG ${c.fig} px de large (600 max)`);
  ok((await style(p, '.carte__pays', 'fill')) === SABLE && (await style(p, '.carte__pt', 'fill')) === ANTHRACITE && (await style(p, '.carte__pt', 'stroke')) === BLANC && (await style(p, '.carte__lab', 'fill')) === GRIS && (await style(p, '.carte__lab--groupe', 'fill')) === ANTHRACITE, 'carte : pays sable par défaut (bascule 15a), points anthracite à liseré blanc, étiquettes gris chaud, Bruxelles anthracite');
  const centre = await p.evaluate(() => {
    const fig = document.querySelector('.carte__fig').getBoundingClientRect(), texte = document.querySelector('.carte__texte').getBoundingClientRect();
    return Math.abs((fig.top + fig.bottom) / 2 - (texte.top + texte.bottom) / 2);
  });
  ok(centre <= 1, `carte : le bloc de texte est centré verticalement sur la carte (écart ${centre} px)`);
  await p.hover('.carte__lieu[data-lieu="Jemelle"] .carte__pt');
  ok((await style(p, '.carte__lieu[data-lieu="Jemelle"] .carte__lab', 'fill')) === ANTHRACITE, 'carte : le survol d’un point passe son étiquette en anthracite');
  // Chevauchements dans le SVG : getBBox() donne la boîte englobante dans le système de coordonnées propre du SVG (le viewBox, indépendant
  // du zoom ou de la largeur d'écran), donc directement comparable aux décalages écrits dans belgique.json/belgique.svg. On teste les 17
  // étiquettes deux à deux, plus chaque étiquette contre chaque point (aucun n'a de transform propre, donc les boîtes sont comparables telles quelles).
  const chevauchements = await p.evaluate(() => {
    const labs = [...document.querySelectorAll('.carte__lab')].map(t => ({ nom: t.textContent, b: t.getBBox() }));
    const pts = [...document.querySelectorAll('.carte__pt')].map(c => ({ nom: c.querySelector('title').textContent, b: c.getBBox() }));
    const inter = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
    const paires = [];
    for (let i = 0; i < labs.length; i++) for (let j = i + 1; j < labs.length; j++) if (inter(labs[i].b, labs[j].b)) paires.push(labs[i].nom + ' / ' + labs[j].nom);
    for (const lab of labs) for (const pt of pts) if (inter(lab.b, pt.b)) paires.push(lab.nom + ' / point ' + pt.nom);
    return paires;
  });
  ok(!chevauchements.length, chevauchements.length ? `carte : chevauchements (getBBox) — ${chevauchements.join(', ')}` : 'carte : aucune des 17 étiquettes ne chevauche une autre étiquette ni un point (getBBox, boîtes du SVG)');
  console.log(`        hauteur de la section : ${c.section} px (visée ≈ 550)`);
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('', [390, 844]);
  const m = await p.evaluate(() => ({ cols: getComputedStyle(document.querySelector('.carte')).gridTemplateColumns.split(' ').length, fig: Math.round(document.querySelector('.carte__fig').getBoundingClientRect().width), visibles: [...document.querySelectorAll('.carte__lab')].filter(t => getComputedStyle(t).opacity === '1').map(t => t.textContent) }));
  ok(m.cols === 1 && m.fig === 350, `mobile : carte pleine largeur (${m.fig} px, une colonne)`);
  ok(m.visibles.length === 3 && m.visibles.every(v => ['Bruxelles', 'Liège', 'Jemelle'].includes(v)), 'mobile : étiquettes de rang 1 seulement — ' + m.visibles.join(' · '));
  await ctx.close();
}

console.log('\n6 · Logos partenaires, photo 2800 px, présentation, sans JavaScript, polices');
{
  const { p, ctx } = await ouvrir('');
  const barres = await p.evaluate(() => [...document.querySelectorAll('.bar')].map(b => b.querySelector('.bar__label').textContent + ' ' + b.querySelector('.bar__fill').style.width));
  ok(barres.length === 3 && barres.every(b => /\d+%$/.test(b)), 'graphique : trois barres avec leur pourcentage — ' + barres.join(' · '));
  const logos = await p.evaluate(() => [...document.querySelectorAll('.partner')].map(li => { const r = li.querySelector('.partner__couleur').getBoundingClientRect(); return { nom: li.title, h: Math.round(r.height), c: Math.round((r.top + r.bottom) / 2) }; }));
  const attendu = { ASAP: 42, Batopin: 34, 'CN Architecture': 35, 'Felis & Associés': 34, Menuisol: 34, 'Property Lab': 49, Synopsis: 60, 'Zekaj Construct': 34 };
  ok(logos.length === 8 && logos.every(l => l.h === attendu[l.nom]) && Math.max(...logos.map(l => l.c)) - Math.min(...logos.map(l => l.c)) <= 1, 'logos (couleur) à la masse visuelle, alignés au centre : ' + logos.map(l => `${l.nom} ${l.h}`).join(' · '));
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('', [1440, 900], { deviceScaleFactor: 2 });
  ok(await p.evaluate(() => /community-05-l\.jpg$/.test(document.querySelector('.hero__photo img').currentSrc)), 'premier écran : la version 2800 px est servie à 1440 × 2');
  const apercu2 = (await photosImg(p, '.four__preview img')).filter(i => fs.existsSync(path.join(IMG_DIR, `${i.cle}.jpg`)));
  ok(apercu2.length >= 3 && apercu2.every(i => i.servi === `${i.cle}.jpg`), `aperçu de la liste des 4 à 1440 × 2 : le 1800 px est servi (${apercu2.map(i => i.servi).join(', ')})`);
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('panneau=off');
  ok(await p.evaluate(() => { const m = document.querySelector('.mq'); return !m || getComputedStyle(m).display === 'none'; }), 'panneau=off : le panneau est masqué'); await ctx.close();
}
{
  const { p, ctx } = await ouvrir('');
  ok(await p.evaluate(() => !!document.querySelector('.mq') && getComputedStyle(document.querySelector('.mq')).display !== 'none'), 'le panneau est visible par défaut'); await ctx.close();
}
{
  const { p, ctx } = await ouvrir('', [1440, 900], { javaScriptEnabled: false });
  ok(await p.evaluate(() => !document.querySelector('.mq') && !!document.querySelector('.four__preview img.is-active') && getComputedStyle(document.querySelector('.stats-band')).backgroundColor === 'rgb(249, 249, 246)' && getComputedStyle(document.querySelector('.hero__photo img')).objectPosition === '50% 50%'), 'sans JavaScript : la page est la combinaison retenue, sans panneau'); await ctx.close();
}
{
  const { p, ctx } = await ouvrir('');
  const familles = ['Newsreader', 'Instrument Sans', 'Jost'];
  for (const f of familles) ok(await p.evaluate(async f => { await document.fonts.load(`400 16px "${f}"`); return document.fonts.check(`400 16px "${f}"`); }, f), `police chargée en file:// : ${f}`);
  ok(await p.evaluate(async () => { await document.fonts.load('italic 400 16px "Newsreader"'); return document.fonts.check('italic 400 16px "Newsreader"'); }), 'Newsreader répond en italique (signature, chute, citation)');
  const inutiles = fs.readdirSync(path.join(MAQ, 'fonts')).filter(f => !/^(newsreader|instrument-sans|jost)-/.test(f));
  ok(!inutiles.length, 'fonts/ ne contient que les polices utilisées' + (inutiles.length ? ' — en trop : ' + inutiles.join(', ') : ''));
  await ctx.close();
}

console.log('\n7 · Contrastes (WCAG) sur les fonds réels');
const lum = hex => { const c = hex.replace('#', ''); const [r, g, b] = [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contraste = (a, b) => { const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x); return ((l1 + 0.05) / (l2 + 0.05)).toFixed(2); };
const fonds = { blanc: '#FFFFFF', papier: '#F9F9F6', sable: '#F6F1E6' };
const encres = [['#26231F', 'anthracite (texte, barres)'], ['#6B655C', 'gris (étiquettes < 18 px)'], ['#9A948A', 'gris clair (réservé ≥ 18 px)'], ['#9A7A3B', 'or mat (chiffres ≥ 40 px)'], ['#8A6B2F', 'or foncé (liens, signature)'], ['#B8975A', 'or clair (filets seulement)'], ['#7A7466', 'gris chaud (logos, étiquettes des chiffres)']];
ok(Number(contraste('#8A6B2F', '#FFFFFF')) >= 4.5 && Number(contraste('#9A7A3B', '#FFFFFF')) < 4.5, `numéros de chapitre (15 px) en or foncé : ${contraste('#8A6B2F', '#FFFFFF')}:1 sur blanc (or mat : ${contraste('#9A7A3B', '#FFFFFF')}:1, sous le seuil)`);
for (const [hex, nom] of encres) console.log('  ' + nom.padEnd(30) + Object.entries(fonds).map(([f, h]) => `${f} ${contraste(hex, h)}:1`).join('   '));

// ---------- fiche The Bank et vue Réalisations ----------
const FICHE = 'projet-the-bank', REAL = 'realisations';
const familles = ['Newsreader', 'Instrument Sans', 'Jost'];
async function polices(p, nom) {
  for (const f of familles) ok(await p.evaluate(async f => { await document.fonts.load(`400 16px "${f}"`); return document.fonts.check(`400 16px "${f}"`); }, f), `${nom} : police chargée en file:// : ${f}`);
}

console.log('\n8 · Fiche The Bank');
for (const [w, h] of [[1440, 900], [1366, 703], [390, 844]]) {
  const { p, ctx } = await ouvrir('', [w, h], {}, FICHE);
  ok((await largeur(p)) === 0, `fiche · ${w} : aucun débordement horizontal`); await ctx.close();
}
{
  const { p, ctx } = await ouvrir('', [1440, 900], {}, FICHE);
  await polices(p, 'fiche');
  const titre = await p.evaluate(() => document.title);
  ok(titre === 'The Bank — Perpetual', `titre de la page : ${titre}`);
  ok(await p.evaluate(() => document.querySelector('.site-nav a.is-active') && document.querySelector('.site-nav a.is-active').textContent === 'Réalisations' && document.querySelector('.site-nav a.is-active').getAttribute('href') === 'realisations.html'), 'navigation : « Réalisations » actif, vers realisations.html');
  const t = await p.evaluate(() => ({ eyebrow: document.querySelector('.page-head .eyebrow').textContent, h1: document.querySelector('.page__titre').textContent, h1fs: getComputedStyle(document.querySelector('.page__titre')).fontSize, h1ff: getComputedStyle(document.querySelector('.page__titre')).fontFamily }));
  ok(t.eyebrow === 'Liège, rue des Mineurs' && t.h1 === 'The Bank' && t.h1fs === '64px' && t.h1ff.startsWith('Newsreader'), `« ${t.eyebrow} » en eyebrow, « ${t.h1 } » en serif 64 px`);
  const hero = await rect(p, '.fiche__hero'), faits = await rect(p, '.faits-band'), head = await rect(p, '.page-head');
  // photo de tête (revue de la fiche) : the-bank-01, srcset 1350w / 2100w, point focal en variables sur l'<img> (déclaré dans `fiche`, build.mjs)
  const tete = await p.evaluate(() => { const i = document.querySelector('.fiche__hero img'); return { src: i.currentSrc, srcset: i.getAttribute('srcset'), focal: i.style.getPropertyValue('--focal'), focalM: i.style.getPropertyValue('--focal-mobile'), pos: getComputedStyle(i).objectPosition }; });
  ok(/the-bank-01(-l)?\.jpg$/.test(tete.src) && /the-bank-01\.jpg 1350w, .*the-bank-01-l\.jpg 2100w$/.test(tete.srcset) && tete.focal === '50% 44%' && tete.focalM === '50% 5%' && tete.pos === '50% 44%',
    `photo de tête the-bank-01 (srcset 1350w / 2100w), point focal --focal ${tete.focal} (servi : ${tete.pos}), --focal-mobile ${tete.focalM}`);
  ok(hero.height === 570 && hero.width === 1440 && hero.top >= head.bottom, `photo de tête pleine largeur, ${hero.height} px de haut à 1440 × 900`);
  ok(faits.top === hero.bottom && faits.bottom <= 900 && (await style(p, '.faits-band', 'backgroundColor')) === PAPIER, `premier écran à 1440 × 900 : le titre, la photo et la bande de faits, opaque, sous la photo (bande à ${faits.bottom})`);
  const ph = await p.evaluate(() => { const s = getComputedStyle(document.querySelector('.fiche .page-head')); return [s.paddingTop, s.paddingBottom, getComputedStyle(document.querySelector('.fiche .page-head .eyebrow')).marginBottom].join(' '); });
  ok(ph === '12px 24px 8px', `en-tête de page resserré au-dessus de 640 px : padding ${ph.split(' ').slice(0, 2).join(' / ')}, eyebrow à ${ph.split(' ')[2]}`);
  const f = await p.evaluate(() => ({ bande: getComputedStyle(document.querySelector('.faits-band')).backgroundColor, valeurs: [...document.querySelectorAll('.stats--faits .stat__value')].map(v => { const s = getComputedStyle(v); return { t: v.textContent, c: s.color, ff: s.fontFamily, fs: s.fontSize, fw: s.fontWeight }; }),
    etiquettes: [...document.querySelectorAll('.stats--faits .stat__label')].map(l => ({ t: l.textContent, c: getComputedStyle(l).color })) }));
  ok(f.bande === PAPIER && f.valeurs.map(v => v.t).join(' · ') === 'Liège · 1 100 m² · Logements & commerce' && f.valeurs.every(v => v.c === OR && v.ff.startsWith('Newsreader') && v.fs === '28px' && v.fw === '400')
    && f.etiquettes.map(l => l.t).join(' · ') === 'Localisation · Surface · Usage' && f.etiquettes.every(l => l.c === GRIS_CHAUD),
    'bande de faits : surface papier, valeurs en serif or 28 px (Liège · 1 100 m² · Logements & commerce), étiquettes gris chaud');
  const ch = await p.evaluate(() => [...document.querySelectorAll('.chapitre')].map(c => { const t = c.querySelector('.chapitre__titre'), s = getComputedStyle(t); return { num: c.querySelector('.chapitre__num').textContent, numColor: getComputedStyle(c.querySelector('.chapitre__num')).color, numFf: getComputedStyle(c.querySelector('.chapitre__num')).fontFamily, titre: t.textContent, ff: s.fontFamily, fs: s.fontSize, fw: s.fontWeight, texte: c.querySelector('.chapitre__texte').textContent.length, largeur: Math.round(c.parentElement.getBoundingClientRect().width), left: Math.round(c.getBoundingClientRect().left) }; }));
  ok(ch.length === 3 && ch.map(c => c.num).join(' ') === '01 02 03' && ch.map(c => c.titre).join(' / ') === 'Ce que c’était / Ce que nous y avons vu / Ce que c’est devenu' && ch.every(c => c.texte > 20 && c.numColor === OR_FONCE && c.numFf.startsWith('"Instrument Sans"')), 'trois chapitres numérotés 01 02 03 (numéros en sans, or foncé) avec les textes de data/projects.json');
  ok(ch.every(c => c.ff.startsWith('"Instrument Sans"') && c.fs === '26px' && c.fw === '500'), 'titres de chapitre : Instrument Sans 500, 26 px (bascule 20 figée sur « sans »)');
  ok(ch.every(c => c.largeur === 760 && c.left === 160), 'chapitres en colonne de 760 px alignée à gauche');
  const photos = await p.evaluate(() => [...document.querySelectorAll('.fiche__photos figure')].map(fg => { const r = fg.querySelector('img').getBoundingClientRect(); return { src: fg.querySelector('img').currentSrc.replace(/^.*\//, ''), srcset: fg.querySelector('img').getAttribute('srcset'), w: Math.round(r.width), h: Math.round(r.height), left: Math.round(r.left), legende: fg.querySelector('figcaption').textContent }; }));
  const place = await p.evaluate(() => { const ch = [...document.querySelectorAll('.chapitre')].map(c => c.getBoundingClientRect().top), ph = document.querySelector('.fiche__photos').getBoundingClientRect().top; return ch[0] < ph && ph < ch[1]; });
  ok(photos.length === 2 && /^the-bank-02/.test(photos[0].src) && /^the-bank-03/.test(photos[1].src) && photos.every(x => x.h === 440) && photos[0].w === photos[1].w && photos[1].left > photos[0].left
    && photos.map(x => x.legende).join(' / ') === 'Le point Bancontact, rue des Mineurs / Le point Bancontact, l’intérieur' && /the-bank-03\.jpg 1800w, .*the-bank-03-l\.jpg 2800w$/.test(photos[1].srcset) && place,
    `paire entre les chapitres 01 et 02 : the-bank-02 à gauche, the-bank-03 à droite (srcset 1800w / 2800w), 440 px, largeurs égales (${photos.map(x => x.w).join(' = ')} px), légendes`);
  // rythme : 64 px avant et après la paire, 56 px entre chapitres
  const ry = await p.evaluate(() => { const b = e => e.getBoundingClientRect(), ch = [...document.querySelectorAll('.chapitre')], paire = document.querySelector('.fiche__photos'), txt = c => b(c.querySelector('.chapitre__texte')).bottom;
    return { avant: Math.round(b(paire.querySelector('img')).top - txt(ch[0])), apres: Math.round(b(ch[1]).top - b(paire).bottom), entre: Math.round(b(ch[2]).top - txt(ch[1])) }; });
  ok(ry.avant === 64 && ry.apres === 64 && ry.entre === 56, `rythme : ${ry.avant} px avant la paire, ${ry.apres} après, ${ry.entre} entre chapitres`);
  const suivant = await p.evaluate(() => { const a = document.querySelector('.suivant'); return { href: a.getAttribute('href'), texte: a.querySelector('.eyebrow').textContent + ' — ' + a.querySelector('.suivant__nom').textContent, color: getComputedStyle(a.querySelector('.suivant__nom')).color, bloc: getComputedStyle(a.querySelector('.eyebrow')).display }; });
  ok(suivant.href === 'realisations.html#data-box' && suivant.texte === 'Projet suivant — Data Box →' && suivant.color === OR_FONCE && suivant.bloc === 'block', `« ${suivant.texte} » → ${suivant.href}, or foncé, l'étiquette au-dessus du nom`);
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.site-footer')).backgroundColor === 'rgb(249, 249, 246)' && document.querySelector('.footer__nav a').getAttribute('href') === 'realisations.html' && document.querySelector('.footer__nav a[href="index.html#collectif"]') !== null), 'pied de page papier ; plan vers realisations.html, Collectif vers index.html#collectif');
  const panneau = await p.evaluate(() => [...document.querySelectorAll('.mq__b')].map(f => f.dataset.cle + (f.classList.contains('is-inactif') ? ' (sans effet)' : '')).join(' · '));
  ok(panneau === 'cadrage (sans effet) · carte (sans effet) · papier (sans effet) · bas (sans effet)', 'panneau : ' + panneau + ' (bascule 20 retirée)');
  await ctx.close();
}
// gouttière du titre de page (revue du 23/09) : .page-head est un .container, son padding latéral doit rester celui de .container
// (la vue Réalisations n'a plus de .page-head : son alignement sur la grille large est vérifié en 9)
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const { p, ctx } = await ouvrir('', [w, h], {}, FICHE);
  const g = await p.evaluate(() => ({ titre: Math.round(document.querySelector('.page__titre').getBoundingClientRect().left), eyebrow: Math.round(document.querySelector('.eyebrow').getBoundingClientRect().left), pad: getComputedStyle(document.querySelector('.page-head')).paddingLeft }));
  ok(g.titre === g.eyebrow && g.titre === (w === 1440 ? 160 : 20), `${FICHE} · ${w} : .page__titre au même x que la première .eyebrow (${g.titre} = ${g.eyebrow}, padding latéral ${g.pad})`);
  await ctx.close();
}
// citation du pied de page : espaces insécables (U+00A0) après « et avant », sur les trois pages
for (const page of ['index', FICHE, REAL]) {
  const { p, ctx } = await ouvrir('', [1440, 900], {}, page);
  const q = await p.evaluate(() => document.querySelector('.footer__quote p').textContent);
  ok(q.startsWith('«\u00A0') && q.endsWith('\u00A0»'), `${page} : citation du pied de page, espaces insécables après « et avant »`);
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('chapitres=serif', [1440, 900], {}, FICHE);
  const t = await p.evaluate(() => [...document.querySelectorAll('.chapitre__titre')].map(t => { const s = getComputedStyle(t); return s.fontFamily.startsWith('"Instrument Sans"') && s.fontSize === '26px' && s.fontWeight === '500'; }));
  ok(t.length === 3 && t.every(Boolean) && (await style(p, '.page__titre', 'fontFamily')).startsWith('Newsreader') && (await style(p, '.stats--faits .stat__value', 'fontFamily')).startsWith('Newsreader'), 'chapitres=serif (bascule 20 retirée) : sans effet, titres de chapitre en sans ; le titre et les faits restent en serif');
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('chapitres=sans&quatre=cartes');
  ok((await p.evaluate(() => document.querySelectorAll('.chapitre').length)) === 0 && (await style(p, '.four', 'display')) === 'grid', 'Home : chapitres=sans et quatre=cartes (bascule retirée) sont sans effet');
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('', [1366, 703], {}, FICHE);
  const hero = await rect(p, '.fiche__hero'), h1 = await rect(p, '.page__titre'), faits = await rect(p, '.faits-band');
  ok(h1.bottom < hero.top && hero.height === 373 && faits.top === hero.bottom && faits.bottom <= 703, `premier écran à 1366 × 703 : le titre, la photo (${hero.height} px) et la bande de faits (jusqu'à ${faits.bottom})`);
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('', [390, 844], {}, FICHE);
  ok((await style(p, '.logo__texte', 'display')) === 'none' && (await style(p, '.page__titre', 'fontSize')) === '44px' && (await rect(p, '.fiche__hero')).height === 300 && (await style(p, '.fiche__hero img', 'objectPosition')) === '50% 5%', 'mobile : Φ seul, titre 44 px, photo de 300 px, point focal --focal-mobile 50% 5%');
  const phM = await p.evaluate(() => { const s = getComputedStyle(document.querySelector('.fiche .page-head')); return [s.paddingTop, s.paddingBottom, getComputedStyle(document.querySelector('.fiche .page-head .eyebrow')).marginBottom].join(' '); });
  ok(phM === '28px 24px 14px', `mobile : en-tête de page inchangé (${phM})`);
  const f3 = await p.evaluate(() => { const l = [...document.querySelectorAll('.stats--faits .stat')].map(e => e.getBoundingClientRect()), v = document.querySelector('.stats--faits .stat:nth-child(3) .stat__value'); return { plein: Math.round(l[2].width) >= Math.round(document.querySelector('.stats--faits').getBoundingClientRect().width) - 1, ligne: v.getClientRects().length === 1 && Math.round(v.getBoundingClientRect().height) < 40 }; });
  ok(f3.plein && f3.ligne, 'mobile : « Logements & commerce » sur toute la largeur, sur une ligne');
  const m = await p.evaluate(() => ({ faits: getComputedStyle(document.querySelector('.stats--faits')).gridTemplateColumns.split(' ').length, photos: getComputedStyle(document.querySelector('.fiche__photos')).gridTemplateColumns.split(' ').length, h: Math.round(document.querySelector('.fiche__photos img').getBoundingClientRect().height), titre: getComputedStyle(document.querySelector('.chapitre__titre')).fontSize, bande: Math.round(document.querySelector('.faits-band').getBoundingClientRect().bottom) }));
  ok(m.faits === 2 && m.photos === 1 && m.h === 300 && m.titre === '22px', `mobile : faits sur deux colonnes, photos en une colonne de 300 px, titres de chapitre 22 px`);
  ok(m.bande <= 844, `mobile : le titre, la photo et la bande de faits tiennent dans 844 (bande à ${m.bande})`);
  await ctx.close();
}

console.log('\n9 · Vue Réalisations (proposition P2, revue du 26/09)');
const donnees = JSON.parse(fs.readFileSync(path.resolve(MAQ, '../../data/projects.json'), 'utf8'));
const parOrdre = kind => donnees.filter(x => x.kind === kind).sort((a, b) => a.order - b.order);
// la rangée : kind agency dans l'ordre, puis kind gallery dans l'ordre ; la ville est le nom d'une agence, le lieu d'un bien de la galerie ; les photos, son champ selection
const biensAttendus = [...parOrdre('agency'), ...parOrdre('gallery')].map(x => ({ ville: x.kind === 'agency' ? x.name : x.location, surface: x.surface, usage: x.use, photos: x.selection && x.selection.length ? x.selection : [`${x.id}-01`] }));
const VILLES = biensAttendus.map(b => b.ville);
const realMd = fs.readFileSync(path.resolve(MAQ, '../../content/realisations.md'), 'utf8').replace(/\r\n?/g, '\n');
const phraseAttendue = realMd.match(/subtitle:\s*(.+)/)[1].trim();
const paragrapheAgences = realMd.split('## Le programme agences')[1].replace(/<!--[\s\S]*?-->/g, '').trim().split(/\n\s*\n/)[0].trim();
const TRANSPARENT = 'rgba(0, 0, 0, 0)';
// parcourir la page, puis charger toutes les images, y compris celles de la rangée, hors champ sur le côté (loading="lazy") : un fichier manquant
// remonte en erreur de console
const parcourir = p => p.evaluate(async () => {
  const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); } window.scrollTo(0, 0);
  const imgs = [...document.images]; imgs.forEach(i => { i.loading = 'eager'; });
  await Promise.all(imgs.map(i => i.complete ? null : new Promise(r => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); setTimeout(r, 5000); })));
});
{
  // chaque fichier cité par la page existe : src et srcset, et les photos 1800 px de la visionneuse (window.BIENS), que la page ne charge qu'à l'ouverture
  const html = fs.readFileSync(path.join(MAQ, REAL + '.html'), 'utf8');
  const biens = JSON.parse(html.match(/window\.BIENS=(\[.*?\]);<\/script>/)[1]);
  const cites = new Set([...html.matchAll(/(?:src|srcset)="([^"]+)"/g)].flatMap(m => m[1].split(',').map(x => x.trim().split(' ')[0])).concat(biens.flatMap(b => b.l)).filter(u => /\.jpg$/.test(u)));
  const manquants = [...cites].filter(u => !fs.existsSync(path.resolve(MAQ, u)));
  const attendues = 2 * (biensAttendus.reduce((n, b) => n + b.photos.length, 0) + 4);   // 800 et 1800 px de chaque vue des biens et des 4 blocs
  ok(cites.size === attendues && !manquants.length, `réalisations : les ${cites.size} photos citées par la page (src, srcset, visionneuse ; ${attendues} attendues) existent` + (manquants.length ? ' — manquent : ' + manquants.join(', ') : ''));
}
for (const [w, h] of [[1521, 705], [1440, 900], [1920, 1080], [390, 844]]) {
  const { p, ctx, erreurs } = await ouvrir('', [w, h], {}, REAL);
  await parcourir(p);
  await p.waitForLoadState('networkidle');
  const deb = await largeur(p);
  ok(deb === 0 && !erreurs.length, `réalisations · ${w} × ${h} : aucun débordement horizontal (${deb} px), aucune erreur` + (erreurs.length ? ' — ' + erreurs.join(' | ') : ''));
  if (w > 640) {
    const r = await p.evaluate(() => [...document.querySelectorAll('.alt__rang')].map(r => { const b = [...r.children].map(c => c.getBoundingClientRect()); return { h: Math.round(r.getBoundingClientRect().height), l: b.map(x => Math.round(x.width)), gap: Math.round(b[1].left - b[0].right), bas: r.getBoundingClientRect().bottom, haut: r.getBoundingClientRect().top }; }));
    const attendu = Math.min(540, Math.max(340, h - 262)), ecart = Math.round(r[1].haut - r[0].bas);
    ok(r.length === 2 && r.every(x => x.h === attendu && x.gap === 14) && ecart === 14 && Math.abs(r[0].l[0] / r[0].l[1] - 7 / 5) < 0.02 && Math.abs(r[1].l[1] / r[1].l[0] - 7 / 5) < 0.02,
      `${w} × ${h} : deux rangées, 7/5 puis 5/7 (${r.map(x => x.l.join(' / ')).join(', ')}), ${r[0].h} px de haut (clamp → ${attendu}), écarts de 14 px`);
  }
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('', [1920, 1080], {}, REAL);
  const x = await p.evaluate(() => { const l = s => Math.round(document.querySelector(s).getBoundingClientRect().left), r = s => Math.round(document.querySelector(s).getBoundingClientRect().right);
    return { logo: l('.logo'), titre: l('.page__titre'), photo: l('.bloc'), rangee: l('.defil__piste'), eyebrow: l('.bloc-agences .eyebrow'), pied: l('.footer__contact'), nav: r('.site-nav'), photoD: r('.alt__rang--a .bloc:last-child'), rangeeD: r('.defil__piste') }; });
  ok(x.logo === 200 && x.titre === 200 && x.photo === 200 && x.rangee === 200, `1920 : le logo, le titre, la première photo et la rangée commencent au même x (${x.logo}, ${x.titre}, ${x.photo}, ${x.rangee})`);
  ok(x.eyebrow === 200 && x.pied === 200 && x.nav === 1720 && x.photoD === 1720 && x.rangeeD === 1720, `1920 : « Programme agences » et le pied de page sur la même grille (x ${x.eyebrow}, ${x.pied}) ; la navigation finit avec les photos et la rangée (${x.nav}, ${x.photoD}, ${x.rangeeD})`);
  const blocs = await photosImg(p, '.bloc img');
  ok(blocs.every(i => i.echelle <= 1), `blocs à 1920 × 1080, 1× : aucune photo agrandie (${blocs.map(i => `${i.cle} ${i.w}×${i.h} ← ${i.pixels} ×${i.echelle}`).join(', ')})`);
  await ctx.close();
}
{
  const lignes = [];
  for (const w of [1025, 1280, 1440, 1521, 1920]) {
    const { p, ctx } = await ouvrir('', [w, 900], {}, REAL);
    lignes.push(await p.evaluate(() => { const e = document.querySelector('.p2-ouv .ouv__texte'), r = document.createRange(); r.selectNodeContents(e); return new Set([...r.getClientRects()].map(x => Math.round(x.top))).size; }));
    await ctx.close();
  }
  ok(lignes.every(n => n === 1), `la phrase d'ouverture tient sur une ligne au-dessus de 1024 px (1025, 1280, 1440, 1521, 1920 : ${lignes.join(', ')} ligne(s))`);
}
{
  const { p, ctx } = await ouvrir('', [1440, 900], {}, REAL);
  await polices(p, 'réalisations');
  const t = await p.evaluate(() => { const h1 = document.querySelector('.page__titre'), s = getComputedStyle(h1), ph = document.querySelector('.p2-ouv .ouv__texte');
    return { title: document.title, h1: h1.textContent, ff: s.fontFamily, fw: s.fontWeight, fs: s.fontSize, ls: s.letterSpacing, lh: s.lineHeight, phrase: ph.textContent, mw: getComputedStyle(ph).maxWidth, provisoire: ph.classList.contains('provisoire') && !!ph.title,
      actif: document.querySelector('.site-nav a.is-active') && document.querySelector('.site-nav a.is-active').textContent, pied: getComputedStyle(document.querySelector('.site-footer > .container')).maxWidth }; });
  ok(t.title === 'Réalisations — Perpetual' && t.h1 === 'Réalisations' && t.actif === 'Réalisations', `titre « ${t.h1} », « ${t.actif} » actif dans la navigation`);
  ok(t.ff.startsWith('"Instrument Sans"') && t.fw === '400' && t.fs === '64px' && t.ls === '-1.792px' && t.lh === '65.28px', `titre en Instrument Sans 400, 64 px, interlettrage −0,028 em, interligne 1,02 (${t.ff.split(',')[0]} ${t.fw}, ${t.ls}, ${t.lh}) — la fiche garde la serif`);
  ok(t.phrase === phraseAttendue && t.phrase === 'Vingt adresses où l’usage d’un bâtiment a été changé pour le rendre à nouveau pertinent.' && t.mw === 'none' && t.provisoire, `phrase d'ouverture : le subtitle de content/realisations.md, sans max-width, signalée provisoire — « ${t.phrase} »`);
  ok(t.pied === '1600px', `pied de page aligné sur la grille large (.site-footer > .container : max-width ${t.pied})`);
  // les quatre projets
  const b = await p.evaluate(() => [...document.querySelectorAll('.bloc')].map(e => { const r = e.getBoundingClientRect(), nom = e.querySelector('.bloc__nom'), tx = e.querySelector('.bloc__texte'), f = e.querySelector('.bloc__faits'), s = getComputedStyle(nom);
    return { tag: e.tagName.toLowerCase(), id: e.id, href: e.getAttribute('href'), tab: e.getAttribute('tabindex'), nom: nom.textContent, ff: s.fontFamily.split(',')[0], fs: s.fontSize, c: s.color, gauche: Math.round(nom.getBoundingClientRect().left - r.left), bas: Math.round(r.bottom - tx.getBoundingClientRect().bottom),
      faits: [...f.children].map(x => x.querySelector('.fait__et').textContent + ' ' + x.querySelector('.fait__val').textContent).join(' · '), repos: getComputedStyle(f).opacity + ' ' + Math.round(f.getBoundingClientRect().height),
      et: getComputedStyle(f.querySelector('.fait__et')).fontSize, val: getComputedStyle(f.querySelector('.fait__val')).fontFamily.split(',')[0] + ' ' + getComputedStyle(f.querySelector('.fait__val')).fontSize, mobile: getComputedStyle(e.querySelector('.bloc__mobile')).display }; }));
  ok(b.map(x => x.nom).join(' · ') === 'Community · Ateliers 118 · The Bank · Data Box' && b.every(x => x.ff === 'Newsreader' && x.fs === '38px' && x.c === BLANC && x.gauche === 28 && x.bas === 24),
    `4 projets : ${b.map(x => x.nom).join(' · ')}, nom en serif blanc 38 px, en bas à gauche (28 / 24 px)`);
  ok(b.map(x => `${x.tag}${x.id ? '#' + x.id : ''}${x.href ? ' → ' + x.href : ''}${x.tab ? ' tabindex ' + x.tab : ''}`).join(' | ') === 'div#community tabindex 0 | div#ateliers-118 tabindex 0 | a → projet-the-bank.html | div#data-box tabindex 0',
    'seule The Bank est un lien (projet-the-bank.html) ; les trois autres, non cliquables, gardent leur id et un tabindex : ' + b.map(x => x.tag + (x.id ? '#' + x.id : '')).join(' · '));
  ok(b.map(x => x.faits).join(' | ') === 'Lieu Uccle · Surface 14 unités · Usage Co-living | Lieu Molenbeek-Saint-Jean · Surface 1 200 m² · Usage Ateliers | Lieu Liège · Surface 1 100 m² · Usage Logements & commerce | Lieu Jemelle · Surface 4 200 m² · Usage Site technique'
    && b.every(x => x.repos === '0 0' && x.et === '12px' && x.val === 'Newsreader 21px' && x.mobile === 'none'), 'trois faits Lieu / Surface / Usage (étiquette 12 px, valeur en serif 21 px), masqués au repos');
  await p.hover('#community');
  const survol = await p.evaluate(() => { const f = document.querySelector('#community .bloc__faits'); return getComputedStyle(f).opacity + ' ' + (f.getBoundingClientRect().height > 30) + ' ' + getComputedStyle(document.querySelector('#community img')).transform; });
  await p.hover('a.bloc');
  const zoom = await p.evaluate(() => getComputedStyle(document.querySelector('a.bloc img')).transform + ' ' + getComputedStyle(document.querySelector('a.bloc .bloc__faits')).opacity);
  await p.focus('a.bloc');
  await p.keyboard.press('Tab');
  const focus = await p.evaluate(() => { const f = document.querySelector('#data-box .bloc__faits'); return document.activeElement.id + ' ' + document.querySelector('#data-box').matches(':focus-visible') + ' ' + getComputedStyle(f).opacity; });
  ok(survol === '1 true none' && /^matrix\(1\.035, 0, 0, 1\.035/.test(zoom) && zoom.endsWith(' 1') && focus === 'data-box true 1',
    `au survol, les faits s'affichent (Community : ${survol.split(' ')[0]}) ; au focus clavier aussi (${focus}) ; seule la photo du lien zoome (The Bank ${zoom.split(',')[0]}), pas les blocs non cliquables`);
  const photos = await photosImg(p, '.bloc img');
  ok(photos.map(i => `${i.cle} ${i.focal}`).join(' · ') === 'community-05 50% 50% · ateliers-118-05 50% 55% · the-bank-01 50% 40% · data-box-02 50% 55%', 'photos des blocs et points focaux : ' + photos.map(i => `${i.cle} ${i.focal}`).join(' · '));
  verifierSrcset(photos, 'blocs');
  ok(photos.every(i => i.echelle <= 1), `blocs à 1440 × 900, 1× : aucune photo agrandie (${photos.map(i => `${i.cle} ${i.w}×${i.h} ← ${i.pixels} ×${i.echelle}`).join(', ')})`);
  ok(await p.evaluate(() => ['ateliers-118', 'data-box', 'community'].every(id => { const e = document.getElementById(id); return e && e.classList.contains('bloc'); }) && [...document.querySelectorAll('[id]')].map(e => e.id).filter((x, i, a) => a.indexOf(x) !== i).length === 0),
    'ancres de la Home et du « Projet suivant » de la fiche : #ateliers-118, #data-box, #community présents (blocs), aucun id en double');
  // le programme agences
  const a = await p.evaluate(() => { const c = s => getComputedStyle(document.querySelector(s)), r = s => document.querySelector(s).getBoundingClientRect(), tete = document.querySelector('.bloc-agences__tete');
    return { eyebrow: document.querySelector('.bloc-agences .eyebrow').textContent, enonce: document.querySelector('.enonce').textContent, suite: tete.querySelector(':scope > .ouv__texte').textContent, tag: document.querySelector('.enonce').tagName,
      ff: c('.enonce').fontFamily.split(',')[0] + ' ' + c('.enonce').fontSize, mw: c('.enonce').maxWidth, cols: c('.bloc-agences__tete').gridTemplateColumns.split(' ').map(v => Math.round(parseFloat(v))),
      basGauche: Math.round(tete.children[0].getBoundingClientRect().bottom), basDroite: Math.round(tete.children[1].getBoundingClientRect().bottom), gaucheDroite: Math.round(tete.children[1].getBoundingClientRect().left),
      bande: c('.bloc-agences__bande').backgroundColor, pad: c('.bloc-agences__bande').paddingTop + ' ' + c('.bloc-agences__bande').paddingBottom, defil: c('.bloc-agences__defil').backgroundColor + ' ' + c('.bloc-agences__defil').paddingTop + ' ' + c('.bloc-agences__defil').paddingBottom }; });
  ok(a.eyebrow === 'Programme agences' && a.tag === 'H2' && `${a.enonce} ${a.suite}` === paragrapheAgences && /^Une agence bancaire fermée.*quartier\.$/.test(a.enonce) && a.ff === 'Newsreader 34px' && a.mw !== 'none',
    `énoncé : la première phrase du paragraphe de content/realisations.md en h2 serif 34 px (max ${a.mw}), la seconde à droite`);
  ok(Math.abs(a.cols[0] / a.cols[1] - 7 / 5) < 0.02 && a.basGauche === a.basDroite && a.gaucheDroite > 700, `énoncé : grille 7/5 (${a.cols.join(' / ')}), les deux colonnes alignées en bas (${a.basGauche} = ${a.basDroite})`);
  ok(a.bande === PAPIER && a.pad === '56px 52px' && a.defil === `${TRANSPARENT} 44px 88px`, `bande de l'énoncé sur papier (padding ${a.pad}), la rangée sur blanc (${a.defil.replace(TRANSPARENT + ' ', 'padding ')})`);
  const v = await p.evaluate(() => { const piste = document.querySelector('.defil__piste'), pr = piste.getBoundingClientRect(), orig = [...piste.children].filter(li => !li.hasAttribute('data-clone'));
    return { clones: piste.children.length - orig.length, compteur: document.querySelector('.defil__compteur').textContent,
      items: orig.map(li => ({ ville: li.querySelector('.vignette__nom').firstChild.textContent, surface: li.querySelector('.vignette__nom span').textContent, usage: li.querySelector('.vignette__usage').textContent, n: +li.querySelector('.bien').dataset.n,
        photos: [...li.querySelectorAll('.bien__piste > img:not([data-clone])')].map(i => i.getAttribute('src').replace(/^.*\//, '').replace(/-s\.jpg$/, '')).join(' '), cpt: li.querySelector('.bien__compteur').textContent,
        cptVisible: getComputedStyle(li.querySelector('.bien__compteur')).display !== 'none', flechesVisibles: getComputedStyle(li.querySelector('.bien__fleche')).display !== 'none', voile: getComputedStyle(li.querySelector('.bien'), '::after').display })),
      visibles: orig.filter(li => { const r = li.getBoundingClientRect(); return r.left >= pr.left - 1 && r.right <= pr.right + 1; }).map(li => li.querySelector('.vignette__nom').firstChild.textContent),
      ratio: (() => { const r = document.querySelector('.vignette__photo').getBoundingClientRect(); return r.width / r.height; })(),
      droite: (() => { const li = orig[0]; return Math.round(li.getBoundingClientRect().right - li.querySelector('.vignette__nom span').getBoundingClientRect().right); })(),
      cptStyle: (() => { const s = getComputedStyle(document.querySelector('.bien__compteur')), b = document.querySelector('.bien').getBoundingClientRect(), c = document.querySelector('.bien__compteur').getBoundingClientRect(); return `${s.fontSize} ${s.color} ${Math.round(c.top - b.top)} ${Math.round(b.right - c.right)}`; })() }; });
  ok(v.items.length === 16 && v.clones === 32 && v.items.map(i => i.ville).join(' · ') === VILLES.join(' · ') && v.items.every((it, i) => it.surface === biensAttendus[i].surface && it.usage === biensAttendus[i].usage),
    `rangée : les 16 biens (kind agency puis gallery, dans l'ordre), ville (name / location), surface et usage — ${v.items.map(i => i.ville).join(' · ')} ; ${v.clones} clones`);
  ok(v.visibles.length === 4 && v.visibles.join(' · ') === VILLES.slice(0, 4).join(' · ') && Math.abs(v.ratio - 1.5) < 0.01 && v.droite === 0 && v.compteur === '1–4 / 16',
    `4 vignettes visibles (${v.visibles.join(' · ')}), photo 3:2, surface à droite du nom, « ${v.compteur} »`);
  ok(v.items.every((it, i) => it.photos === biensAttendus[i].photos.join(' ') && it.n === biensAttendus[i].photos.length && it.cpt === `1 / ${it.n}`), `photos de chaque bien : le champ selection, dans l'ordre (${v.items.reduce((s, i) => s + i.n, 0)} vues), « 1 / n »`);
  const seule = v.items.filter(i => i.n === 1), plusieurs = v.items.filter(i => i.n > 1);
  ok(seule.length >= 1 && seule.every(i => !i.cptVisible && !i.flechesVisibles && i.voile === 'none') && plusieurs.every(i => i.cptVisible && i.voile !== 'none') && v.cptStyle === `12px ${BLANC} 10 12`,
    `« 1 / n » en haut à droite (blanc 12 px, voile dans le coin : ${v.cptStyle}) ; rien pour une seule photo (${seule.map(i => i.ville).join(', ')})`);
  const USAGES = ['Service finance de la commune', 'Auto-école', 'École de danse et commerce de proximité', 'Quatre logements'];
  ok(parOrdre('agency').map(x => x.use).join(' | ') === USAGES.join(' | ') && v.items.slice(0, 4).map(i => i.usage).join(' | ') === USAGES.join(' | ') && !donnees.some(x => /Bancontact/.test(x.use || '')) && v.items.every(i => !/Bancontact/.test(i.usage)),
    'usages des 4 agences sans « Point Bancontact » (data/projects.json et page) : ' + USAGES.join(' · '));
  const panneau = await p.evaluate(() => [...document.querySelectorAll('.mq__b')].map(f => f.dataset.cle + (f.classList.contains('is-inactif') ? ' (sans effet)' : '') + ' [' + [...f.querySelectorAll('input')].map(i => i.value).join(' / ') + ']').join(' · '));
  ok(panneau === 'cadrage (sans effet) [centre / haut] · carte (sans effet) [sable / papier-contour] · papier [enonce / tout] · bas [rien / anciens]', 'panneau : ' + panneau + ' (22 et 23 : la V1 en défaut)');
  await p.click('.mq__b[data-cle="papier"] label[for="mq-papier-tout"]');
  ok((await p.evaluate(() => document.documentElement.dataset.papier + ' ' + location.search)) === 'tout ?papier=tout', 'panneau : « toute la section » pose data-papier="tout" et ?papier=tout');
  await ctx.close();
}
{
  // la rangée en boucle, défilement doux (sans « mouvement réduit ») : on suit scrollLeft à chaque image pour vérifier qu'elle ne revient jamais en arrière
  const { p, ctx } = await ouvrir('', [1440, 900], { reducedMotion: 'no-preference' }, REAL);
  await p.evaluate(() => document.querySelector('.defil').scrollIntoView({ block: 'center' }));
  const etat = () => p.evaluate(() => { const piste = document.querySelector('.defil__piste'), g = piste.getBoundingClientRect().left, li = [...piste.children].find(li => Math.abs(li.getBoundingClientRect().left - g) < 2);
    return document.querySelector('.defil__compteur').textContent + ' · ' + (li ? li.querySelector('.vignette__nom').firstChild.textContent : '?'); });
  const suivre = () => p.evaluate(() => { const r = document.querySelector('.defil__piste'); window.__pos = []; window.__fin = false; (function f() { window.__pos.push(r.scrollLeft); if (!window.__fin) requestAnimationFrame(f); })(); });
  const bilan = () => p.evaluate(() => { window.__fin = true; const c = document.querySelector('.defil__piste').children, pas = c[1].getBoundingClientRect().left - c[0].getBoundingClientRect().left, n = 16; let recul = 0, total = 0;
    for (let i = 1; i < window.__pos.length; i++) { let d = (window.__pos[i] - window.__pos[i - 1]) / pas; if (Math.abs(Math.abs(d) - n) < 0.5) d -= Math.sign(d) * n; if (d < -0.01) recul++; total += d; }   // seul le recentrage (n vignettes d'un coup, invisible) compte pour 0
    return { recul, total: Math.round(total * 100) / 100, images: window.__pos.length }; });
  const attendre = () => p.waitForTimeout(1100);
  await suivre();
  const suite = [await etat()];
  for (let i = 0; i < 4; i++) { await p.click('[data-d-suiv]'); await attendre(); suite.push(await etat()); }
  const avance = await bilan();
  const attendue = ['1–4', '5–8', '9–12', '13–16', '1–4'].map((c, i) => `${c} / 16 · ${VILLES[(i * 4) % 16]}`);
  ok(suite.join(' → ') === attendue.join(' → '), 'rangée, → quatre fois : ' + suite.join(' → '));
  ok(avance.recul === 0 && Math.abs(avance.total - 16) < 0.05, `rangée : toujours vers la droite, sans retour en arrière (${avance.images} images suivies, avance de ${avance.total} vignettes, ${avance.recul} recul)`);
  await p.click('[data-d-prec]'); await attendre();
  const prec = await etat();
  ok(prec === `13–16 / 16 · ${VILLES[12]}`, `rangée : ← depuis 1–4 → ${prec}`);
  await p.click('[data-d-suiv]'); await attendre();
  await suivre();
  await p.evaluate(async () => { const a = document.querySelector('[data-d-suiv]'); for (let i = 0; i < 3; i++) { a.click(); await new Promise(r => setTimeout(r, 80)); } });
  await attendre();
  const rapides = await etat(), avance3 = await bilan();
  ok(rapides === `13–16 / 16 · ${VILLES[12]}` && avance3.recul === 0 && Math.abs(avance3.total - 12) < 0.05, `rangée : trois clics rapides (80 ms) = trois pages, 1–4 → ${rapides} (avance de ${avance3.total} vignettes, ${avance3.recul} recul)`);
  await ctx.close();
}
{
  // mouvement réduit (défilement instantané) : la rangée, les photos d'un bien, la visionneuse
  const { p, ctx } = await ouvrir('', [1440, 900], {}, REAL);
  const compteur = () => p.evaluate(() => document.querySelector('.defil__compteur').textContent);
  const r = [];
  for (let i = 0; i < 4; i++) { await p.click('[data-d-suiv]'); await p.waitForTimeout(100); r.push(await compteur()); }
  await p.click('[data-d-prec]'); await p.waitForTimeout(100); r.push(await compteur());
  await p.click('[data-d-suiv]'); await p.waitForTimeout(100);
  ok(r.join(' → ') === '5–8 / 16 → 9–12 / 16 → 13–16 / 16 → 1–4 / 16 → 13–16 / 16', 'rangée en mouvement réduit : ' + r.join(' → '));
  const B = '.defil__piste > li:not([data-clone]) .bien[data-bien="0"]';
  const lire = () => p.evaluate(s => { const b = document.querySelector(s), pi = b.querySelector('.bien__piste'), vis = pi.children[Math.round(pi.scrollLeft / pi.clientWidth)]; return b.querySelector('.bien__compteur').textContent + ' ' + vis.getAttribute('src').replace(/^.*\//, ''); }, B);
  await p.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'center' }), B);
  const repos = await style(p, B + ' .bien__fleche--d', 'opacity');
  await p.hover(B);
  const survol = await style(p, B + ' .bien__fleche--d', 'opacity');
  const photos = [await lire()];
  for (let i = 0; i < 2; i++) { await p.click(B + ' .bien__fleche--d'); await p.waitForTimeout(150); photos.push(await lire()); }
  ok(photos.join(' → ') === '1 / 2 bnp-braine-le-comte-01-s.jpg → 2 / 2 bnp-braine-le-comte-03-s.jpg → 1 / 2 bnp-braine-le-comte-01-s.jpg' && repos === '0' && survol === '1',
    `vignette à deux photos : ${photos.map(x => x.split(' ').slice(0, 3).join(' ')).join(' → ')} (flèches au survol seulement)`);
  // visionneuse : ouverte sur la photo affichée dans la vignette
  await p.click(B + ' .bien__fleche--d'); await p.waitForTimeout(150);
  await p.click(B + ' .bien__piste');
  await p.waitForTimeout(150);
  const vis = () => p.evaluate(() => { const v = document.querySelector('.visio'), vp = v.querySelector('.visio__piste'), img = vp.children[Math.round(vp.scrollLeft / vp.clientWidth)], cadre = v.querySelector('.visio__cadre').getBoundingClientRect();
    return { ouvert: !v.hidden && getComputedStyle(v).display !== 'none', cpt: v.querySelector('.visio__compteur').textContent, src: img ? img.getAttribute('src').replace(/^.*\//, '') : null, legende: v.querySelector('.visio__legende').innerHTML,
      focus: document.activeElement && document.activeElement.textContent, corps: document.body.classList.contains('visio-ouverte'), fit: img && getComputedStyle(img).objectFit, ratio: cadre.width / cadre.height, fond: getComputedStyle(v).backgroundColor,
      fleches: [...v.querySelectorAll('.visio__fleche')].map(f => !f.hidden && getComputedStyle(f).display !== 'none').join(' ') }; });
  const v1 = await vis();
  ok(v1.ouvert && photos[1].startsWith('2 / 2') && v1.cpt === '2 / 2' && v1.src === 'bnp-braine-le-comte-03.jpg' && v1.legende === '<b>Braine-le-Comte</b>600 m² · Service finance de la commune',
    `visionneuse : ouverte sur la photo de la vignette (${v1.cpt}, ${v1.src}), « ${v1.legende.replace(/<\/?b>/g, '|')} »`);
  ok(v1.fond === BLANC && v1.fit === 'contain' && Math.abs(v1.ratio - 4 / 3) < 0.01 && v1.fleches === 'true true' && v1.focus === 'Fermer' && v1.corps, 'visionneuse : fond blanc, photo entière (contain) dans un cadre 4:3, flèches de part et d’autre, focus sur « Fermer », page figée');
  // le panneau (visible par défaut) s'efface devant la visionneuse : ses flèches, sa légende et son compteur restent libres, à la souris aussi
  const libres = await p.evaluate(() => [...document.querySelectorAll('.visio__fleche, .visio__legende, .visio__compteur')].every(e => { const r = e.getBoundingClientRect(), x = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return x && e.contains(x); }) && getComputedStyle(document.querySelector('.mq')).display === 'none');
  const cliquer = async s => { try { await p.click(s, { timeout: 2000 }); } catch (e) { /* recouverte : le compteur ne bouge pas, la vérification échoue */ } await p.waitForTimeout(150); return vis(); };
  const vc1 = await cliquer('.visio [data-v-suiv]'), vc2 = await cliquer('.visio [data-v-prec]');
  ok(libres && vc1.cpt === '1 / 2' && vc2.cpt === '2 / 2', `visionneuse : le panneau s'efface, les flèches se cliquent à la souris (${v1.cpt} → ${vc1.cpt} → ${vc2.cpt})`);
  const tab = [];
  for (let i = 0; i < 6; i++) { await p.keyboard.press(i < 4 ? 'Tab' : 'Shift+Tab'); tab.push(await p.evaluate(() => document.activeElement.closest('.visio') ? (document.activeElement.textContent || document.activeElement.className) : 'HORS : ' + document.activeElement.outerHTML.slice(0, 60))); }
  ok(tab.every(t => !t.startsWith('HORS')), 'visionneuse modale : Tab et Maj+Tab restent dans ses commandes — ' + tab.join(' → '));
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(150); const v2 = await vis();
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(150); const v3 = await vis();
  await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(150); const v4 = await vis();
  ok([v2, v3, v4].map(x => `${x.cpt} ${x.src}`).join(' → ') === '1 / 2 bnp-braine-le-comte-01.jpg → 2 / 2 bnp-braine-le-comte-03.jpg → 1 / 2 bnp-braine-le-comte-01.jpg', 'visionneuse au clavier, en boucle : ' + [v2, v3, v4].map(x => x.cpt).join(' → '));
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  const v5 = await vis(), plie = await p.evaluate(() => document.querySelector('.mq').classList.contains('is-plie') || getComputedStyle(document.querySelector('.mq')).display === 'none');
  ok(!v5.ouvert && !v5.corps && !plie, 'visionneuse : Échap la ferme (le panneau revient, sans se replier)');
  await p.evaluate(() => document.querySelector('.defil__piste > li:not([data-clone]) .bien[data-n="1"] .bien__piste').click());
  await p.waitForTimeout(150);
  const v6 = await vis();
  ok(v6.ouvert && v6.cpt === '' && v6.fleches === 'false false', 'visionneuse d’un bien à une photo : ni compteur ni flèches');
  await p.click('.visio [data-fermer]');
  ok(!(await vis()).ouvert, 'visionneuse : « Fermer »');
  await ctx.close();
}
{
  // au clavier, de haut en bas : jamais d'arrêt dans les clones de la boucle (aria-hidden), et les flèches des biens restent atteignables
  const { p, ctx } = await ouvrir('panneau=off', [1440, 900], {}, REAL);
  const arrets = [];
  for (let i = 0; i < 80; i++) { await p.keyboard.press('Tab'); arrets.push(await p.evaluate(() => { const a = document.activeElement; return { cache: !!a.closest('[aria-hidden="true"], [data-clone]'), cls: a.className || a.tagName }; })); }
  const caches = arrets.filter(a => a.cache), fleches = arrets.filter(a => /bien__fleche/.test(a.cls)).length;
  ok(!caches.length && fleches >= 20, `clavier : ${arrets.length} tabulations, aucun arrêt dans un clone de la boucle (${caches.length}), ${fleches} flèches de biens atteintes`);
  await ctx.close();
}
{
  // les trois faits ne sont jamais rognés au survol, même quand ils passent sur deux ou trois lignes (blocs étroits)
  const rognes = [];
  for (const w of [660, 700, 800, 1100, 1440]) {
    const { p, ctx } = await ouvrir('panneau=off', [w, 800], {}, REAL);
    for (const i of [0, 1, 2, 3]) {
      await p.hover(`.bloc >> nth=${i}`);
      const r = await p.evaluate(i => { const f = document.querySelectorAll('.bloc__faits')[i]; return { nom: f.closest('.bloc').querySelector('.bloc__nom').textContent, vu: f.clientHeight, plein: f.scrollHeight }; }, i);
      if (r.plein > r.vu + 1) rognes.push(`${w} ${r.nom} ${r.vu}/${r.plein}`);
    }
    await ctx.close();
  }
  ok(!rognes.length, 'survol des blocs de 660 à 1440 px : les trois faits entiers, jamais rognés' + (rognes.length ? ' — ' + rognes.join(', ') : ''));
}
{
  // photos des blocs, cadre variable (largeur et hauteur suivent la fenêtre) : à 1×, le plus petit fichier suffisant est servi — jamais agrandi, jamais trop lourd
  const ecarts = [];
  for (const [w, h] of [[641, 800], [800, 800], [1024, 768], [1280, 800], [1366, 703], [1440, 900], [1521, 705], [1920, 1080]]) {
    const { p, ctx } = await ouvrir('panneau=off', [w, h], {}, REAL);
    for (const i of await photosImg(p, '.bloc img')) {
      const petit = tailleJpeg(path.join(IMG_DIR, `${i.cle}-s.jpg`)), besoin = Math.max(i.w, i.h * petit.width / petit.height);
      const attendu = petit.width >= besoin ? `${i.cle}-s.jpg` : `${i.cle}.jpg`;
      if (i.servi !== attendu) ecarts.push(`${w}×${h} ${i.cle} : ${i.servi} au lieu de ${attendu} (besoin ${Math.round(besoin)} px)`);
    }
    await ctx.close();
  }
  ok(!ecarts.length, 'blocs, 641 à 1920 px, 1× : le sizes suit le cadre (largeur ou hauteur × ratio), le plus petit fichier suffisant est servi' + (ecarts.length ? ' — ' + ecarts.join(' ; ') : ''));
}
// bascules 22 (papier) et 23 (bas)
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const res = [];
  for (const etat of ['', 'papier=tout', 'bas=anciens', 'papier=tout&bas=anciens']) {
    const { p, ctx } = await ouvrir(etat, [w, h], {}, REAL);
    res.push([etat || 'défaut', await p.evaluate(() => { const c = s => getComputedStyle(document.querySelector(s)), r = s => document.querySelector(s).getBoundingClientRect(), anciens = c('.anciens').display !== 'none';
      return { section: c('.bloc-agences').backgroundColor, bande: c('.bloc-agences__bande').backgroundColor, anciens, avantPied: Math.round(r('.site-footer').top - r(anciens ? '.anciens' : '.bloc-agences').bottom),
        apresSection: anciens ? Math.round(r('.anciens').top - r('.bloc-agences').bottom) : null, fond: c('.anciens').backgroundColor, n: document.querySelectorAll('.ancien').length, cols: c('.anciens__liste').gridTemplateColumns.split(' ').length,
        nom: c('.ancien__nom').fontFamily.split(',')[0] + ' ' + c('.ancien__nom').fontSize, titre: document.querySelector('.anciens .enonce').textContent, eyebrow: document.querySelector('.anciens .eyebrow').textContent,
        premier: document.querySelector('.ancien').textContent }; })]);
    await ctx.close();
  }
  const [def, tout, anc, lesDeux] = res.map(x => x[1]), blanc = w > 640 ? 32 : 20;
  ok(def.section === TRANSPARENT && def.bande === PAPIER && !def.anciens && def.avantPied === 0, `${w} · défaut (V1) : papier sur l'énoncé seul, pas d'anciens projets`);
  ok(tout.section === PAPIER && tout.bande === TRANSPARENT && tout.avantPied === blanc, `${w} · 22 papier=tout : toute la section sur papier, puis ${tout.avantPied} px de blanc avant le pied de page (${blanc} attendus)`);
  ok(anc.anciens && anc.n === 11 && anc.cols === (w > 640 ? 4 : 2) && anc.nom === `Newsreader ${w > 640 ? 24 : 20}px` && anc.fond === TRANSPARENT && anc.eyebrow === 'Autres réalisations' && anc.titre === 'Et, depuis 2002, des projets de toutes tailles.'
    && anc.premier === 'SerhieuxSeraing · 7 200 m²Valorisation et vente d’un bien à un organisme public' && anc.avantPied === 0 && anc.apresSection === 0,
    `${w} · 23 bas=anciens : « Autres réalisations », les 11 projets de l'ancien site sur blanc, en ${anc.cols} colonnes, nom ${anc.nom}`);
  ok(lesDeux.section === PAPIER && lesDeux.anciens && lesDeux.apresSection === 0, `${w} · papier=tout&bas=anciens : la section papier touche les anciens projets (${lesDeux.apresSection} px)`);
}
{
  const { p, ctx } = await ouvrir('', [390, 844], {}, REAL);
  const m = await p.evaluate(() => ({
    blocs: [...document.querySelectorAll('.bloc')].map(b => { const r = b.getBoundingClientRect(), mob = b.querySelector('.bloc__mobile'); return { w: Math.round(r.width), ratio: r.width / r.height, nom: getComputedStyle(b.querySelector('.bloc__nom')).fontSize, mobile: getComputedStyle(mob).display + ' ' + mob.textContent, faits: getComputedStyle(b.querySelector('.bloc__faits')).display }; }),
    cols: [...document.querySelectorAll('.alt__rang')].map(r => getComputedStyle(r).gridTemplateColumns.split(' ').length),
    vignette: (() => { const piste = document.querySelector('.defil__piste'), li = piste.querySelector('li:not([data-clone])'), pr = piste.getBoundingClientRect(), r = li.getBoundingClientRect(), s = li.nextElementSibling.getBoundingClientRect(); return { part: r.width / pr.width, bord: s.left > r.right && s.left < pr.right - 10 }; })(),
    compteur: document.querySelector('.defil__compteur').textContent, titre: getComputedStyle(document.querySelector('.page__titre')).fontSize, enonce: getComputedStyle(document.querySelector('.enonce')).fontSize,
    tete: getComputedStyle(document.querySelector('.bloc-agences__tete')).gridTemplateColumns.split(' ').length, fleches: getComputedStyle(document.querySelector('.visio__fleche')).display }));
  ok(m.cols.every(c => c === 1) && m.blocs.every(b => b.w === 350 && Math.abs(b.ratio - 4 / 3) < 0.01 && b.nom === '28px' && b.faits === 'none')
    && m.blocs.map(b => b.mobile).join(' | ') === 'block Uccle · 14 unités | block Molenbeek-Saint-Jean · 1 200 m² | block Liège · 1 100 m² | block Jemelle · 4 200 m²', 'mobile : un bloc par ligne en 4:3, nom 28 px, « Lieu · surface » dessous, faits masqués');
  ok(Math.abs(m.vignette.part - 0.78) < 0.005 && m.vignette.bord && m.compteur === '1 / 16', `mobile : une vignette à ${Math.round(m.vignette.part * 100)} % de la rangée et le bord de la suivante, « ${m.compteur} »`);
  ok(m.titre === '44px' && m.enonce === '26px' && m.tete === 1 && m.fleches === 'none', 'mobile : titre 44 px, énoncé 26 px en une colonne, visionneuse sans flèches');
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('', [1440, 900], { javaScriptEnabled: false }, REAL);
  ok(await p.evaluate(() => !document.querySelector('.mq') && !document.querySelector('[data-clone]') && document.querySelectorAll('.defil__piste > li').length === 16 && getComputedStyle(document.querySelector('.visio')).display === 'none'
    && getComputedStyle(document.querySelector('.anciens')).display === 'none' && document.querySelectorAll('.bloc').length === 4), 'sans JavaScript : les 4 blocs, la rangée des 16 (défilement natif), visionneuse et anciens projets masqués, sans panneau');
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('', [1440, 900], { deviceScaleFactor: 2 }, REAL);
  const blocs2 = await photosImg(p, '.bloc img');
  ok(blocs2.every(i => i.servi === `${i.cle}.jpg`), `blocs à 1440 × 2 : le 1800 px est servi (${blocs2.map(i => i.servi).join(', ')})`);
  await ctx.close();
}
// photos des biens : la version « 1800 px » d'une vue peut être provisoire (tirée d'une planche) tant que l'original n'est pas réduit — signalé, pas compté en échec
{
  const petites = biensAttendus.flatMap(b => b.photos).filter(k => { const t = tailleJpeg(path.join(IMG_DIR, `${k}.jpg`)); return Math.max(t.width, t.height) < 1800; });
  if (petites.length) console.log(`  info  ${petites.length} vues des biens n'ont pas encore leur 1800 px (plus grand côté < 1800) — reduire-photos.mjs --petit --grand <originaux>, puis rebâtir`);
}
await browser.close();
console.log(ko ? `\n${ko} vérification(s) en échec` : '\nTout est vérifié.');
process.exitCode = ko ? 1 : 0;
