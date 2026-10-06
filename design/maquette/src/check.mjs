// Vérifications de la maquette (Playwright + Chromium) : premier écran (structure F), débordement, paramètres des bascules retirées sans effet,
// valeurs figées et alignement (gel de la Home du 23/09 : signature, espacements, pied de page), en-tête (Φ, wordmark, limite de 1600 px), pied de page
// sur le container de 1 200 px (les quatre pages), carte des réalisations sous « Réalisations » et plus de liste des 4
// (30/09), logos partenaires, photo 2800 px, aucune photo deux fois sur la Home, mode présentation,
// page sans JavaScript, polices, contrastes ; puis les quatre fiches, P6 (débordement, erreurs et images, alignement sur le logo, pied de page, photo de tête
// et son cadre, photo qui suit, rangées de la mosaïque, contenu, précédent / suivant en boucle, visionneuse, téléphone, sans JavaScript), la vue Réalisations
// (P2, puis lot 2b du 04/10 : débordement et erreurs, alignement sur la grille large, ouverture, projets en 2-2-1 — les 4 blocs-liens et Brosse —, mosaïque
// 4-3-4-3-4 des agences au format entier, cases de texte, survols, photos parcourables sur place — rétablies le 05/10 —, visionneuse, photos servies, bascules 22 et 23
// retirées, mobile, sans JavaScript) et la page Engagements (débordement et erreurs, ouverture, registre, œuvre sur sa
// cimaise, cartel, liens, espacements, téléphone, panneau, sans JavaScript ; liens « Engagements » des sept pages).
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

const donnees = JSON.parse(fs.readFileSync(path.resolve(MAQ, '../../data/projects.json'), 'utf8'));
// les quatre projets détaillés, dans l'ordre du champ order : la boucle « Projet précédent / suivant » des fiches (30/09 ; la liste des 4 n'est plus sur la Home)
const DETAILLES = donnees.filter(x => x.kind === 'detailed').sort((a, b) => a.order - b.order);

// la palette, telle que Chromium la rend
const ANTHRACITE = 'rgb(38, 35, 31)', GRIS = 'rgb(107, 101, 92)', GRIS_CHAUD = 'rgb(115, 109, 96)', OR = 'rgb(154, 122, 59)', OR_FONCE = 'rgb(138, 107, 47)', OR_CLAIR = 'rgb(184, 151, 90)',
  BRONZE = 'rgb(104, 78, 30)', PAPIER = 'rgb(249, 249, 246)', SABLE = 'rgb(246, 241, 230)', BLANC = 'rgb(255, 255, 255)', OR_DECO = 'rgb(201, 181, 138)', FILET = 'rgb(230, 225, 214)';

console.log('\n1 · Premier écran — structure F : la photo porte l’accroche, la bande et ses quatre chiffres tiennent dans 900 à 1440 et dans 703 à 1366');
for (const [w, h] of [[1440, 900], [1366, 703]]) {
  const { p, ctx } = await ouvrir('', [w, h]);
  const attendu = Math.min(560, Math.max(320, h - 270)), gauche = (w - 1200) / 2 + 40;
  const photo = await rect(p, '.hero__photo'), titre = await rect(p, '.hero__title span'), texte = await rect(p, '.hero__text'), sig = await rect(p, '.signature'), bande = await rect(p, '.stats-band');
  const nom = `${w}×${h}`;
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

console.log('\n2 · Aucun débordement horizontal');
for (const [w, h] of [[1440, 900], [1366, 703], [390, 844]]) {
  const { p, ctx } = await ouvrir('', [w, h]);
  ok((await largeur(p)) === 0, `${w} × ${h}`); await ctx.close();
}

console.log('\n3 · Plus aucune bascule sur la Home (9c et 15a figées le 26/09) : les paramètres des bascules retirées sont sans effet');
{
  // les bascules retirées le 23/09 (dont le gel de la Home : serif, graisse, cadrage=bas) et le 26/09 (9c cadrage, 15a carte) : un paramètre resté dans
  // une URL ne change plus rien (répété, le script d'état garde sa dernière valeur : ici data-cadrage="centre")
  const { p, ctx } = await ouvrir('ecran=colonnes&photo=data-box-03&accroche=droite&deco=arcs&signature=anthracite&autres=bande&pied=blanc&portee=partout&serif=source-serif&graisse=500&cadrage=bas&cadrage=haut&cadrage=centre&carte=papier-contour');
  ok((await style(p, '.hero__photo', 'display')) === 'block' && ['left', 'start'].includes(await style(p, '.hero__title', 'textAlign')) && (await p.evaluate(() => document.querySelectorAll('.deco__svg').length)) === 1
    && (await style(p, '.signature', 'color')) === OR_FONCE && (await style(p, '.carte', 'display')) === 'grid' && (await style(p, '.site-footer', 'backgroundColor')) === PAPIER && (await style(p, '.h2--sans', 'fontWeight')) === '500'
    && (await style(p, '.hero__title', 'fontFamily')).startsWith('Newsreader') && (await style(p, '.hero__title', 'fontWeight')) === '400' && (await style(p, '.stat__value', 'fontWeight')) === '400' && (await style(p, '.hero__photo img', 'objectPosition')) === '50% 20%'
    && (await style(p, '.carte__pays', 'fill')) === SABLE && (await style(p, '.carte__pays', 'stroke')) === 'none',
    'paramètres des bascules retirées (ecran, photo, accroche, deco, signature, autres, pied, portee, serif, graisse, cadrage=bas / haut / centre, carte=papier-contour) : sans effet');
  await ctx.close();
}

console.log('\n4 · Valeurs figées et alignement (valeurs par défaut)');
{
  const { p, ctx } = await ouvrir('');
  ok((await style(p, 'body', 'fontFamily')).startsWith('"Instrument Sans"') && (await style(p, '.hero__title', 'fontFamily')).startsWith('Newsreader'), 'sans Instrument Sans, serif Newsreader');
  const h2 = await p.evaluate(() => [...document.querySelectorAll('.h2')].map(h => { const s = getComputedStyle(h); return { cls: h.className, texte: h.textContent, ff: s.fontFamily, fw: s.fontWeight, fs: s.fontSize }; }));
  const graphique = h2.find(h => h.cls === 'h2 h2--sans'), carteH2 = h2.find(h => h.cls === 'h2 h2--serif');
  ok(h2.length === 2 && graphique && /m² en cours de transformation/.test(graphique.texte) && graphique.ff.startsWith('"Instrument Sans"') && graphique.fw === '500' && graphique.fs === '28px', `titre du graphique : sans medium 28 px (.h2--sans) — « ${graphique && graphique.texte} »`);
  // titre et paragraphe de la carte (04/10, lot 2b items 3 et 14) : ceux de l'en-tête carte de content/home.md — plus de nombre dans le titre (le titre
  // calculé du 30/09 est retiré), et un paragraphe propre à la Home, distinct du programme agences de Réalisations ; autant de points que de biens
  const homeFm = fs.readFileSync(path.resolve(MAQ, '../../content/home.md'), 'utf8').replace(/\r\n?/g, '\n').match(/^---\n([\s\S]*?)\n---/)[1];
  const deq = v => (v || '').trim().replace(/^"(.*)"$/, '$1');
  const carteAttendue = { titre: deq((homeFm.match(/\ncarte:\s*\n\s+title:\s*(.+)/) || [])[1]), texte: deq((homeFm.match(/\ncarte:\s*\n\s+title:.*\n\s+text:\s*(.+)/) || [])[1]) };
  const carteP = await p.evaluate(() => document.querySelector('.carte__texte p').textContent);
  const agencesMd = fs.readFileSync(path.resolve(MAQ, '../../content/realisations.md'), 'utf8').replace(/\r\n?/g, '\n').split('## Le programme agences')[1].replace(/<!--[\s\S]*?-->/g, '').trim().split(/\n\s*\n/)[0].trim();
  const nAdresses = JSON.parse(fs.readFileSync(path.resolve(MAQ, '../../data/projects.json'), 'utf8')).filter(x => x.address).length;
  const villesCarte = JSON.parse(fs.readFileSync(path.resolve(MAQ, '../../data/carte/belgique.json'), 'utf8')).villes;
  ok(carteH2 && carteAttendue.titre && carteH2.texte === carteAttendue.titre && !/\d|adresses/.test(carteH2.texte) && carteH2.ff.startsWith('Newsreader') && carteH2.fw === '400' && carteH2.fs === '34px', `titre de la carte : serif 34 px (.h2--serif), celui de content/home.md, sans nombre — « ${carteH2 && carteH2.texte} »`);
  ok(carteAttendue.texte && carteP === carteAttendue.texte && carteP !== agencesMd, `paragraphe de la carte : celui de content/home.md (carte.text), distinct du programme agences — « ${carteP.slice(0, 60)}… »`);
  ok(villesCarte.length === nAdresses, `carte : un point par bien avec une adresse (${villesCarte.length} dans belgique.json, ${nAdresses} dans projects.json)`);
  ok(await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--fs-chapitre').trim() === '26px' && getComputedStyle(document.documentElement).getPropertyValue('--font-titres') === ''), '--fs-chapitre conservée (à décider sur la fiche), --font-titres retirée');
  ok((await style(p, '.hero__title', 'fontWeight')) === '400' && (await style(p, '.stat__value', 'fontWeight')) === '400' && (await style(p, '.h2--serif', 'fontWeight')) === '400'
    && (await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--poids-serif') === '')) && !(await p.evaluate(() => [...document.styleSheets].some(ss => { try { return [...ss.cssRules].some(r => r.cssText.includes('Source Serif')); } catch (e) { return false; } }))),
    'serif figée : Newsreader 400 partout, plus de seconde serif ni de --poids-serif');
  // gel de la Home (23/09) : espacements
  const gel = await p.evaluate(() => {
    const b = s => { const r = document.querySelector(s).getBoundingClientRect(); return { top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY) }; };
    const p1 = b('.hero__text'), titre = b('.section--chart .h2'), pied = b('.site-footer'), nom = b('.footer__name'), nav = b('.footer__nav'), legal = b('.footer__legal'), quote = b('.footer__quote'), contact = b('.footer__contact');
    return { texteTitre: titre.top - p1.bottom, piedHaut: nom.top - pied.top, navFilet: legal.top - Math.max(nav.bottom, quote.bottom, contact.bottom), dernier: document.querySelector('.footer__nav a:last-child').textContent, filet: getComputedStyle(document.querySelector('.footer__legal')).borderTopWidth };
  });
  ok(gel.texteTitre >= 60 && gel.texteTitre <= 68, `64 px entre la fin du bloc de texte et « 11 150 m² … » (${gel.texteTitre} px)`);
  ok(gel.piedHaut === 48 && gel.navFilet === 32 && gel.dernier === 'Confidentialité' && gel.filet === '1px', `pied de page : 48 px en haut, ${gel.navFilet} px entre « ${gel.dernier} » et le filet du bas`);
  ok((await style(p, '.stats-band', 'backgroundColor')) === PAPIER, 'bande : surface papier');
  ok((await style(p, '.stat__value', 'color')) === OR, 'chiffres clés : or');
  const largeurEtiquette = parseFloat(await style(p, '.stat__label', 'maxWidth'));
  ok((await style(p, '.stat__label', 'color')) === GRIS_CHAUD && largeurEtiquette > 195 && largeurEtiquette < 215, `étiquettes des chiffres : gris chaud, figé, 22ch (${largeurEtiquette}px)`);
  ok((await p.evaluate(() => document.querySelectorAll('.stat__label')[1].getBoundingClientRect().height)) < 45, '« Agences bancaires transformées depuis 2022 » ne se déchire pas sur trois lignes (22ch)');
  const deco = await p.evaluate(() => [...document.querySelectorAll('.deco__svg')].map(s => ({ cls: s.getAttribute('class'), display: getComputedStyle(s).display, color: getComputedStyle(s).color, cercles: s.querySelectorAll('circle').length })));
  ok(deco.length === 1 && /deco--anneaux/.test(deco[0].cls) && deco[0].display === 'block' && deco[0].color === OR_DECO && deco[0].cercles === 2, 'élément de la bande : anneaux, figés, or #C9B58A (les arcs ne sont plus dans la page)');
  ok((await style(p, '.bar__fill', 'backgroundColor')) === ANTHRACITE && (await style(p, '.bar__track', 'backgroundColor')) === SABLE, 'graphique : barres anthracite sur piste sable (--surface-piste détachée de --surface)');
  ok((await style(p, '.carte__pt', 'fill')) === ANTHRACITE && (await style(p, '.carte__pays', 'fill')) === SABLE && (await style(p, '.carte__pays', 'stroke')) === 'none', 'carte : points anthracite, fond du pays sable (figé le 26/09)');
  ok((await style(p, '.site-footer', 'backgroundColor')) === PAPIER && (await style(p, '.site-footer', 'borderTopStyle')) === 'none', 'pied de page : fond papier, sans filet en haut (figé)');
  ok((await style(p, '.autres__lien', 'color')) === OR_FONCE && (await p.evaluate(() => document.querySelector('.autres__lien').textContent)) === 'Toutes les réalisations →', 'lien « Toutes les réalisations → » : or foncé');
  const libelles = await p.evaluate(() => ({ nav: document.querySelector('.site-nav a').textContent, plan: document.querySelector('.footer__nav a').textContent, liste: !!document.querySelector('.section--projets, .four'), carte: document.querySelector('.section--autres .eyebrow').textContent,
    chiffre: [...document.querySelectorAll('.stat__label')].some(l => l.textContent === 'Projets en cours'), onglet: [...document.querySelectorAll('.mq__pages a')].map(a => a.textContent).join(' · ') }));
  const siteNav = JSON.parse(fs.readFileSync(path.resolve(MAQ, '../../data/site.json'), 'utf8')).nav.find(n => n.href === '/realisations').label;
  ok(libelles.nav === siteNav && libelles.plan === siteNav && !libelles.liste && libelles.carte === siteNav && libelles.chiffre && libelles.onglet === 'Home · Fiche · Réalisations · Engagements',
    `libellés : navigation et plan « ${libelles.nav} » (data/site.json), carte « ${libelles.carte} » (même libellé, 30/09), plus de liste des 4, « Projets en cours » inchangé, onglets ${libelles.onglet}`);
  const photos = await p.evaluate(() => [...document.querySelectorAll('.hero__photo img')].map(i => ({ key: i.dataset.photo, display: getComputedStyle(i).display, focal: getComputedStyle(i).objectPosition })));
  ok(photos.length === 1 && photos[0].key === 'community-05' && photos[0].display === 'block' && photos[0].focal === '50% 20%', `photo du premier écran : Community 05 seule, cadrage haut, figé le 26/09 (${photos.map(x => x.focal).join(' · ')})`);
  ok(['left', 'start'].includes(await style(p, '.hero__title', 'textAlign')) && /at 0(px)? 0(px)?,/.test(await p.evaluate(() => getComputedStyle(document.querySelector('.hero__photo'), '::after').backgroundImage)) && !(await p.evaluate(() => [...document.querySelectorAll('head style')].some(s => /9d/.test(s.textContent)))), 'accroche à gauche, voile depuis le coin haut-gauche (plus d’aiguillage photo → côté dans la page)');
  ok((await style(p, '.footer__mail', 'color')) === ANTHRACITE && (await style(p, '.footer__mail', 'borderBottom')) === `1px solid ${OR_CLAIR}`, 'mail du pied de page : anthracite, souligné (--c-mail distinct de --c-lien)');
  ok((await style(p, '.signature', 'color')) === OR_FONCE && (await style(p, '.signature', 'fontStyle')) === 'italic', 'signature : or (or foncé), figée, italique');
  ok((await style(p, '.logo__mark', 'color')) === BRONZE && (await style(p, '.logo__mark', 'fill')) === BRONZE, 'Φ de l’en-tête : bronze');
  ok((await p.evaluate(() => getComputedStyle(document.querySelector('.site-nav a'), '::after').backgroundColor)) === OR, 'trait de survol : or');
  const wm = await p.evaluate(() => { const t = document.querySelector('.logo__texte'), s = getComputedStyle(t); return { trace: !!document.querySelector('.logo__trace'), display: s.display, ff: s.fontFamily, fs: s.fontSize, ls: parseFloat(s.letterSpacing), fw: s.fontWeight, tt: s.textTransform, w: Math.round(t.getBoundingClientRect().width) }; });
  ok(!wm.trace && wm.display !== 'none' && /^Jost/.test(wm.ff) && wm.fs === '27.7px' && Math.abs(wm.ls - 27.7 * 0.18) < 0.05 && wm.fw === '400' && wm.tt === 'uppercase', `wordmark : Jost 400, capitales, 0,18 em, sans tracé PNG (${wm.w} px de large)`);
  const hd = await p.evaluate(() => ({ header: document.querySelector('.site-header').getBoundingClientRect().width, logo: document.querySelector('.logo').getBoundingClientRect().left, nav: document.querySelector('.site-nav').getBoundingClientRect().right }));
  ok(hd.header === 1440 && Math.round(hd.logo) === 40 && Math.round(hd.nav) === 1400, `en-tête pleine largeur (logo à ${Math.round(hd.logo)} px, liens à ${1440 - Math.round(hd.nav)} px du bord)`);
  ok(!(await p.evaluate(() => document.querySelector('.section--projets, .four'))), 'plus de liste des 4 sur la Home (30/09, retour de Julien : « tester la Home sans la section Réalisations ») ; les fiches restent accessibles par la vue Réalisations');
  ok((await style(p, '.partner__couleur', 'display')) === 'block' && !(await p.evaluate(() => document.querySelector('.partner__encre'))), 'logos partenaires : couleur, figés (plus d’encre inline)');
  const cles = await p.evaluate(() => [...document.querySelectorAll('.mq__b')].map(f => f.dataset.cle));
  const inactives = await p.evaluate(() => [...document.querySelectorAll('.mq__b.is-inactif')].map(f => f.dataset.cle));
  ok(cles.join(' ') === 'graphique' && !inactives.length, 'panneau : ' + cles.join(' · ') + ' (13 graphique, lot 2b : anneau retenu le 01/10 / barres pour le 7/10 ; 9c et 15a figées le 26/09, 20 et 21 retirées ; 22 et 23, vue Réalisations, retirées le 04/10)');
  // aucune photo deux fois sur la Home (30/09 : la liste des 4 et ses aperçus sont retirés, il reste la photo du premier écran)
  const photosHome = await p.evaluate(() => [...document.querySelectorAll('img')].map(i => i.getAttribute('src')).filter(s => /directions\/img\//.test(s)).map(s => s.replace(/^.*\//, '').replace(/(-s|-l)?\.jpg$/, '')));
  const premier = await p.evaluate(() => document.querySelector('.hero__photo img').dataset.photo);
  ok(premier === 'community-05' && new Set(photosHome).size === photosHome.length, `aucune photo deux fois sur la Home : le premier écran montre ${premier} (${photosHome.length} photos, ${new Set(photosHome).size} différentes)`);
  const liens = await p.evaluate(() => ({ nav: document.querySelector('.site-nav a').getAttribute('href'), plan: document.querySelector('.footer__nav a').getAttribute('href'), tous: document.querySelector('.autres__lien').getAttribute('href') }));
  ok(liens.nav === 'realisations.html' && liens.plan === 'realisations.html' && liens.tous === 'realisations.html', 'liens : navigation, plan et « Toutes les réalisations → » vers realisations.html');
  await ctx.close();
}
{
  // en-tête (26/09) : la même limite que le contenu large, 1600 px gouttière comprise — pleine largeur jusqu'à 1600 px de fenêtre, centré au-delà
  const { p, ctx } = await ouvrir('', [1920, 1080]);
  const hd = await p.evaluate(() => ({ w: Math.round(document.querySelector('.site-header').getBoundingClientRect().width), logo: Math.round(document.querySelector('.logo').getBoundingClientRect().left), nav: Math.round(document.querySelector('.site-nav').getBoundingClientRect().right) }));
  ok(hd.w === 1600 && hd.logo === 200 && hd.nav === 1720, `en-tête à 1920 : limité à 1600 px (${hd.w}), logo à ${hd.logo} px, liens jusqu'à ${hd.nav} px`);
  await ctx.close();
}
// pied de page (Cowork, 26/09) : sur le container de 1 200 px sur les quatre pages, comme sur la Home, Réalisations et Engagements comprises — seul l'en-tête
// est sur la grille large ; .site-footer > .container n'a pas de max-width propre, et le contact commence au même x d'une page à l'autre
for (const [w, h] of [[1920, 1080], [1521, 705], [390, 844]]) {
  const pied = [];
  for (const page of ['index', 'projet-the-bank', 'realisations', 'engagements']) {
    const { p, ctx } = await ouvrir('', [w, h], {}, page);
    pied.push({ page, ...await p.evaluate(() => ({ mw: getComputedStyle(document.querySelector('.site-footer > .container')).maxWidth, x: Math.round(document.querySelector('.footer__contact').getBoundingClientRect().left) })) });
    await ctx.close();
  }
  ok(pied.every(q => q.mw === '1200px' && q.x === pied[0].x), `${w} × ${h} : pied de page sur le container de 1 200 px, contact au même x sur les quatre pages — ${pied.map(q => `${q.page} ${q.mw}, x ${q.x}`).join(' · ')}`);
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
    place: document.querySelector('.section--chart').nextElementSibling.classList.contains('section--autres') && document.querySelector('.section--autres').nextElementSibling.classList.contains('section--collectif'),
    pts: document.querySelectorAll('.carte__pt').length, labs: document.querySelectorAll('.carte__lab').length, rang1: [...document.querySelectorAll('.carte__lab[data-rang="1"]')].map(t => t.textContent),
    groupe: document.querySelector('.carte__lab--groupe').textContent, fig: Math.round(document.querySelector('.carte__fig').getBoundingClientRect().width),
    bxl: [...document.querySelectorAll('.carte__lieu[data-lieu="Bruxelles"] .carte__pt')].map(c => c.getAttribute('r')), autres: [...document.querySelectorAll('.carte__lieu:not([data-lieu="Bruxelles"]) .carte__pt')].map(c => c.getAttribute('r')),
    section: Math.round(document.querySelector('.section--autres').getBoundingClientRect().height),
    bande: !!document.querySelector('.bande, .autres__tous'),
  }));
  ok(c.place, 'la section Réalisations (la carte) suit le graphique et précède Collectif (30/09 : plus de liste des 4 entre les deux)');
  ok(!c.bande, 'la bande défilante n’est plus dans la page');
  ok(c.pts === 16 && c.labs === 16 && c.groupe === 'Bruxelles', `carte : ${c.pts} points, ${c.labs} étiquettes, groupe « ${c.groupe} »`);
  ok(c.bxl.length === 1 && c.bxl[0] === '6.5' && c.autres.length === 15 && c.autres.filter(r => r === '5.5').length === 1 && c.autres.filter(r => r === '4.5').length === 14, 'carte : Bruxelles = un seul point r 6,5, Namur (Jambes + Belgrade, 30/09) r 5,5, les quatorze autres r 4,5');
  ok(c.rang1.length === 3, 'carte : étiquettes de rang 1 — ' + c.rang1.join(' · '));
  ok(c.fig <= 600, `carte : SVG ${c.fig} px de large (600 max)`);
  ok((await style(p, '.carte__pays', 'fill')) === SABLE && (await style(p, '.carte__pt', 'fill')) === ANTHRACITE && (await style(p, '.carte__pt', 'stroke')) === BLANC && (await style(p, '.carte__lab', 'fill')) === GRIS && (await style(p, '.carte__lab--groupe', 'fill')) === ANTHRACITE, 'carte : fond du pays sable (figé le 26/09), points anthracite à liseré blanc, étiquettes gris chaud, Bruxelles anthracite');
  const centre = await p.evaluate(() => {
    const fig = document.querySelector('.carte__fig').getBoundingClientRect(), texte = document.querySelector('.carte__texte').getBoundingClientRect();
    return Math.abs((fig.top + fig.bottom) / 2 - (texte.top + texte.bottom) / 2);
  });
  ok(centre <= 1, `carte : le bloc de texte est centré verticalement sur la carte (écart ${centre} px)`);
  await p.hover('.carte__lieu[data-lieu="Jemelle"] .carte__pt');
  ok((await style(p, '.carte__lieu[data-lieu="Jemelle"] .carte__lab', 'fill')) === ANTHRACITE, 'carte : le survol d’un point passe son étiquette en anthracite');
  // Chevauchements dans le SVG : getBBox() donne la boîte englobante dans le système de coordonnées propre du SVG (le viewBox, indépendant
  // du zoom ou de la largeur d'écran), donc directement comparable aux décalages écrits dans belgique.json/belgique.svg. On teste les 16
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
  ok(!chevauchements.length, chevauchements.length ? `carte : chevauchements (getBBox) — ${chevauchements.join(', ')}` : 'carte : aucune des 16 étiquettes ne chevauche une autre étiquette ni un point (getBBox, boîtes du SVG)');
  // Étiquettes collées à leur point (30/09, Axel : « les noms des villes plus proches des points ») : distance entre la boîte de l'étiquette
  // et le bord du point, en unités du viewBox, 4 au plus ; Namur remplace Jambes et Belgrade.
  const lab = await p.evaluate(() => {
    const pts = Object.fromEntries([...document.querySelectorAll('.carte__pt')].map(c => [c.querySelector('title').textContent, { x: +c.getAttribute('cx'), y: +c.getAttribute('cy'), r: +c.getAttribute('r') }]));
    const noms = [...document.querySelectorAll('.carte__lab')].map(t => t.textContent);
    const loin = [...document.querySelectorAll('.carte__lab')].map(t => { const b = t.getBBox(), pt = pts[t.textContent];
      const dx = Math.max(b.x - pt.x, 0, pt.x - (b.x + b.width)), dy = Math.max(b.y - pt.y, 0, pt.y - (b.y + b.height));
      return { nom: t.textContent, d: Math.hypot(dx, dy) - pt.r }; }).filter(e => e.d > 4).map(e => `${e.nom} (${e.d.toFixed(1)})`);
    return { loin, namur: noms.includes('Namur') && !noms.includes('Jambes') && !noms.includes('Belgrade') };
  });
  ok(!lab.loin.length && lab.namur, lab.loin.length ? `carte : étiquettes trop loin de leur point — ${lab.loin.join(', ')}` : 'carte : chaque étiquette à 4 unités au plus de son point ; « Namur » au lieu de Jambes et Belgrade (30/09)');
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

console.log('\n5 bis · Graphique 11 150 m² (lot 2b, item 1) : l’anneau, retenu le 01/10 (1,8 s) ; les barres en bascule 13 pour le 7/10');
{
  const LIBELLES = ['Industriel', 'Résidentiel', 'Commerce'];
  const mesure = p => p.evaluate(() => {
    const vis = e => getComputedStyle(e).display !== 'none';
    const g = document.querySelector('.graph--anneau'), titre = document.querySelector('.section--chart .h2').getBoundingClientRect().left;
    const noms = [...g.querySelectorAll('.graph__nom')].map(e => e.textContent), vals = [...g.querySelectorAll('.graph__val')].map(e => e.textContent);
    const parts = [...g.querySelectorAll('.graph__part')].map(c => ({ l: parseFloat(c.style.getPropertyValue('--l')), da: getComputedStyle(c).strokeDasharray }));
    const boites = [...g.querySelectorAll('svg, li')].map(e => e.getBoundingClientRect());
    return { anneau: vis(g), barres: vis(document.querySelector('.bars')), variantes: document.querySelectorAll('.graph').length, cls: g.className, noms, vals, parts,
      gauche: Math.round(Math.min(...boites.map(b => b.left)) - titre), droite: Math.round(Math.max(...boites.map(b => b.right))), svg: Math.round(g.querySelector('svg').getBoundingClientRect().width),
      largeur: document.documentElement.clientWidth, debord: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  for (const vp of [[1521, 705], [390, 844]]) {
    const { p, ctx, erreurs } = await ouvrir('', vp);
    const m = await mesure(p);
    const somme = m.parts.reduce((s, x) => s + x.l, 0);
    ok(m.anneau && !m.barres && m.variantes === 1 && m.noms.join(' ') === LIBELLES.join(' ') && m.vals.join(' ') === '41 % 34 % 25 %',
      `anneau à ${vp[0]} (par défaut) : seul visible, les barres masquées, plus aucune autre variante ; ${m.noms.map((n, i) => n + ' ' + m.vals[i]).join(' · ')}`);
    ok(Math.abs(somme + 3 * 0.5 - 100) < 0.01 && m.svg === (vp[0] > 640 ? 220 : 180), `anneau à ${vp[0]} : ${m.svg} px, les trois parts et leurs joints font le tour (${somme.toFixed(1)} + 3 × 0,5)`);
    ok(m.parts.every(x => Math.abs(parseFloat(x.da) - x.l) < 0.01) && !/a-remplir/.test(m.cls),
      `anneau à ${vp[0]} : « réduire les animations » → plein d'emblée (${m.parts.map(x => x.da.split(',')[0]).join(' · ')})`);
    ok(m.debord === 0 && m.droite <= m.largeur - (vp[0] > 640 ? 0 : 20) && m.gauche >= 0 && m.gauche <= 2 && erreurs.length === 0,
      `anneau à ${vp[0]} : aucun débordement, aligné sur le titre (${m.gauche} px ; bord droit à ${m.droite} px), aucune erreur`);
    await ctx.close();
  }
  {
    const { p, ctx } = await ouvrir('graphique=barres');
    const m = await mesure(p);
    ok(m.barres && !m.anneau, 'bascule 13, ?graphique=barres : les barres, sans l’anneau');
    await ctx.close();
  }
  {
    const { p, ctx } = await ouvrir('', [1440, 900], { javaScriptEnabled: false });
    const m = await mesure(p);
    ok(m.anneau && !m.barres && m.parts.every(x => Math.abs(parseFloat(x.da) - x.l) < 0.01), 'sans JavaScript : l’anneau, plein');
    await ctx.close();
  }
  // les parts s'enchaînent sur une seule courbe — chacune part quand la précédente finit, la dernière finit avant la fin de --remplissage
  {
    const { p, ctx } = await ouvrir('');
    const t = await p.evaluate(() => [...document.querySelectorAll('.graph--anneau .graph__part')].map(c => ({ d: parseFloat(c.style.getPropertyValue('--d')), t: parseFloat(c.style.getPropertyValue('--t')) })));
    const duree = await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--remplissage').trim());
    ok(t.every((x, i) => i === 0 || Math.abs(t[i - 1].d + t[i - 1].t - x.d) < 0.02) && t[2].d + t[2].t <= 1 && t[2].t > t[0].t && duree === '1.8s',
      `le tour suit une courbe de décélération en ${duree} (départs ${t.map(x => x.d.toFixed(3)).join(' · ')}, durées ${t.map(x => x.t.toFixed(3)).join(' · ')}, en fractions de --remplissage)`);
    await ctx.close();
  }
  // le remplissage : vide avant l'arrivée à l'écran, puis plein ; rejoué au passage aux barres, qui se remplissent aussi
  {
    const { p, ctx } = await ouvrir('', [1521, 705], { reducedMotion: 'no-preference' });
    const da = () => p.evaluate(() => [...document.querySelectorAll('.graph--anneau .graph__part')].map(c => parseFloat(getComputedStyle(c).strokeDasharray)));
    const avant = await da();
    // retouche du 01/10 : le remplissage démarre quand l'anneau lui-même est entièrement à l'écran — la section à moitié visible mais l'anneau coupé par le bas de la fenêtre, il reste vide
    await p.evaluate(() => { const s = document.querySelector('.section--chart').getBoundingClientRect(); window.scrollTo(0, s.top + window.scrollY - (window.innerHeight - s.height / 2)); });
    await p.waitForTimeout(600);
    const moitie = await p.evaluate(() => { const s = document.querySelector('.section--chart').getBoundingClientRect(), a = document.querySelector('.graph__svg').getBoundingClientRect(), h = window.innerHeight; return { section: Math.round((Math.min(s.bottom, h) - Math.max(s.top, 0)) / s.height * 100), coupe: a.top < h && a.bottom > h }; });
    const encoreVide = await da();
    ok(moitie.section >= 50 && moitie.coupe && encoreVide.every(x => x === 0), `remplissage : la section à moitié visible (${moitie.section} %) mais l'anneau coupé par le bas de la fenêtre → l'anneau reste vide`);
    await p.evaluate(() => document.querySelector('.section--chart').scrollIntoView({ block: 'center' }));
    await p.waitForTimeout(500);
    const pendant = await da();
    await p.waitForTimeout(1800);
    const apres = await da(), l = await p.evaluate(() => [...document.querySelectorAll('.graph--anneau .graph__part')].map(c => parseFloat(c.style.getPropertyValue('--l'))));
    ok(avant.every(x => x === 0), 'remplissage : l’anneau vide tant que le graphique n’est pas à l’écran');
    ok(pendant[0] > 0 && pendant[2] === 0 && apres.every((x, i) => Math.abs(x - l[i]) < 0.01), `remplissage : en cours à 500 ms (${pendant.map(x => x.toFixed(1)).join(' · ')}), plein à 2,3 s`);
    await p.click('.mq__b[data-cle="graphique"] label[for="mq-graphique-barres"]');
    await p.waitForTimeout(150);
    const b1 = await p.evaluate(() => getComputedStyle(document.querySelector('.bar__fill')).transform);
    await p.waitForTimeout(2300);
    const b2 = await p.evaluate(() => [...document.querySelectorAll('.bar__fill')].map(f => getComputedStyle(f).transform));
    ok(/^matrix\(0\.\d+, 0, 0, 1/.test(b1) && b2.every(x => x === 'matrix(1, 0, 0, 1, 0, 0)' || x === 'none') && (await p.evaluate(() => location.search)) === '?graphique=barres',
      `panneau : les barres se remplissent au passage (${b1.split(',')[0]}) à 150 ms, pleines ensuite ; ?graphique=barres`);
    await ctx.close();
  }
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
  ok(await p.evaluate(() => !document.querySelector('.mq') && getComputedStyle(document.querySelector('.stats-band')).backgroundColor === 'rgb(249, 249, 246)' && getComputedStyle(document.querySelector('.hero__photo img')).objectPosition === '50% 20%'), 'sans JavaScript : la page est la combinaison retenue, sans panneau'); await ctx.close();
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

// ---------- les quatre fiches, vue Réalisations et page Engagements ----------
const FICHE = 'projet-the-bank', REAL = 'realisations', ENG = 'engagements';
const familles = ['Newsreader', 'Instrument Sans', 'Jost'];
async function polices(p, nom) {
  for (const f of familles) ok(await p.evaluate(async f => { await document.fonts.load(`400 16px "${f}"`); return document.fonts.check(`400 16px "${f}"`); }, f), `${nom} : police chargée en file:// : ${f}`);
}
// parcourir la page, puis charger toutes les images, y compris celles de la rangée, hors champ sur le côté (loading="lazy") : un fichier manquant
// remonte en erreur de console
const parcourir = p => p.evaluate(async () => {
  const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); } window.scrollTo(0, 0);
  const imgs = [...document.images]; imgs.forEach(i => { i.loading = 'eager'; });
  await Promise.all(imgs.map(i => i.complete ? null : new Promise(r => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); setTimeout(r, 5000); })));
});

console.log('\n8 · Les quatre fiches (P6, Cowork, 26/09)');
// un seul gabarit, dans l'ordre du champ order (DETAILLES, en tête du fichier : celui de la boucle « Projet précédent / suivant » et de la liste des 4 de la Home) ;
// les valeurs provisoires (lot 3) de build.mjs — la région, les infos, le cadre de la photo de tête (part de la page et format) et son point focal — et les
// rangées attendues de la mosaïque, le même nombre de photos par rangée à 1 200, 1 521 et 1 920 px
const PAYSAGE = 2100 / 1694;
const FICHES = {
  'the-bank': { region: 'Liège', faits: 'Centre-ville · 1 100 m² · Logements & commerce', part: 0.5, format: PAYSAGE, focal: '50% 0%', rangees: '2' },
  'data-box': { region: 'Rochefort', faits: 'Jemelle · 4 200 m² · Site technique', part: 0.5, format: PAYSAGE, focal: '60% 50%', rangees: '2 3' },
  'community': { region: 'Bruxelles', faits: 'Uccle · 600 m² · Co-living', part: 0.5, format: PAYSAGE, focal: '50% 50%', rangees: '2 3 2 3' },
  'ateliers-118': { region: 'Bruxelles', faits: 'Molenbeek-Saint-Jean · 1 200 m² · Ateliers', part: 0.4, format: 1, focal: '50% 0%', rangees: '4' },
};
const pageDe = d => `projet-${d.id}`;
ok(DETAILLES.map(x => x.id).join(' ') === Object.keys(FICHES).join(' ') && DETAILLES.every(x => x.selection && x.selection.length > 1 && x.selection.every(k => k.startsWith(x.id + '-'))),
  `les quatre projets détaillés, dans l'ordre du champ order, avec leur champ selection (la photo du projet, puis la mosaïque) — ${DETAILLES.map(x => `${x.id} ${x.selection.length}`).join(' · ')}`);
{
  // chaque fichier cité par les fiches existe : src, srcset et les photos de la visionneuse (data-grande)
  const cites = new Set(), manquants = [];
  for (const d of DETAILLES) for (const m of fs.readFileSync(path.join(MAQ, pageDe(d) + '.html'), 'utf8').matchAll(/(?:src|srcset|data-grande)="([^"]+)"/g))
    for (const u of m[1].split(',').map(x => x.trim().split(' ')[0]).filter(x => /\.jpg$/.test(x))) { cites.add(u); if (!fs.existsSync(path.resolve(MAQ, u))) manquants.push(u); }
  ok(cites.size > 0 && !manquants.length, `fiches : les ${cites.size} photos citées (src, srcset, visionneuse) existent` + (manquants.length ? ' — manquent : ' + manquants.join(', ') : ''));
}
// aux quatre formats : ni débordement, ni erreur, toutes les images chargées ; titre, mosaïque et voisins au x du logo ; pied de page sur le container de
// 1 200 px, contact au x de la Home ; la photo de tête — au-dessus de 640 px, collée au bord droit de la fenêtre et au bas de l'en-tête, 50 % de la page
// (40 % pour Ateliers 118), au format de son cadre, son point focal, sticky ; au téléphone, pleine largeur au même format, après le titre et les infos,
// avant les chapitres, plus sticky — ; les rangées de la mosaïque (d'une seule ligne et pleine largeur ± 1 px, sauf une dernière rangée plafonnée à sa
// cible ; deux photos au plus au téléphone) ; aucune figcaption
for (const [w, h] of [[1521, 705], [1920, 1080], [1200, 800], [390, 844]]) {
  const tel = w <= 640;
  const home = await ouvrir('panneau=off', [w, h]);
  const xContact = await home.p.evaluate(() => Math.round(document.querySelector('.footer__contact').getBoundingClientRect().left));
  await home.ctx.close();
  for (const d of DETAILLES) {
    const F = FICHES[d.id], nom = `${pageDe(d)} · ${w} × ${h}`;
    const { p, ctx, erreurs } = await ouvrir('panneau=off', [w, h], {}, pageDe(d));
    await parcourir(p);
    await p.waitForLoadState('networkidle');
    const deb = await largeur(p);
    const m = await p.evaluate(() => {
      const r = s => document.querySelector(s).getBoundingClientRect(), photo = document.querySelector('.fiche__photo'), b = photo.getBoundingClientRect(), mos = document.querySelector('.fiche__mosaique');
      return { images: document.images.length, chargees: [...document.images].every(i => i.complete && i.naturalWidth > 0), cw: document.documentElement.clientWidth,
        logo: r('.logo').left, titre: r('.page__titre').left, mosaique: mos.getBoundingClientRect().left, voisins: r('.fiche__voisins').left, entete: r('.site-header').bottom,
        pied: getComputedStyle(document.querySelector('.site-footer > .container')).maxWidth, contact: Math.round(r('.footer__contact').left),
        photo: { l: b.left, r: b.right, t: b.top, w: b.width, h: b.height }, focal: getComputedStyle(photo.querySelector('img')).objectPosition, position: getComputedStyle(photo).position,
        ordre: ['.fiche__titre', '.fiche__faits', '.fiche__photo', '.fiche__chapitres'].map(s => r(s).top), mw: mos.getBoundingClientRect().width,
        rangs: [...document.querySelectorAll('.fiche__rang')].map(rg => { const t = [...rg.children].map(x => x.getBoundingClientRect()); return { n: t.length, h: t[0].height, largeur: t[t.length - 1].right - t[0].left, lignes: new Set(t.map(x => Math.round(x.top))).size }; }),
        figcaptions: document.querySelectorAll('figcaption').length };
    });
    ok(deb === 0 && !erreurs.length && m.chargees, `${nom} : aucun débordement horizontal (${deb} px), aucune erreur, les ${m.images} images chargées` + (erreurs.length ? ' — ' + erreurs.join(' | ') : ''));
    ok([m.titre, m.mosaique, m.voisins].every(x => Math.abs(x - m.logo) < 0.5), `${nom} : titre, mosaïque et voisins au x du logo (${Math.round(m.logo)} ; ${[m.titre, m.mosaique, m.voisins].map(Math.round).join(', ')})`);
    ok(m.pied === '1200px' && m.contact === xContact, `${nom} : pied de page sur le container de 1 200 px (${m.pied}), contact au x de la Home (${m.contact} = ${xContact})`);
    const format = Math.abs(m.photo.w / m.photo.h - F.format) < 0.01;
    if (!tel) ok(Math.abs(m.photo.r - m.cw) < 0.5 && Math.abs(m.photo.t - m.entete) < 0.5 && Math.abs(m.photo.w - F.part * m.cw) <= 1 && format && m.focal === F.focal && m.position === 'sticky',
      `${nom} : photo de tête au bord droit de la fenêtre (${Math.round(m.photo.r)}) et au bas de l'en-tête (${Math.round(m.photo.t)}), ${F.part * 100} % de la largeur (${m.photo.w.toFixed(1)} px), au format de son cadre (${(m.photo.w / m.photo.h).toFixed(3)}), point focal ${m.focal}, ${m.position}`);
    else ok(Math.abs(m.photo.l) < 0.5 && Math.abs(m.photo.w - m.cw) < 0.5 && format && m.focal === F.focal && m.position === 'relative' && m.ordre.every((y, k) => !k || y > m.ordre[k - 1]),
      `${nom} : la région et le titre, les infos, la photo pleine largeur au même format (${(m.photo.w / m.photo.h).toFixed(3)}, point focal ${m.focal}, ${m.position}), puis les chapitres`);
    const f = Math.max(1, (m.mw - 0.5) / 1120), cibles = [440 * f, 280 * f], n = m.rangs.map(rg => rg.n).join(' ');
    if (!tel) ok(n === F.rangees && m.rangs.every((rg, k) => rg.lignes === 1 && (Math.abs(rg.largeur - m.mw) <= 1 || (k === m.rangs.length - 1 && rg.largeur < m.mw && Math.abs(rg.h - cibles[k % 2]) < 0.5))),
      `${nom} : mosaïque en rangées de [${n.split(' ').join(', ')}], chacune d'une seule ligne et pleine largeur (${m.rangs.map(rg => rg.largeur.toFixed(1)).join(' / ')} sur ${m.mw.toFixed(1)} px)`);
    else ok(m.rangs.length > 0 && m.rangs.every(rg => rg.n <= 2 && rg.lignes === 1), `${nom} : mosaïque, deux photos au plus par rangée [${n.split(' ').join(', ')}]`);
    ok(m.figcaptions === 0, `${nom} : aucune figcaption`);
    await ctx.close();
  }
}
{
  // la photo qui suit, à 1521 × 705 sur Ateliers 118 (texte plus long que la photo) : quand son haut atteint le haut de la fenêtre, la photo y reste collée
  // pendant que la fin du texte monte, tant que le texte dépasse ; au-delà, tout repart ensemble — le bas de la photo reste celui du texte (± 2 px).
  // Depuis le numéro à côté du titre (06/10), le texte ne dépasse plus la photo que de 93 px (162 avant) : on la regarde au milieu de ce trajet
  // (avant, à la fin du chapitre 03 amenée au bas de la fenêtre, où la photo n'est plus collée maintenant que le texte dépasse moins)
  const { p, ctx } = await ouvrir('panneau=off', [1521, 705], {}, 'projet-ateliers-118');
  const etat = () => p.evaluate(() => { const photo = document.querySelector('.fiche__photo').getBoundingClientRect();
    return { haut: photo.top, bas: photo.bottom, texte: document.querySelector('.fiche__chapitres > .chapitre:last-child').getBoundingClientRect().bottom, titre: document.querySelector('.page__titre').getBoundingClientRect().top }; });
  const e0 = await etat(), ecart = e0.texte - e0.bas;
  await p.evaluate(y => window.scrollTo(0, y), Math.round(e0.haut + ecart / 2));
  const e1 = await etat(), suite = [];
  for (let k = 0; k < 3; k++) { await p.evaluate(() => window.scrollBy(0, 150)); suite.push(await etat()); }
  ok(ecart > 50 && Math.abs(e1.haut) < 0.5 && Math.abs(e1.texte - e1.bas - ecart / 2) < 1.5 && e1.titre < e0.titre && suite.every(e => Math.abs(e.bas - e.texte) <= 2 && e.haut < 0),
    `photo qui suit (Ateliers 118, 1521 × 705, texte plus long que la photo de ${Math.round(ecart)} px) : à mi-chemin, la photo reste collée en haut de la fenêtre (haut à ${Math.round(e1.haut)} px) et le texte continue de monter (${Math.round(e1.texte - e1.bas)} px encore sous la photo) ; au-delà, bas de la photo = bas du texte (${suite.map(e => (e.bas - e.texte).toFixed(1)).join(', ')} px)`);
  await ctx.close();
}
{
  // quand la photo est plus haute que le texte (Data Box à 1920 × 1080), rien ne bouge : photo et texte défilent ensemble
  const { p, ctx } = await ouvrir('panneau=off', [1920, 1080], {}, 'projet-data-box');
  const etat = () => p.evaluate(() => { const photo = document.querySelector('.fiche__photo').getBoundingClientRect(); return { haut: photo.top, bas: photo.bottom, texte: document.querySelector('.fiche__chapitres').getBoundingClientRect().bottom, titre: document.querySelector('.page__titre').getBoundingClientRect().top }; });
  const e0 = await etat();
  await p.evaluate(() => window.scrollTo(0, 400));
  const e1 = await etat();
  ok(e0.bas - e0.texte > 20 && Math.abs(e0.haut - e1.haut - 400) < 0.5 && Math.abs(e0.titre - e1.titre - 400) < 0.5,
    `photo plus haute que le texte (Data Box, 1920 × 1080, ${Math.round(e0.bas - e0.texte)} px de plus) : rien ne bouge, photo et texte défilent ensemble (${Math.round(e0.haut - e1.haut)} et ${Math.round(e0.titre - e1.titre)} px pour 400)`);
  await ctx.close();
}
{
  // contenu et photos (1521 × 705), fiche par fiche : titre de la page, navigation ; la région, le titre, les infos, les trois chapitres (was, saw et became de
  // data/projects.json) ; la photo de tête — la première clé de selection, <clé>.jpg et <clé>-l.jpg avec leur largeur, sans lazy, sizes corrigé du recadrage
  // cover (ratio de la photo ÷ ratio du cadre), jamais agrandie à 1× — ; la mosaïque — les clés suivantes, dans l'ordre, au ratio de leur fichier (--r),
  // <clé>-s.jpg et <clé>.jpg avec leur largeur, lazy, sans texte alternatif, un bouton qui l'agrandit, sizes = la largeur de la tuile (maquette.js) — ;
  // précédent / suivant en boucle, dans l'ordre du champ order (The Bank, Data Box, Community, Ateliers 118 : vérifiée de bout en bout après la boucle)
  const IMG = '../directions/img/';
  const boucle = {};
  for (const [i, d] of DETAILLES.entries()) {
    const F = FICHES[d.id], nom = pageDe(d), prec = DETAILLES[(i + DETAILLES.length - 1) % DETAILLES.length], suiv = DETAILLES[(i + 1) % DETAILLES.length];
    const { p, ctx } = await ouvrir('panneau=off', [1521, 705], {}, nom);   // sans parcourir() : il passe les images en loading="eager", on lit ici l'attribut d'origine
    const c = await p.evaluate(() => {
      const t = s => [...document.querySelectorAll(s)].map(e => e.textContent), img = document.querySelector('.fiche__photo img');
      return { page: document.documentElement.dataset.page, title: document.title, actif: [...document.querySelectorAll('.site-nav a.is-active')].map(a => `${a.textContent} → ${a.getAttribute('href')}`).join(' | '),
        region: t('.fiche__titre .eyebrow').join(), h1: t('h1').join(' | '), faits: t('.fiche__valeur').join(' · '), etiquettes: t('.fiche__etiquette').join(' · '),
        chapitres: [...document.querySelectorAll('.fiche__chapitres > .chapitre')].map(s => [s.querySelector('.chapitre__num').textContent, s.querySelector('.chapitre__titre').textContent, s.querySelector('.chapitre__texte').textContent]),
        tete: { src: img.getAttribute('src'), srcset: img.getAttribute('srcset'), sizes: img.getAttribute('sizes'), lazy: img.getAttribute('loading'), alt: img.getAttribute('alt'), servi: img.currentSrc.replace(/^.*\//, ''), w: img.offsetWidth, h: img.offsetHeight },
        eyebrow: t('.fiche__autres .eyebrow').join(),
        tuiles: [...document.querySelectorAll('.fiche__tuile')].map(f => { const im = f.querySelector('img'), b = f.querySelector('button');
          return { r: f.style.getPropertyValue('--r'), dr: f.dataset.r, src: im.getAttribute('src'), srcset: im.getAttribute('srcset'), sizes: im.getAttribute('sizes'), lazy: im.getAttribute('loading'), alt: im.getAttribute('alt'), w: f.getBoundingClientRect().width, grande: b.dataset.grande, bouton: `${b.type} ${b.getAttribute('aria-label')}` }; }),
        voisins: [...document.querySelectorAll('.fiche__voisin')].map(a => `${a.getAttribute('href')} : ${a.querySelector('.eyebrow').textContent} « ${a.querySelector('.suivant__nom').textContent} »`).join(' | '),
        boucle: { prec: document.querySelector('.fiche__voisin--prec').getAttribute('href'), suiv: document.querySelector('.fiche__voisin--suiv').getAttribute('href') } };
    });
    boucle[d.id] = c.boucle;
    ok(c.page === 'fiche' && c.title === `${d.name} — Perpetual` && c.actif === 'Réalisations → realisations.html', `${nom} : html data-page="${c.page}", titre « ${c.title} », « Réalisations » actif dans l'en-tête`);
    ok(c.region === F.region && c.h1 === d.name && c.faits === F.faits && c.etiquettes === 'Localisation · Surface · Usage', `${nom} : « ${c.region} » en eyebrow, « ${c.h1} », infos ${c.faits} (${c.etiquettes})`);
    ok(JSON.stringify(c.chapitres) === JSON.stringify([['01', 'Le lieu', d.was], ['02', 'Notre idée', d.saw], ['03', 'Aujourd’hui', d.became]]),
      `${nom} : trois chapitres 01 02 03, « Le lieu / Notre idée / Aujourd’hui » (06/10), textes was, saw et became de data/projects.json`);
    const [tete, ...autres] = d.selection, t1 = tailleJpeg(path.join(IMG_DIR, `${tete}.jpg`)), t2 = tailleJpeg(path.join(IMG_DIR, `${tete}-l.jpg`));
    const k = Math.max(1, (t1.width / t1.height) / F.format), part = `${F.part * 100}vw`;
    const sizes = k === 1 ? `(max-width:640px) calc(100vw), calc(${part})` : `(max-width:640px) calc((100vw) * ${k.toFixed(3)}), calc((${part}) * ${k.toFixed(3)})`;
    const servi = tailleJpeg(path.join(IMG_DIR, c.tete.servi)), echelle = Math.max(c.tete.w / servi.width, c.tete.h / servi.height);
    ok(c.tete.src === `${IMG}${tete}.jpg` && c.tete.srcset === `${IMG}${tete}.jpg ${t1.width}w, ${IMG}${tete}-l.jpg ${t2.width}w` && c.tete.sizes === sizes && c.tete.lazy === null && c.tete.alt === '' && echelle <= 1,
      `${nom} : photo de tête ${tete} (srcset ${t1.width}w / ${t2.width}w, sans lazy), sizes corrigé du recadrage (× ${k.toFixed(3)}) — ${c.tete.servi} servi à 1× pour ${c.tete.w} × ${c.tete.h}, jamais agrandi (× ${echelle.toFixed(2)})`);
    const tuiles = c.tuiles.length === autres.length && c.tuiles.every((x, j) => {
      const cle = autres[j], s = tailleJpeg(path.join(IMG_DIR, `${cle}-s.jpg`)), l = tailleJpeg(path.join(IMG_DIR, `${cle}.jpg`)), r = (l.width / l.height).toFixed(4);
      return x.src === `${IMG}${cle}-s.jpg` && x.srcset === `${IMG}${cle}-s.jpg ${s.width}w, ${IMG}${cle}.jpg ${l.width}w` && x.r === r && x.dr === r && x.lazy === 'lazy' && x.alt === ''
        && /px$/.test(x.sizes) && Math.abs(parseFloat(x.sizes) - x.w) < 0.02 && x.grande === `${IMG}${cle}.jpg` && x.bouton === `button Agrandir la photo ${j + 1} sur ${autres.length}`;
    });
    ok(c.eyebrow === 'Photos' && tuiles, `${nom} : « Photos », puis la mosaïque — les ${autres.length} autres clés de selection, dans l'ordre (${autres.join(' ')}) ; --r = ratio du fichier, srcset 800 / 1800 avec leur largeur, lazy, alt vide, sizes = largeur de la tuile, un bouton qui agrandit`);
    ok(c.voisins === `projet-${prec.id}.html : Projet précédent « ← ${prec.name} » | projet-${suiv.id}.html : Projet suivant « ${suiv.name} → »`, `${nom} : ${c.voisins.replace(' | ', ' ; ')}`);
    await ctx.close();
  }
  // la boucle de bout en bout (30/09) : The Bank → Data Box → Community → Ateliers 118 → The Bank ; The Bank a Ateliers 118 en précédent et Data Box en suivant,
  // Ateliers 118 a The Bank en suivant
  const ORDRE = ['the-bank', 'data-box', 'community', 'ateliers-118'];
  ok(DETAILLES.map(d => d.id).join(' ') === ORDRE.join(' ') && ORDRE.every((id, k) => boucle[id] && boucle[id].prec === `projet-${ORDRE[(k + 3) % 4]}.html` && boucle[id].suiv === `projet-${ORDRE[(k + 1) % 4]}.html`),
    `boucle des fiches, dans l'ordre du champ order : ${ORDRE.map(id => id + ' → ' + boucle[id].suiv.replace(/^projet-|\.html$/g, '')).join(' · ')}`);
  ok(boucle['the-bank'].prec === 'projet-ateliers-118.html' && boucle['the-bank'].suiv === 'projet-data-box.html' && boucle['ateliers-118'].suiv === 'projet-the-bank.html',
    `The Bank : Ateliers 118 en précédent (${boucle['the-bank'].prec}) et Data Box en suivant (${boucle['the-bank'].suiv}) ; Ateliers 118 : The Bank en suivant (${boucle['ateliers-118'].suiv})`);
}
{
  // styles (The Bank, 1521 × 705) : titre en serif 64 px ; infos — valeur en Instrument Sans 500, 17 px, or foncé, étiquette 13 px gris chaud dessous, filets
  // verticaux entre elles — ; chapitres (titres en sans 500, 26 px, numéros or foncé) ; voisins (filet au-dessus, serif or foncé) ; zoom au survol d'une tuile ;
  // polices ; panneau
  const { p, ctx } = await ouvrir('', [1521, 705], {}, FICHE);
  await polices(p, 'fiche');
  const s = await p.evaluate(() => {
    const c = e => getComputedStyle(e), q = s => document.querySelector(s), police = e => `${c(e).fontFamily.split(',')[0]} ${c(e).fontWeight} ${c(e).fontSize}`;
    return { h1: police(q('.page__titre')),
      faits: [...document.querySelectorAll('.fiche__fait')].map(f => { const v = f.querySelector('.fiche__valeur'), l = f.querySelector('.fiche__etiquette');
        return { v: `${police(v)} ${c(v).color}`, l: `${c(l).fontSize} ${c(l).color}`, dessous: l.getBoundingClientRect().top >= v.getBoundingClientRect().bottom - 1, filet: `${c(f).borderLeftWidth} ${c(f).borderLeftStyle} ${c(f).borderLeftColor}` }; }),
      titres: [...document.querySelectorAll('.chapitre__titre')].map(police), nums: [...document.querySelectorAll('.chapitre__num')].map(n => `${c(n).fontFamily.split(',')[0]} ${c(n).color}`),
      filet: `${c(q('.fiche__voisins')).borderTopWidth} ${c(q('.fiche__voisins')).borderTopStyle} ${c(q('.fiche__voisins')).borderTopColor}`, voisin: `${police(q('.suivant__nom'))} ${c(q('.suivant__nom')).color}`,
      droite: Math.abs(q('.fiche__voisin--suiv').getBoundingClientRect().right - q('.fiche__voisins').getBoundingClientRect().right) < 0.5 };
  });
  ok(s.h1 === 'Newsreader 400 64px', `titre en serif 64 px (${s.h1})`);
  ok(s.faits.length === 3 && s.faits.every(f => f.v === `"Instrument Sans" 500 17px ${OR_FONCE}` && f.l === `13px ${GRIS_CHAUD}` && f.dessous) && s.faits[0].filet.startsWith('0px') && s.faits.slice(1).every(f => f.filet === `1px solid ${FILET}`),
    'infos : valeur en Instrument Sans 500, 17 px, or foncé ; étiquette 13 px gris chaud dessous ; filets verticaux entre elles');
  ok(s.titres.length === 3 && s.titres.every(t => t === '"Instrument Sans" 500 26px') && s.nums.every(n => n === `"Instrument Sans" ${OR_FONCE}`), 'chapitres : titres en Instrument Sans 500, 26 px ; numéros en sans, or foncé (bascule 20 figée)');
  ok(s.filet === `1px solid ${FILET}` && s.voisin === `Newsreader 400 30px ${OR_FONCE}` && s.droite, `voisins : filet au-dessus, noms en serif 30 px or foncé, « Projet suivant » à droite`);
  await p.hover('.fiche__tuile >> nth=0');
  const zoom = await style(p, '.fiche__tuile img', 'transform');
  ok(/^matrix\(1\.035, 0, 0, 1\.035/.test(zoom) && (await style(p, '.fiche__agrandir', 'cursor')) === 'zoom-in', `mosaïque : zoom 1,035 au survol d'une tuile (${zoom.split(',')[0]}), curseur zoom-in`);
  const panneau = await p.evaluate(() => [...document.querySelectorAll('.mq__b')].map(f => f.dataset.cle + (f.classList.contains('is-inactif') ? ' (sans effet)' : '')).join(' · '));
  ok(panneau === 'graphique (sans effet)', 'panneau : ' + panneau + ' (aucune bascule sur les fiches)');
  await ctx.close();
}
{
  // la visionneuse de la vue Réalisations, sur les <clé>.jpg de la mosaïque (Community, dix photos) : ouverte sur la photo cliquée, le compteur seul, pas de
  // légende ; flèches et clavier, en boucle ; Tab reste dedans ; Échap la ferme et rend le focus à la tuile ; au clavier, Entrée sur une tuile l'ouvre ; « Fermer »
  const { p, ctx } = await ouvrir('panneau=off', [1521, 705], {}, 'projet-community');
  const autres = DETAILLES.find(x => x.id === 'community').selection.slice(1), n = autres.length;
  const vis = () => p.evaluate(() => { const v = document.querySelector('.visio'), vp = v.querySelector('.visio__piste'), img = vp.children[Math.round(vp.scrollLeft / vp.clientWidth)], a = document.activeElement;
    return { ouvert: !v.hidden && getComputedStyle(v).display !== 'none', cpt: v.querySelector('.visio__compteur').textContent, src: img ? img.getAttribute('src').replace(/^.*\//, '') : null, legende: v.querySelector('.visio__legende').innerHTML,
      label: v.getAttribute('aria-label'), fond: getComputedStyle(v).backgroundColor, fleches: [...v.querySelectorAll('.visio__fleche')].map(f => !f.hidden && getComputedStyle(f).display !== 'none').join(' '),
      focus: a.closest('.visio') ? a.textContent : (a.getAttribute('aria-label') || a.tagName) }; });
  await p.click('.fiche__tuile >> nth=0'); await p.waitForTimeout(150);
  const v1 = await vis();
  ok(v1.ouvert && v1.cpt === `1 / ${n}` && v1.src === `${autres[0]}.jpg` && v1.legende === '' && v1.fond === BLANC && v1.fleches === 'true true' && v1.focus === 'Fermer' && v1.label === 'Photos du projet',
    `visionneuse : ouverte sur la photo cliquée (« ${v1.cpt} », ${v1.src}), le compteur seul, fond blanc, flèches, focus sur « Fermer »`);
  const suite = [];
  await p.click('.visio [data-v-suiv]'); await p.waitForTimeout(150); suite.push(await vis());
  await p.click('.visio [data-v-prec]'); await p.waitForTimeout(150); suite.push(await vis());
  await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(150); suite.push(await vis());
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(150); suite.push(await vis());
  ok(suite.map(x => `${x.cpt} ${x.src}`).join(' → ') === [`2 / ${n} ${autres[1]}.jpg`, `1 / ${n} ${autres[0]}.jpg`, `${n} / ${n} ${autres[n - 1]}.jpg`, `1 / ${n} ${autres[0]}.jpg`].join(' → '),
    `visionneuse : flèches puis clavier, en boucle — ${suite.map(x => x.cpt).join(' → ')}`);
  const tab = [];
  for (let k = 0; k < 5; k++) { await p.keyboard.press('Tab'); tab.push(await p.evaluate(() => !!document.activeElement.closest('.visio'))); }
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  const v2 = await vis();
  ok(tab.every(Boolean) && !v2.ouvert && v2.focus === `Agrandir la photo 1 sur ${n}`, `visionneuse : Tab reste dedans, Échap la ferme, le focus revient à la tuile (« ${v2.focus} »)`);
  await p.locator('.fiche__agrandir').nth(2).focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  const v3 = await vis();
  await p.click('.visio [data-fermer]'); await p.waitForTimeout(100);
  const v4 = await vis();
  ok(v3.ouvert && v3.cpt === `3 / ${n}` && v3.src === `${autres[2]}.jpg` && !v4.ouvert, `visionneuse : au clavier, Entrée sur la troisième tuile l'ouvre sur « ${v3.cpt} » (${v3.src}) ; « Fermer »`);
  await ctx.close();
}
{
  // téléphone (The Bank, 390 × 844) : Φ seul ; titre 44 px ; Localisation et Surface sur une ligne, Usage dessous ; titres de chapitre 22 px ; noms des voisins 20 px
  const { p, ctx } = await ouvrir('', [390, 844], {}, FICHE);
  const m = await p.evaluate(() => { const f = [...document.querySelectorAll('.fiche__fait')].map(e => e.getBoundingClientRect()), c = s => getComputedStyle(document.querySelector(s));
    return { logo: c('.logo__texte').display, titre: c('.page__titre').fontSize, ligne: Math.abs(f[0].top - f[1].top) < 1 && f[1].left >= f[0].right - 0.5, dessous: f[2].top >= f[0].bottom && Math.abs(f[2].left - f[0].left) < 1,
      valeur: c('.fiche__valeur').fontSize, chapitre: c('.chapitre__titre').fontSize, voisin: c('.fiche__voisin .suivant__nom').fontSize }; });
  ok(m.logo === 'none' && m.titre === '44px' && m.ligne && m.dessous && m.valeur === '16px' && m.chapitre === '22px' && m.voisin === '20px',
    'téléphone : Φ seul, titre 44 px ; Localisation et Surface sur une ligne, Usage dessous (valeurs 16 px) ; titres de chapitre 22 px ; noms des voisins 20 px');
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('', [1521, 705], { javaScriptEnabled: false }, 'projet-community');
  ok((await largeur(p)) === 0 && await p.evaluate(() => !document.querySelector('.mq') && !document.querySelector('.fiche__rang') && document.querySelectorAll('.fiche__tuile').length === 10
    && getComputedStyle(document.querySelector('.fiche__mosaique')).flexWrap === 'wrap' && getComputedStyle(document.querySelector('.visio')).display === 'none'),
    'sans JavaScript : la fiche entière, la mosaïque en rangées souples (flex-wrap), visionneuse masquée, sans panneau ni débordement');
  await ctx.close();
}
// photos des fiches : un <clé>.jpg de moins de 1800 px — original plus petit (community-04, -11, -13 : 1080 px ; -14 à -16 : 1536 px) ou version tirée
// d'une vignette en attendant l'original (data-box-04 à -07) — est signalé, pas compté en échec
{
  const petites = DETAILLES.flatMap(d => d.selection).map(k => [k, tailleJpeg(path.join(IMG_DIR, `${k}.jpg`))]).filter(([, t]) => Math.max(t.width, t.height) < 1800);
  if (petites.length) console.log(`  info  ${petites.length} photos des fiches ont un <clé>.jpg de moins de 1800 px : ${petites.map(([k, t]) => `${k} (${Math.max(t.width, t.height)})`).join(', ')} — originaux plus petits, ou vignettes de la sélection en attendant les originaux (reduire-photos.mjs --petit --grand, puis rebâtir)`);
}
// citation du pied de page : espaces insécables (U+00A0) après « et avant », sur les quatre pages
for (const page of ['index', FICHE, REAL, ENG]) {
  const { p, ctx } = await ouvrir('', [1440, 900], {}, page);
  const q = await p.evaluate(() => document.querySelector('.footer__quote p').textContent);
  ok(q.startsWith('« ') && q.endsWith(' »'), `${page} : citation du pied de page, espaces insécables après « et avant »`);
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('chapitres=serif', [1440, 900], {}, FICHE);
  const t = await p.evaluate(() => [...document.querySelectorAll('.chapitre__titre')].map(t => { const s = getComputedStyle(t); return s.fontFamily.startsWith('"Instrument Sans"') && s.fontSize === '26px' && s.fontWeight === '500'; }));
  ok(t.length === 3 && t.every(Boolean) && (await style(p, '.page__titre', 'fontFamily')).startsWith('Newsreader'), 'chapitres=serif (bascule 20 retirée) : sans effet, titres de chapitre en sans ; le titre reste en serif');
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('chapitres=sans&quatre=cartes');
  ok((await p.evaluate(() => document.querySelectorAll('.chapitre').length)) === 0 && !(await p.evaluate(() => document.querySelector('.four'))), 'Home : chapitres=sans et quatre=cartes (bascule retirée) sont sans effet');
  await ctx.close();
}

console.log('\n9 · Vue Réalisations (P2 du 26/09, puis lot 2b du 04/10 : projets en 2-2-1 avec Brosse, mosaïque des agences)');
// la mosaïque, rangée par rangée (MOSAIQUE de build.mjs, choix du 04/10 : 4-3-4-3-4) ; la ville est le nom d'une agence, le lieu d'un bien de la galerie ;
// les photos, son champ selection (Bois-de-Villers et Belgrade commencent par l'intérieur ; choix d'Axel du 05/10 : Braine-l'Alleud 03, Braine-le-Comte 02
// recadrée, Gilly 02 recadrée, Tervuren 01 recadrée, Waremme 03, Anderlecht 02)
const MOSAIQUE = [
  ['cas:debut', 'bnp-braine-le-comte', 'bnp-pont-a-celles', 'bnp-jambes'],
  ['belfius-braine-l-alleud', 'ing-haaltert', 'belfius-mettet'],
  ['bnp-bois-de-villers', 'ing-tervuren', 'perwez', 'ing-welkenraedt'],
  ['wayez-27', 'ing-landen', 'waremme'],
  ['gilly', 'consolation', 'ing-belgrade', 'cas:fin'],
];
const bienAttendu = id => { const x = donnees.find(d => d.id === id); return { id, ville: x.kind === 'agency' ? x.name : x.location, surface: x.surface, usage: x.use, photos: x.selection && x.selection.length ? x.selection : [`${x.id}-01`] }; };
const TUILES = MOSAIQUE.flat().filter(x => !x.startsWith('cas:')).map(bienAttendu);
const BROSSE = donnees.find(d => d.id === 'brosse');
const realMd = fs.readFileSync(path.resolve(MAQ, '../../content/realisations.md'), 'utf8').replace(/\r\n?/g, '\n');
const paragrapheAgences = realMd.split('## Le programme agences')[1].replace(/<!--[\s\S]*?-->/g, '').trim().split(/\n\s*\n/)[0].trim();
const TRANSPARENT = 'rgba(0, 0, 0, 0)';
// la photo affichée de chaque bloc (les quatre liens, puis Brosse : la première de sa piste, hors clones de la boucle) et de chaque tuile
const BLOC_IMG = '.bloc > img, .bloc .photos__vue:not([data-clone]) .photos__une', TUILE_IMG = '.mos .photos__vue:not([data-clone]) .photos__une';
ok(donnees.filter(d => d.kind === 'agency' || d.kind === 'gallery').length === 16 && TUILES.length === 16 && new Set(TUILES.map(t => t.id)).size === 16,
  'données : les 16 biens (agency et gallery) dans la mosaïque attendue, une fois chacun');
ok(BROSSE && BROSSE.kind === 'project' && BROSSE.selection.join(' ') === 'brosse-31 brosse-16 brosse-29 brosse-27 brosse-23 brosse-61 brosse-19 brosse-22 brosse-70',
  'données : Brosse, kind project (sans fiche), ses 9 photos dans l’ordre d’Axel (31, 16, 29, 27, 23, 61, 19, 22, 70)');
const INTERIEURS = ['bnp-bois-de-villers', 'ing-belgrade'];
const PREMIERES = { 'waremme': 'waremme-03', 'wayez-27': 'wayez-27-02', 'bnp-bois-de-villers': 'bnp-bois-de-villers-01', 'ing-belgrade': 'ing-belgrade-02', 'belfius-braine-l-alleud': 'belfius-braine-l-alleud-03', 'bnp-braine-le-comte': 'bnp-braine-le-comte-02', 'gilly': 'gilly-02', 'ing-tervuren': 'ing-tervuren-01' };
ok(Object.entries(PREMIERES).every(([id, k]) => bienAttendu(id).photos[0] === k),
  'données : photo n° 1 — Bois-de-Villers et Belgrade commencent par l’intérieur ; Waremme 03, Anderlecht 02, Braine-l’Alleud 03, Braine-le-Comte 02, Gilly 02, Tervuren 01 (choix d’Axel du 05/10) : ' + Object.keys(PREMIERES).map(id => bienAttendu(id).photos[0]).join(', '));
{
  // recadrages (design/directions/src/recadrages.json, appliqués par reduire-photos.mjs) : les versions réduites ont le format du recadrage
  const rec = JSON.parse(fs.readFileSync(path.resolve(MAQ, '../directions/src/recadrages.json'), 'utf8')), cles = Object.keys(rec).filter(k => k !== '_');
  const formats = cles.map(k => { const s = tailleJpeg(path.join(IMG_DIR, `${k}-s.jpg`)), g = tailleJpeg(path.join(IMG_DIR, `${k}.jpg`)); return { k, s: s.width / s.height, g: g.width / g.height, grand: Math.max(g.width, g.height) }; });
  ok(cles.length === 3 && formats.every(f => Math.abs(f.s - f.g) < 0.01 && f.grand === 1800), `recadrages : ${formats.map(f => `${f.k} (${f.s.toFixed(2)})`).join(', ')} — 800 et 1800 px au même format`);
  const blc = tailleJpeg(path.join(IMG_DIR, 'bnp-braine-le-comte-02-s.jpg')), terv = tailleJpeg(path.join(IMG_DIR, 'ing-tervuren-01-s.jpg')), gil = tailleJpeg(path.join(IMG_DIR, 'gilly-02-s.jpg'));
  ok(Math.abs(blc.width / blc.height - 1.04) < 0.02 && [terv, gil].every(t => Math.abs(t.width / t.height - 4 / 3) < 0.01), `Braine-le-Comte 02 recadrée presque carrée (${(blc.width / blc.height).toFixed(2)}) ; Tervuren 01 et Gilly 02 gardent le 4:3 (${(terv.width / terv.height).toFixed(2)}, ${(gil.width / gil.height).toFixed(2)})`);
}
{
  // chaque fichier cité par la page existe : src et srcset, et les photos 1800 px de la visionneuse (window.BIENS), que la page ne charge qu'à l'ouverture
  const html = fs.readFileSync(path.join(MAQ, REAL + '.html'), 'utf8');
  const albums = JSON.parse(html.match(/window\.BIENS=(\[.*?\]);<\/script>/)[1]);
  const cites = new Set([...html.matchAll(/(?:src|srcset)="([^"]+)"/g)].flatMap(m => m[1].split(',').map(x => x.trim().split(' ')[0])).concat(albums.flatMap(b => b.l)).filter(u => /\.jpg$/.test(u)));
  const manquants = [...cites].filter(u => !fs.existsSync(path.resolve(MAQ, u)));
  ok(!manquants.length && albums.length === 17, `réalisations : les ${cites.size} photos citées par la page (src, srcset, visionneuse) existent ; ${albums.length} albums (16 biens et Brosse)` + (manquants.length ? ' — manquent : ' + manquants.join(', ') : ''));
  ok(!/class="(defil|vignette|bien|anciens|bloc-agences)/.test(html), 'réalisations : plus de carrousel des agences ni de projets de l’ancien site (retirés le 04/10)');
}
for (const [w, h] of [[1521, 705], [1440, 900], [1920, 1080], [390, 844]]) {
  const { p, ctx, erreurs } = await ouvrir('', [w, h], {}, REAL);
  await parcourir(p);
  await p.waitForLoadState('networkidle');
  const deb = await largeur(p);
  ok(deb === 0 && !erreurs.length, `réalisations · ${w} × ${h} : aucun débordement horizontal (${deb} px), aucune erreur` + (erreurs.length ? ' — ' + erreurs.join(' | ') : ''));
  if (w > 640) {
    const r = await p.evaluate(() => { const contenu = document.querySelector('#projets').getBoundingClientRect(), pad = parseFloat(getComputedStyle(document.querySelector('#projets')).paddingLeft);
      return { large: Math.round(contenu.width - 2 * pad), rangs: [...document.querySelectorAll('#projets .alt__rang')].map(r => { const b = [...r.children].map(c => c.getBoundingClientRect()); return { cls: r.className.replace('alt__rang alt__rang--', ''), h: Math.round(r.getBoundingClientRect().height), l: b.map(x => Math.round(x.width)), gap: b.length > 1 ? Math.round(b[1].left - b[0].right) : 14, haut: Math.round(r.getBoundingClientRect().top), bas: Math.round(r.getBoundingClientRect().bottom) }; }) }; });
    const attendu = Math.min(540, Math.max(340, h - 262)), [a, b, c] = r.rangs;
    ok(r.rangs.length === 3 && a.cls === 'a' && b.cls === 'b' && c.cls === 'seul' && r.rangs.every(x => x.h === attendu && x.gap === 14) && b.haut - a.bas === 14 && c.haut - b.bas === 14
      && Math.abs(a.l[0] / a.l[1] - 7 / 5) < 0.02 && Math.abs(b.l[1] / b.l[0] - 7 / 5) < 0.02 && c.l.length === 1 && Math.abs(c.l[0] - r.large) <= 1,
      `${w} × ${h} : projets en 2-2-1 — 7/5, 5/7, puis une rangée seule sur toute la largeur (${r.rangs.map(x => x.l.join(' / ')).join(', ')}), ${a.h} px de haut (clamp → ${attendu}), écarts de 14 px`);
    // la mosaïque : 4-3-4-3-4, toute la largeur, cases d'une rangée à la même hauteur, chaque case au format de sa photo (photo entière), écarts de 14 px
    const m = await p.evaluate(() => [...document.querySelectorAll('.mos__rang')].map(r => { const rr = r.getBoundingClientRect(), cases = [...r.children].map(c => { const b = c.getBoundingClientRect(), img = c.querySelector('.photos__vue:not([data-clone]) .photos__une');
      return { w: b.width, h: b.height, r: parseFloat(c.style.getPropertyValue('--r')), nat: img ? img.naturalWidth / img.naturalHeight : null, left: b.left, right: b.right }; });
      return { n: cases.length, w: rr.width, h: Math.round(rr.height), cases, gaps: cases.slice(1).map((c, i) => Math.round(c.left - cases[i].right)) }; }));
    const large = r.large;
    const formes = m.map(x => x.n).join('-'), memes = m.every(x => x.cases.every(c => Math.abs(c.h - x.cases[0].h) <= 1)), pleines = m.every(x => Math.abs(x.w - large) <= 1),
      entieres = m.every(x => x.cases.every(c => Math.abs(c.w / c.h - c.r) / c.r < 0.012 && (c.nat === null || Math.abs(c.nat - c.r) / c.r < 0.012))), ecarts = m.every(x => x.gaps.every(g => g === 14));
    const h4 = m.filter(x => x.n === 4).map(x => x.h), h3 = m.filter(x => x.n === 3).map(x => x.h);
    ok(formes === '4-3-4-3-4' && memes && pleines && entieres && ecarts && Math.min(...h3) > Math.max(...h4),
      `${w} × ${h} : mosaïque ${formes}, sur toute la largeur (${large} px), cases d'une rangée à la même hauteur (${m.map(x => x.h).join(' / ')} px ; les rangées de 3 plus hautes), chaque case au format de sa photo (photo entière), écarts de 14 px`);
  }
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('', [1920, 1080], {}, REAL);
  const x = await p.evaluate(() => { const l = s => Math.round(document.querySelector(s).getBoundingClientRect().left), r = s => Math.round(document.querySelector(s).getBoundingClientRect().right);
    return { logo: l('.logo'), titre: l('.page__titre'), photo: l('.bloc'), mos: l('.mos'), cas: l('.mos .cas'), nav: r('.site-nav'), photoD: r('.alt__rang--a .bloc:last-child'), seul: r('.alt__rang--seul .bloc'), mosD: r('.mos'), finD: r('.mos__rang:last-child > :last-child') }; });
  ok(x.logo === 200 && x.titre === 200 && x.photo === 200 && x.mos === 200 && x.cas === 200, `1920 : le logo, le titre, la première photo et la mosaïque (sa première case) commencent au même x (${x.logo}, ${x.titre}, ${x.photo}, ${x.mos}, ${x.cas})`);
  ok(x.nav === 1720 && x.photoD === 1720 && x.seul === 1720 && x.mosD === 1720 && Math.abs(x.finD - 1720) <= 1, `1920 : la navigation finit avec les photos, la rangée de Brosse et la mosaïque (${x.nav}, ${x.photoD}, ${x.seul}, ${x.mosD}, ${x.finD})`);
  const blocs = await photosImg(p, BLOC_IMG);
  ok(blocs.every(i => i.echelle <= 1), `blocs à 1920 × 1080, 1× : aucune photo agrandie (${blocs.map(i => `${i.cle} ${i.w}×${i.h} ← ${i.pixels} ×${i.echelle}`).join(', ')})`);
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('', [1440, 900], {}, REAL);
  await polices(p, 'réalisations');
  const t = await p.evaluate(() => { const h1 = document.querySelector('.page__titre'), s = getComputedStyle(h1), ouv = document.querySelector('.p2-ouv');
    return { title: document.title, h1: h1.textContent, ff: s.fontFamily, fw: s.fontWeight, fs: s.fontSize, ls: s.letterSpacing, lh: s.lineHeight, ouv: [...ouv.children].map(e => e.tagName).join(' '),
      ecart: Math.round(document.querySelector('#projets').getBoundingClientRect().top - h1.getBoundingClientRect().bottom),
      actif: document.querySelector('.site-nav a.is-active') && document.querySelector('.site-nav a.is-active').textContent }; });
  ok(t.title === 'Réalisations — Perpetual' && t.h1 === 'Réalisations' && t.actif === 'Réalisations', `titre « ${t.h1} », « ${t.actif} » actif dans la navigation`);
  ok(t.ff.startsWith('"Instrument Sans"') && t.fw === '400' && t.fs === '64px' && t.ls === '-1.792px' && t.lh === '65.28px', `titre en Instrument Sans 400, 64 px, interlettrage −0,028 em, interligne 1,02 (${t.ff.split(',')[0]} ${t.fw}, ${t.ls}, ${t.lh})`);
  ok(t.ouv === 'H1' && !(await p.evaluate(() => document.querySelector('.ouv__texte'))), `ouverture : le titre seul — la phrase d'ouverture est retirée (05/10, Axel) ; ${t.ecart} px du titre aux projets`);
  // les projets : les quatre à fiche, puis Brosse
  const b = await p.evaluate(() => [...document.querySelectorAll('.bloc')].map(e => { const r = e.getBoundingClientRect(), nom = e.querySelector('.bloc__nom'), tx = e.querySelector('.bloc__texte'), f = e.querySelector('.bloc__faits'), s = getComputedStyle(nom);
    return { tag: e.tagName.toLowerCase(), id: e.id, href: e.getAttribute('href'), ouvrir: e.getAttribute('data-album'), nom: nom.textContent, ff: s.fontFamily.split(',')[0], fs: s.fontSize, c: s.color, gauche: Math.round(nom.getBoundingClientRect().left - r.left), bas: Math.round(r.bottom - tx.getBoundingClientRect().bottom),
      faits: [...f.querySelectorAll('.fait__et')].map(x => x.textContent + ' ' + x.nextElementSibling.textContent).join(' · '), repos: getComputedStyle(f).opacity + ' ' + Math.round(f.getBoundingClientRect().height),
      mobile: getComputedStyle(e.querySelector('.bloc__mobile')).display }; }));
  ok(b.map(x => x.nom).join(' · ') === 'Community · Ateliers 118 · The Bank · Data Box · Brosse' && b.every(x => x.ff === 'Newsreader' && x.fs === '38px' && x.c === BLANC && x.gauche === 28 && x.bas === 24),
    `5 projets : ${b.map(x => x.nom).join(' · ')}, nom en serif blanc 38 px, en bas à gauche (28 / 24 px)`);
  ok(b.map(x => `${x.tag}#${x.id}${x.href ? ' → ' + x.href : ''}${x.ouvrir !== null ? ' ouvre ' + x.ouvrir : ''}`).join(' | ') === 'a#community → projet-community.html | a#ateliers-118 → projet-ateliers-118.html | a#the-bank → projet-the-bank.html | a#data-box → projet-data-box.html | div#brosse ouvre 0',
    'les quatre projets à fiche sont des liens vers leur fiche (ids gardés) ; Brosse, sans fiche, un album (album 0 de la visionneuse) : ' + b.map(x => `${x.tag}#${x.id}`).join(' · '));
  ok(b.map(x => x.faits).join(' | ') === 'Lieu Uccle · Surface 600 m² · Usage Co-living | Lieu Molenbeek-Saint-Jean · Surface 1 200 m² · Usage Ateliers | Lieu Liège · Surface 1 100 m² · Usage Logements & commerce | Lieu Jemelle · Surface 4 200 m² · Usage Site technique | Lieu Forest · Surface 800 m² · Projet Rafraîchissement et division d’un ancien atelier de brosses'
    && b.every(x => x.repos === '0 0' && x.mobile === 'none'), 'trois faits par projet, masqués au repos ; Brosse : Lieu, Surface, et « Projet » (intitulé du site 2020, provisoire)');
  // au survol, les faits et le zoom (photos cliquables : les cinq) ; au focus clavier, les faits — de « Contact » aux cinq blocs, puis la première tuile
  const survols = [];
  await p.evaluate(() => document.querySelector('.mq').classList.add('is-plie'));
  for (const id of ['community', 'ateliers-118', 'the-bank', 'data-box', 'brosse']) {
    await p.hover('#' + id); await p.waitForTimeout(80);
    survols.push(await p.evaluate(id => { const f = document.querySelector(`#${id} .bloc__faits`), img = document.querySelector(`#${id} > img, #${id} .photos__vue:not([data-clone]) img`); return `${id} ${getComputedStyle(f).opacity} ${f.getBoundingClientRect().height > 30} ${getComputedStyle(img).transform}`; }, id));
  }
  await p.evaluate(() => document.querySelector('.mq').classList.remove('is-plie'));
  await p.mouse.move(1, 1);
  await p.focus('.site-nav a:last-child');
  const focus = [];
  for (let k = 0; k < 9; k++) { await p.keyboard.press('Tab'); focus.push(await p.evaluate(() => { const a = document.activeElement, c = a.closest('.bloc, .tuile'), f = c && c.querySelector('.bloc__faits, .tuile__faits'), fl = c && c.querySelector('.photos__fleche');
    const quoi = a.classList.contains('photos__ouvrir') ? 'photo' : a.classList.contains('photos__fleche--g') ? '←' : a.classList.contains('photos__fleche--d') ? '→' : a.tagName.toLowerCase();
    return `${c ? c.id : a.id} ${quoi} ${a.matches(':focus-visible')} ${f ? getComputedStyle(f).opacity : '-'} ${fl ? getComputedStyle(fl).opacity : '-'}`; })); }
  ok(survols.every(x => / 1 true matrix\(1\.035, 0, 0, 1\.035/.test(x)) && focus.join(' | ') === 'community a true 1 - | ateliers-118 a true 1 - | the-bank a true 1 - | data-box a true 1 - | brosse photo true 1 1 | brosse ← true 1 1 | brosse → true 1 1 | bnp-braine-le-comte photo true 1 1 | bnp-braine-le-comte ← true 1 1',
    `au survol, les faits s'affichent et la photo zoome (1,035) sur les cinq blocs ; au clavier, les quatre liens, puis la photo et les deux flèches de Brosse et de chaque tuile, faits et flèches affichés (${focus.map(x => x.split(' ').slice(0, 2).join(' ')).join(', ')})`);
  const photos = await photosImg(p, BLOC_IMG);
  ok(photos.map(i => `${i.cle} ${i.focal}`).join(' · ') === 'community-05 50% 50% · ateliers-118-01 50% 30% · the-bank-01 50% 40% · data-box-03 50% 50% · brosse-31 50% 40%' && photos.every(i => donnees.some(x => (x.kind === 'detailed' || x.kind === 'project') && x.selection[0] === i.cle)),
    'photos des blocs (la première clé de selection de chaque projet) et points focaux : ' + photos.map(i => `${i.cle} ${i.focal}`).join(' · '));
  verifierSrcset(photos.filter(i => i.cle !== 'brosse-31'), 'blocs');
  const br = photos.find(i => i.cle === 'brosse-31');
  ok(/brosse-31-s\.jpg \d+w, [^,]*brosse-31\.jpg \d+w, [^,]*brosse-31-l\.jpg 2362w$/.test(br.srcset), `Brosse, sur toute la largeur : srcset 800w / 1800w / 2362w (la taille de l'original) — ${br.srcset.replace(/[^ ,]*\//g, '')}`);
  ok(photos.every(i => i.echelle <= 1), `blocs à 1440 × 900, 1× : aucune photo agrandie (${photos.map(i => `${i.cle} ${i.w}×${i.h} ← ${i.pixels} ×${i.echelle}`).join(', ')})`);
  ok(await p.evaluate(() => [...document.querySelectorAll('[id]')].map(e => e.id).filter((id, i, a) => a.indexOf(id) !== i).length === 0), 'aucun id en double');
  // le programme agences : la mosaïque (le focus quitte la première tuile, atteinte au clavier ci-dessus)
  await p.evaluate(() => document.activeElement.blur());
  const tu = await p.evaluate(() => [...document.querySelectorAll('.mos .tuile')].map(t => { const une = t.querySelector('.photos__vue:not([data-clone]) .photos__une'), cle = i => i.getAttribute('src').replace(/^.*\//, '').replace(/-s\.jpg$/, ''); return { id: t.id, nom: t.querySelector('.tuile__nom').textContent, label: t.querySelector('.photos__ouvrir').getAttribute('aria-label'), ouvrir: +t.getAttribute('data-album'), tag: t.tagName,
    faits: [...t.querySelectorAll('.fait__et')].map(x => x.textContent + ' ' + x.nextElementSibling.textContent).join(' · '), photo: cle(une), lazy: une.getAttribute('loading'),
    vues: [...t.querySelectorAll('.photos__vue:not([data-clone]) img')].map(cle).join(' '), n: +t.dataset.n, clones: t.querySelectorAll('.photos__vue[data-clone][aria-hidden="true"]').length, cpt: (t.querySelector('.photos__compteur') || {}).textContent || '', fl: t.querySelectorAll('.photos__fleche').length, nav: t.classList.contains('photos--nav'), nomStyle: (s => `${s.fontFamily.split(',')[0]} ${s.color}`)(getComputedStyle(t.querySelector('.tuile__nom'))), repos: getComputedStyle(t.querySelector('.tuile__faits')).opacity }; }));
  ok(tu.length === 16 && tu.map(t => t.id).join(' ') === TUILES.map(t => t.id).join(' ') && tu.every((t, i) => t.tag === 'DIV' && t.nom === TUILES[i].ville && t.faits === `Surface ${TUILES[i].surface} · Usage ${TUILES[i].usage}` && t.repos === '0' && t.nomStyle === `Newsreader ${BLANC}`),
    `mosaïque : les 16 biens dans l'ordre de MOSAIQUE (${tu.map(t => t.nom).join(' · ')}), nom en serif blanc, Surface / Usage masqués au repos`);
  ok(tu.every((t, i) => t.photo === TUILES[i].photos[0] && t.lazy === 'lazy' && t.label === `${TUILES[i].ville}, ${TUILES[i].surface}, ${TUILES[i].usage} — ${TUILES[i].photos.length} photo${TUILES[i].photos.length > 1 ? 's' : ''}` && t.ouvrir === i + 1),
    'mosaïque : chaque tuile montre la première photo de son selection, a un nom accessible (ville, surface, usage, nombre de photos) et ouvre son album');
  ok(tu.every((t, i) => { const n = TUILES[i].photos.length; return t.vues === TUILES[i].photos.join(' ') && t.n === n && t.clones === (n > 1 ? 2 * n : 0) && t.cpt === (n > 1 ? `1 / ${n}` : '') && t.fl === (n > 1 ? 2 : 0) && t.nav === n > 1; }),
    `mosaïque : chaque tuile porte toutes les photos de son selection, dans l'ordre (${tu.reduce((a, t) => a + t.n, 0)} vues) ; à plus d'une photo, « 1 / n » et deux flèches, la boucle (clones masqués aux lecteurs d'écran) ${tu.some(t => t.n === 1) ? ' ; ' + tu.filter(t => t.n === 1).map(t => t.nom).join(', ') + ' : une photo, ni compteur ni flèches' : ' ; aucune tuile d’une seule photo'}`);
  const USAGES = ['Service finance de la commune', 'Auto-école', 'École de danse et commerce de proximité', 'Quatre logements'];
  ok(donnees.filter(x => x.kind === 'agency').sort((a, b) => a.order - b.order).map(x => x.use).join(' | ') === USAGES.join(' | ') && !donnees.some(x => /Bancontact/.test(x.use || '')) && tu.every(t => !/Bancontact/.test(t.faits)),
    'usages des 4 agences sans « Point Bancontact » (data/projects.json et page) : ' + USAGES.join(' · '));
  const rangs = MOSAIQUE.map(r => r.filter(x => !x.startsWith('cas:')));
  const rangDe = id => rangs.findIndex(r => r.includes(id));
  ok(INTERIEURS.every((a, i) => INTERIEURS.every((b, j) => i === j || Math.abs(rangDe(a) - rangDe(b)) >= 2)), `les deux intérieurs en photo n° 1 ne se touchent pas (${INTERIEURS.map(id => `${id} : rangée ${rangDe(id) + 1}`).join(' ; ')})`);
  const cs = await p.evaluate(() => [...document.querySelectorAll('.mos .cas')].map(c => { const i = c.querySelector('.cas__in'), r = c.getBoundingClientRect(), rang = c.parentElement, cases = [...rang.children];
    return { cls: c.className, eyebrow: (c.querySelector('.eyebrow') || {}).textContent || '', h2: c.querySelector('h2') ? c.querySelector('h2').textContent : '', p: c.querySelector('.cas__phrase') ? c.querySelector('.cas__phrase').textContent : '',
      fond: getComputedStyle(c).backgroundColor, rogne: i.scrollHeight > i.clientHeight + 1, place: `${[...document.querySelectorAll('.mos__rang')].indexOf(rang) + 1}.${cases.indexOf(c) + 1}`, ff: getComputedStyle(c.querySelector('h2, .cas__phrase')).fontFamily.split(',')[0].replace(/"/g, ''), ta: getComputedStyle(c.querySelector('h2, .cas__phrase')).textAlign }; }));
  ok(cs.length === 2 && cs[0].place === '1.1' && cs[1].place === '5.4' && cs[0].eyebrow === '' && !(await p.evaluate(() => document.querySelector('.mos').textContent.includes('Programme agences'))) && `${cs[0].h2} ${cs[1].p}` === paragrapheAgences && cs.every(c => c.fond === PAPIER && !c.rogne && c.ff === 'Instrument Sans') && cs[0].ta === 'start' && cs[1].ta === 'right',
    `deux cases de texte sur papier, en sans (05/10, Axel), la seconde alignée à droite, jamais rognées, sans le titre « Programme agences » (retiré le 05/10, Julien ne l'aimait pas) : la première phrase de l'énoncé (h2) en haut à gauche (${cs[0].place}), la seconde en bas à droite (${cs[1] && cs[1].place})`);
  // survol d'une tuile : faits, zoom, dégradé renforcé
  await p.evaluate(() => document.querySelector('.mq').classList.add('is-plie'));
  const st = [];
  for (const id of ['bnp-braine-le-comte', 'ing-haaltert', 'consolation']) {
    await p.hover('#' + id); await p.waitForTimeout(400);
    st.push(await p.evaluate(id => { const t = document.getElementById(id), f = t.querySelector('.tuile__faits'); return `${getComputedStyle(f).opacity} ${f.scrollHeight <= f.clientHeight + 1} ${getComputedStyle(t.querySelector('.photos__vue:not([data-clone]) img')).transform} ${getComputedStyle(t.querySelector('.photos__fleche')).opacity}`; }, id));
  }
  ok(st.every(x => /^1 true matrix\(1\.035, 0, 0, 1\.035.* 1$/.test(x)), 'tuiles : au survol, Surface et Usage s’affichent en entier, la photo zoome (1,035), comme les blocs des projets, et les flèches paraissent — ' + st.map(x => x.split(' ').slice(0, 2).join(' ')).join(' · '));
  await ctx.close();
}
{
  // la visionneuse : Brosse, un bien à plusieurs photos, Belgrade (l'intérieur d'abord), un bien à une photo
  const { p, ctx } = await ouvrir('panneau=off', [1440, 900], {}, REAL);
  const vis = () => p.evaluate(() => { const v = document.querySelector('.visio'), vp = v.querySelector('.visio__piste'), img = vp.children[Math.round(vp.scrollLeft / vp.clientWidth)], cadre = v.querySelector('.visio__cadre').getBoundingClientRect();
    return { ouvert: !v.hidden && getComputedStyle(v).display !== 'none', cpt: v.querySelector('.visio__compteur').textContent, src: img ? img.getAttribute('src').replace(/^.*\//, '') : null, legende: v.querySelector('.visio__legende').innerHTML,
      focus: document.activeElement && document.activeElement.textContent, corps: document.body.classList.contains('visio-ouverte'), fit: img && getComputedStyle(img).objectFit, ratio: cadre.width / cadre.height, fond: getComputedStyle(v).backgroundColor,
      fleches: [...v.querySelectorAll('.visio__fleche')].map(f => !f.hidden && getComputedStyle(f).display !== 'none').join(' '), retour: document.activeElement && ((document.activeElement.closest('[id]') || {}).id + ' ' + document.activeElement.className) }; });
  await p.click('#brosse'); await p.waitForTimeout(150);
  const v1 = await vis();
  ok(v1.ouvert && v1.cpt === '1 / 9' && v1.src === 'brosse-31.jpg' && v1.legende === '<b>Brosse</b>Forest · 800 m²' && v1.focus === 'Fermer' && v1.corps && v1.fond === BLANC && v1.fit === 'contain' && Math.abs(v1.ratio - 4 / 3) < 0.01 && v1.fleches === 'true true',
    `Brosse ouvre la visionneuse : ${v1.cpt}, ${v1.src}, « ${v1.legende.replace(/<\/?b>/g, '|')} » ; fond blanc, photo entière dans un cadre 4:3, focus sur « Fermer »`);
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(150); const v2 = await vis();
  const tab = [];
  for (let i = 0; i < 6; i++) { await p.keyboard.press(i < 4 ? 'Tab' : 'Shift+Tab'); tab.push(await p.evaluate(() => document.activeElement.closest('.visio') ? (document.activeElement.textContent || document.activeElement.className) : 'HORS : ' + document.activeElement.className)); }
  await p.keyboard.press('Escape'); await p.waitForTimeout(100); const v3 = await vis();
  ok(v2.cpt === '2 / 9' && v2.src === 'brosse-16.jpg' && tab.every(t => !t.startsWith('HORS')) && !v3.ouvert && !v3.corps && v3.retour === 'brosse photos__ouvrir',
    `visionneuse : → ${v2.cpt} (${v2.src}) ; Tab et Maj+Tab restent dedans ; Échap la ferme et rend le focus à la photo de Brosse`);
  await p.click('#bnp-braine-le-comte'); await p.waitForTimeout(150); const v4 = await vis();
  await p.click('.visio [data-v-suiv]'); await p.waitForTimeout(150); const v5 = await vis();
  await p.click('.visio [data-fermer]'); await p.waitForTimeout(100);
  ok(v4.ouvert && v4.cpt === '1 / 2' && v4.src === 'bnp-braine-le-comte-02.jpg' && v4.legende === '<b>Braine-le-Comte</b>600 m² · Service finance de la commune' && v5.cpt === '2 / 2' && v5.src === 'bnp-braine-le-comte-03.jpg' && !(await vis()).ouvert,
    `tuile Braine-le-Comte : « ${v4.legende.replace(/<\/?b>/g, '|')} », ${v4.cpt} → ${v5.cpt} à la flèche, « Fermer »`);
  await p.click('#ing-belgrade'); await p.waitForTimeout(150); const v6 = await vis();
  await p.keyboard.press('Escape');
  ok(v6.src === 'ing-belgrade-02.jpg' && v6.cpt === '1 / 2', `Belgrade s'ouvre sur l'intérieur (${v6.src})`);
  // un bien d'une seule photo (Gilly jusqu'au 05/10) : ni compteur ni flèches dans la visionneuse
  const seul = TUILES.find(t => t.photos.length === 1);
  if (seul) {
    await p.click('#' + seul.id); await p.waitForTimeout(150); const v7 = await vis();
    await p.keyboard.press('Escape');
    ok(v7.ouvert && v7.cpt === '' && v7.fleches === 'false false', `${seul.ville}, une seule photo : ni compteur ni flèches dans la visionneuse`);
  } else console.log('  info  plus aucun bien d\'une seule photo dans la mosaïque (Gilly en a deux depuis le 05/10) : la visionneuse sans compteur ni flèches n\'est pas vérifiée ici');
  await ctx.close();
}
{
  // les photos se parcourent sur place (rétabli le 05/10) : flèches en boucle, « 1 / n », clavier ; un clic sur la photo ouvre la visionneuse sur la photo
  // affichée ; la souris partie, flèches et faits se retirent même si une flèche cliquée garde le focus
  const { p, ctx } = await ouvrir('panneau=off', [1440, 900], {}, REAL);
  const etat = id => p.evaluate(id => { const t = document.getElementById(id), pi = t.querySelector('.photos'), c = pi.children, pas = c[1] ? c[1].getBoundingClientRect().left - c[0].getBoundingClientRect().left : pi.clientWidth, vue = c[Math.round(pi.scrollLeft / pas)];
    return `${(t.querySelector('.photos__compteur') || {}).textContent || '-'} ${vue.querySelector('img').getAttribute('src').replace(/^.*\//, '').replace(/-s\.jpg$/, '')}${vue.hasAttribute('data-clone') ? ' (clone)' : ''}`; }, id);
  const fleche = async (id, sens) => { await p.click(`#${id} .photos__fleche--${sens}`); await p.waitForTimeout(120); return etat(id); };
  await p.locator('#bnp-braine-le-comte').scrollIntoViewIfNeeded(); await p.hover('#bnp-braine-le-comte');
  const bl = [await etat('bnp-braine-le-comte'), await fleche('bnp-braine-le-comte', 'd'), await fleche('bnp-braine-le-comte', 'd'), await fleche('bnp-braine-le-comte', 'g')];
  ok(bl.join(' → ') === '1 / 2 bnp-braine-le-comte-02 → 2 / 2 bnp-braine-le-comte-03 → 1 / 2 bnp-braine-le-comte-02 → 2 / 2 bnp-braine-le-comte-03', `Braine-le-Comte, aux flèches, en boucle : ${bl.join(' → ')}`);
  await p.click('#bnp-braine-le-comte .photos__ouvrir', { position: { x: 120, y: 80 } }); await p.waitForTimeout(150);
  const v = await p.evaluate(() => { const v = document.querySelector('.visio'), vp = v.querySelector('.visio__piste'); return `${!v.hidden} ${v.querySelector('.visio__compteur').textContent} ${vp.children[Math.round(vp.scrollLeft / vp.clientWidth)].getAttribute('src').replace(/^.*\//, '')}`; });
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  ok(v === 'true 2 / 2 bnp-braine-le-comte-03.jpg', `un clic sur la photo affichée ouvre la visionneuse sur elle (${v})`);
  await p.locator('#brosse').scrollIntoViewIfNeeded(); await p.hover('#brosse');
  const br = [await etat('brosse'), await fleche('brosse', 'g'), await fleche('brosse', 'd'), await fleche('brosse', 'd')];
  await p.focus('#brosse .photos__fleche--d'); await p.keyboard.press('Enter'); await p.waitForTimeout(120); br.push(await etat('brosse'));
  ok(br.join(' → ') === '1 / 9 brosse-31 → 9 / 9 brosse-70 → 1 / 9 brosse-31 → 2 / 9 brosse-16 → 3 / 9 brosse-29', `Brosse : ← depuis la première mène à la dernière, puis → à la souris et au clavier : ${br.join(' → ')}`);
  await p.locator('#bnp-jambes').scrollIntoViewIfNeeded(); await p.click('#bnp-jambes .photos__fleche--d'); await p.mouse.move(1, 1); await p.waitForTimeout(450);
  const apres = await p.evaluate(() => { const t = document.getElementById('bnp-jambes'); return `${document.activeElement.className} ${getComputedStyle(t.querySelector('.photos__fleche')).opacity} ${getComputedStyle(t.querySelector('.tuile__faits')).opacity}`; });
  ok(apres === 'photos__fleche photos__fleche--d 0 0', `la souris partie, une flèche cliquée garde le focus mais flèches et faits se retirent (${apres})`);
  await ctx.close();
}
{
  // photos des blocs, cadre variable (largeur et hauteur suivent la fenêtre) : à 1×, le plus petit fichier suffisant est servi — jamais agrandi, jamais trop lourd ;
  // photos des tuiles : à 1×, le 800 px suffit partout (la plus grande case fait ~500 px de large)
  const ecarts = [];
  for (const [w, h] of [[641, 800], [800, 800], [1024, 768], [1280, 800], [1366, 703], [1440, 900], [1521, 705], [1920, 1080]]) {
    const { p, ctx } = await ouvrir('panneau=off', [w, h], {}, REAL);
    for (const i of await photosImg(p, BLOC_IMG)) {
      const petit = tailleJpeg(path.join(IMG_DIR, `${i.cle}-s.jpg`)), besoin = Math.max(i.w, i.h * petit.width / petit.height);
      const attendu = petit.width >= besoin ? `${i.cle}-s.jpg` : `${i.cle}.jpg`;
      if (i.servi !== attendu) ecarts.push(`${w}×${h} ${i.cle} : ${i.servi} au lieu de ${attendu} (besoin ${Math.round(besoin)} px)`);
    }
    for (const i of await photosImg(p, TUILE_IMG)) {
      const petit = tailleJpeg(path.join(IMG_DIR, `${i.cle}-s.jpg`)), attendu = petit.width >= i.w - 1 ? `${i.cle}-s.jpg` : `${i.cle}.jpg`;
      if (i.servi !== attendu || i.echelle > 1.01) ecarts.push(`${w}×${h} tuile ${i.cle} : ${i.servi} (${i.w} px, attendu ${attendu}, ×${i.echelle})`);
    }
    await ctx.close();
  }
  ok(!ecarts.length, 'blocs et tuiles, 641 à 1920 px, 1× : le sizes suit le cadre, le plus petit fichier suffisant est servi, aucune photo agrandie' + (ecarts.length ? ' — ' + ecarts.join(' ; ') : ''));
}
{
  // bascules 22 et 23 retirées : leurs paramètres restés dans une URL sont sans effet ; le panneau n'a plus de bascule pour cette page
  const { p, ctx } = await ouvrir('papier=tout&bas=anciens', [1440, 900], {}, REAL);
  const r = await p.evaluate(() => ({ anciens: !!document.querySelector('.anciens, .bloc-agences'), fond: getComputedStyle(document.querySelector('.mos-section')).backgroundColor,
    panneau: [...document.querySelectorAll('.mq__b')].map(f => f.dataset.cle + (f.classList.contains('is-inactif') ? ' (sans effet)' : '')).join(' · ') }));
  ok(!r.anciens && r.fond === TRANSPARENT && r.panneau === 'graphique (sans effet)', `?papier=tout&bas=anciens (bascules 22 et 23 retirées le 04/10) : sans effet ; panneau : ${r.panneau}`);
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('', [390, 844], {}, REAL);
  await parcourir(p);
  const m = await p.evaluate(() => ({
    blocs: [...document.querySelectorAll('.bloc')].map(b => { const r = b.getBoundingClientRect(), mob = b.querySelector('.bloc__mobile'); return { w: Math.round(r.width), ratio: r.width / r.height, nom: getComputedStyle(b.querySelector('.bloc__nom')).fontSize, faits: getComputedStyle(b.querySelector('.bloc__faits')).display, mobile: getComputedStyle(mob).display + ' ' + mob.textContent }; }),
    cols: [...document.querySelectorAll('.alt__rang')].map(r => getComputedStyle(r).gridTemplateColumns.split(' ').length),
    mosCols: getComputedStyle(document.querySelector('.mos')).gridTemplateColumns.split(' ').length,
    tuiles: [...document.querySelectorAll('.mos .tuile')].map(t => { const r = t.getBoundingClientRect(); return { x: Math.round(r.left), ratio: r.width / r.height, mob: getComputedStyle(t.querySelector('.tuile__mobile')).display + ' ' + t.querySelector('.tuile__mobile').textContent, faits: getComputedStyle(t.querySelector('.tuile__faits')).display, nom: getComputedStyle(t.querySelector('.tuile__nom')).fontSize }; }),
    cas: [...document.querySelectorAll('.mos .cas')].map(c => Math.round(c.getBoundingClientRect().width)), casTa: [...document.querySelectorAll('.cas__enonce, .cas__phrase')].map(e => getComputedStyle(e).textAlign).join(' '), large: Math.round(document.querySelector('.mos').getBoundingClientRect().width),
    titre: getComputedStyle(document.querySelector('.page__titre')).fontSize, fleches: getComputedStyle(document.querySelector('.visio__fleche')).display }));
  ok(m.cols.every(c => c === 1) && m.blocs.length === 5 && m.blocs.every(b => b.w === 350 && Math.abs(b.ratio - 4 / 3) < 0.01 && b.nom === '28px' && b.faits === 'none')
    && m.blocs.map(b => b.mobile).join(' | ') === 'block Uccle · 600 m² | block Molenbeek-Saint-Jean · 1 200 m² | block Liège · 1 100 m² | block Jemelle · 4 200 m² | block Forest · 800 m²', 'mobile : un projet par ligne en 4:3 (Brosse compris), nom 28 px, « Lieu · surface » dessous, faits masqués');
  const gauche = m.tuiles.filter(t => t.x === 20).length, droite = m.tuiles.length - gauche;
  ok(m.mosCols === 2 && gauche === 8 && droite === 8 && m.tuiles.every(t => Math.abs(t.ratio - 0.8) < 0.01 && t.faits === 'none' && t.nom === '19px' && /^block \d/.test(t.mob)) && m.cas.every(w => w === m.large) && m.casTa === 'start left',
    `mobile : la mosaïque en deux colonnes de tuiles 4:5 (${gauche} + ${droite}, sans trou), nom 19 px et surface dessous ; les cases de texte sur toute la largeur, alignées à gauche (${m.casTa})`);
  ok(m.titre === '44px' && m.fleches === 'none', 'mobile : titre 44 px, visionneuse sans flèches');
  const glisse = await p.evaluate(async () => { const t = document.getElementById('bnp-jambes'), pi = t.querySelector('.photos'), r = [];
    t.scrollIntoView(); for (let k = 0; k < 2; k++) { pi.scrollBy({ left: pi.clientWidth }); await new Promise(f => setTimeout(f, 500)); r.push(t.querySelector('.photos__compteur').textContent); } return r.join(' → '); });
  ok(glisse === '2 / 2 → 1 / 2', `mobile : la tuile se fait glisser, le compteur suit, en boucle (Jambes : ${glisse})`);
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('', [1440, 900], { javaScriptEnabled: false }, REAL);
  ok(await p.evaluate(() => !document.querySelector('.mq') && document.querySelectorAll('.bloc').length === 5 && document.querySelectorAll('.mos .tuile').length === 16 && getComputedStyle(document.querySelector('.visio')).display === 'none'
    && getComputedStyle(document.querySelector('.mos')).display === 'flex'), 'sans JavaScript : les 5 projets et la mosaïque des 16 (visionneuse masquée), sans panneau');
  ok(await p.evaluate(() => !document.querySelector('[data-clone], .photos--nav') && [...document.querySelectorAll('.photos__compteur, .photos__fleche')].every(e => getComputedStyle(e).display === 'none')
    && [...document.querySelectorAll('[data-album]:not([data-n="1"]) .photos')].every(pi => pi.scrollWidth > pi.clientWidth + 10 && getComputedStyle(pi).overflowX === 'auto')),
    'sans JavaScript : ni compteur ni flèches, la piste de chaque album se fait glisser (sans boucle)');
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('', [1440, 900], { deviceScaleFactor: 2 }, REAL);
  const blocs2 = await photosImg(p, BLOC_IMG), tuiles2 = await photosImg(p, TUILE_IMG);
  ok(blocs2.every(i => i.servi === (i.cle === 'brosse-31' ? 'brosse-31-l.jpg' : `${i.cle}.jpg`)), `blocs à 1440 × 2 : le 1800 px est servi, et le 2 362 px pour Brosse sur toute la largeur (${blocs2.map(i => i.servi).join(', ')})`);
  ok(tuiles2.every(i => i.servi === `${i.cle}.jpg` || (i.servi === `${i.cle}-s.jpg` && 2 * i.w <= tailleJpeg(path.join(IMG_DIR, i.servi)).width)), `tuiles à 1440 × 2 : le fichier assez grand pour l'écran haute densité est servi (${tuiles2.filter(i => /-s\.jpg$/.test(i.servi)).length} en 800 px, ${tuiles2.filter(i => !/-s\.jpg$/.test(i.servi)).length} en 1800 px)`);
  await ctx.close();
}
// photos des biens et de Brosse : un <clé>.jpg de moins de 1800 px est signalé, pas compté en échec
{
  const petites = [...TUILES.flatMap(b => b.photos), ...BROSSE.selection].filter(k => { const t = tailleJpeg(path.join(IMG_DIR, `${k}.jpg`)); return Math.max(t.width, t.height) < 1800; });
  if (petites.length) console.log(`  info  ${petites.length} vues des biens n'ont pas encore leur 1800 px (plus grand côté < 1800) — reduire-photos.mjs --petit --grand <originaux>, puis rebâtir`);
}

console.log('\n10 · Page Engagements (Cowork, 26/09)');
const ALT_OEUVRE = 'Peinture d’Ines Reddah, 2024 : deux grands visages ronds cernés de bleu et de rose, entourés de traits verticaux de couleur.';
{
  // l'œuvre : le fichier de la référence, copié tel quel dans design/directions/img/ (pas recompressé), 870 × 1132
  const fichier = 'ines-reddah-2024-recadree.jpg', copie = path.join(IMG_DIR, fichier), source = path.resolve(MAQ, '../revue-engagements/propositions/img', fichier);
  const t = fs.existsSync(copie) ? tailleJpeg(copie) : {};
  ok(fs.existsSync(copie) && fs.readFileSync(copie).equals(fs.readFileSync(source)) && t.width === 870 && t.height === 1132, `œuvre : design/directions/img/${fichier} (${t.width} × ${t.height}), identique au fichier de la référence, pas recompressé`);
}
// aux quatre formats : ni erreur ni débordement ; le titre au x du texte de la Home (container de 1 200 px), sans sous-titre ; les trois rangées ; l'œuvre
// entière sur sa cimaise, dans la colonne de gauche de #soutenir ; 72 px du bas de la dernière rangée au haut du pied de page (44 au téléphone) ; ordre Soutenir, Aider, Transmettre depuis le 30/09
for (const [w, h] of [[1521, 705], [1440, 900], [1920, 1080], [390, 844]]) {
  const home = await ouvrir('', [w, h]);
  const xHome = await home.p.evaluate(() => Math.round(document.querySelector('.hero__text > p').getBoundingClientRect().left));
  await home.ctx.close();
  const { p, ctx, erreurs } = await ouvrir('', [w, h], {}, ENG);
  await parcourir(p);
  await p.waitForLoadState('networkidle');
  const deb = await largeur(p), tel = w <= 640, nom = `engagements · ${w} × ${h}`;
  ok(deb === 0 && !erreurs.length, `${nom} : aucun débordement horizontal (${deb} px), aucune erreur` + (erreurs.length ? ' — ' + erreurs.join(' | ') : ''));
  const m = await p.evaluate(() => {
    const r = e => e.getBoundingClientRect(), img = document.querySelector('.oeuvre img'), cim = document.querySelector('.cimaise'), s = getComputedStyle(cim);
    const soutenir = document.querySelector('#soutenir'), verbe = soutenir.querySelector('.rang__verbe'), texte = soutenir.querySelector('.eng-texte');
    return { titre: Math.round(r(document.querySelector('.page__titre')).left), sousTitre: !!document.querySelector('.ouv__texte'),
      rangs: [...document.querySelectorAll('.registre > section.rang')].map(x => x.id).join(' '), verbes: [...document.querySelectorAll('.rang__verbe')].map(v => v.tagName + ' ' + getComputedStyle(v).fontFamily.split(',')[0]),
      oeuvres: document.querySelectorAll('.oeuvre').length, dans: !!img.closest('#soutenir .rang__g > .cimaise > figure.oeuvre'), lien: !!img.closest('a'), fit: getComputedStyle(img).objectFit,
      iw: r(img).width, ih: r(img).height, nw: img.naturalWidth, nh: img.naturalHeight, il: r(img).left, ir: r(img).right,
      cl: r(cim).left, cr: r(cim).right, cw: r(cim).width, ct: r(cim).top, cb: r(cim).bottom, pad: [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft].join(' '), fond: s.backgroundColor,
      col: r(soutenir.querySelector('.rang__g')).width, rl: r(soutenir).left, verbeBas: r(verbe).bottom, texteHaut: r(texte).top, texteBas: r(texte).bottom, texteP: r(texte.querySelector('p')).top,
      pied: r(document.querySelector('.site-footer')).top, dernier: Math.max(...[...document.querySelectorAll('.registre > section.rang:last-child *')].map(r).filter(b => b.height > 0).map(b => b.bottom)) };
  });
  ok(m.titre === xHome && !m.sousTitre, `${nom} : « Engagements » au même x que le texte de la Home (${m.titre} = ${xHome}), sans sous-titre (.ouv__texte absent)`);
  ok(m.rangs === 'soutenir aider transmettre' && m.verbes.length === 3 && m.verbes.every(v => v === 'H2 Newsreader'), `${nom} : trois rangées (${m.rangs}), verbes en h2 Newsreader`);
  ok(m.oeuvres === 1 && m.dans && !m.lien && m.fit === 'fill' && m.nw >= 2 * m.iw && Math.abs(m.iw / m.ih - m.nw / m.nh) < 0.01 && (tel || m.iw <= 340),
    `${nom} : l'œuvre dans la cimaise de #soutenir, entière — ${Math.round(m.iw)} × ${Math.round(m.ih)} px affichés, fichier ${m.nw} × ${m.nh} (≥ 2 ×), object-fit ${m.fit} —, ${tel ? 'pleine largeur du panneau' : '340 px au plus'}, pas un lien`);
  if (!tel) ok(Math.round(m.cw) === Math.round(m.col) && Math.round(m.cl) === Math.round(m.rl) && Math.round(m.ct - m.verbeBas) === 32 && m.pad === '44px 48px 36px 48px' && m.fond === PAPIER && Math.abs((m.il - m.cl) - (m.cr - m.ir)) <= 1,
    `${nom} : cimaise papier dans la colonne de gauche (${Math.round(m.cw)} px), 32 px sous le verbe, padding 44 / 48 / 36, l'œuvre centrée`);
  else ok(Math.round(m.cl) === 20 && Math.round(m.cr) === w - 20 && Math.round(m.iw) === Math.round(m.cw) - 48 && m.pad === '28px 24px 22px 24px' && m.fond === PAPIER && m.verbeBas <= m.texteHaut + 1 && Math.round(m.texteP - m.verbeBas) === 14 && Math.round(m.ct - m.texteBas) === 28,
    `${nom} : une colonne — le verbe, le texte (14 px dessous), puis l'œuvre (28 px au-dessus) ; cimaise dans les gouttières (${Math.round(m.cl)}–${Math.round(m.cr)}), padding 28 / 24 / 22, l'œuvre sur toute la largeur du panneau (${Math.round(m.iw)} px)`);
  const fin = Math.round(m.pied - m.dernier);
  ok(fin === (tel ? 44 : 72), `${nom} : bas de la dernière rangée (${m.rangs.split(' ').pop()}) → haut du pied de page, ${fin} px (${tel ? 44 : 72} attendus)`);
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('', [1440, 900], {}, ENG);
  await polices(p, 'engagements');
  const t = await p.evaluate(() => { const h1 = document.querySelector('.page__titre'), s = getComputedStyle(h1), tete = getComputedStyle(h1.parentElement);
    return { page: document.documentElement.dataset.page, title: document.title, h1: h1.textContent, ff: s.fontFamily, fw: s.fontWeight, fs: s.fontSize, ls: s.letterSpacing, lh: s.lineHeight,
      pad: tete.paddingTop + ' / ' + tete.paddingBottom, registre: getComputedStyle(document.querySelector('.registre')).paddingTop }; });
  ok(t.page === 'engagements' && t.title === 'Engagements — Perpetual' && t.h1 === 'Engagements', `html data-page="${t.page}", titre « ${t.title} », h1 « ${t.h1} » seul`);
  ok(t.ff.startsWith('"Instrument Sans"') && t.fw === '400' && t.fs === '64px' && t.ls === '-1.792px' && t.lh === '65.28px' && t.pad === '32px / 30px' && t.registre === '12px',
    `titre en Instrument Sans 400, 64 px, interlettrage −0,028 em, interligne 1,02, comme Réalisations (${t.ls}, ${t.lh}) ; ouverture ${t.pad}, registre ${t.registre} dessous`);
  // le registre : grille 5 / 7, écart 64 px, filet en haut, padding 30 / 52 (72 en bas de la dernière rangée) ; verbe en serif 42 px ; texte 17 px, 62ch, 16 px entre paragraphes
  const g = await p.evaluate(() => {
    // 62ch dans la police du paragraphe : une boîte de cette largeur, posée dans le premier paragraphe (une suite de 62 « 0 » rendue ne mesure pas 62ch)
    const boite = document.createElement('div'); boite.style.cssText = 'position:absolute;visibility:hidden;width:62ch'; document.querySelector('.eng-texte p').appendChild(boite);
    const ch62 = boite.getBoundingClientRect().width; boite.remove();
    return { ch62, rangs: [...document.querySelectorAll('.rang')].map(x => { const s = getComputedStyle(x), v = getComputedStyle(x.querySelector('.rang__verbe')), tx = x.querySelector('.eng-texte'), ps = [...tx.querySelectorAll('p')];
      return { cols: s.gridTemplateColumns, gap: s.columnGap, filet: `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`, pad: s.paddingTop + ' ' + s.paddingBottom,
        verbe: [x.querySelector('.rang__verbe').textContent, v.fontWeight, v.fontSize, v.lineHeight, v.letterSpacing].join(' '), texte: getComputedStyle(tx).paddingTop + ' ' + [...new Set(ps.map(q => getComputedStyle(q).fontSize))].join(','),
        marges: ps.map(q => getComputedStyle(q).marginBottom).join(','), mw: ps.map(q => parseFloat(getComputedStyle(q).maxWidth)) }; }) };
  });
  const rg = g.rangs;
  ok(rg.length === 3 && rg.every(x => x.cols === '440px 616px' && x.gap === '64px' && x.filet === `1px solid ${FILET}`) && rg.map(x => x.pad).join(' · ') === '30px 52px · 30px 52px · 30px 72px',
    `rangées : grille 5 / 7 (${rg[0].cols}), écart ${rg[0].gap}, filet en haut, padding ${rg.map(x => x.pad.replace(' ', ' / ')).join(' · ')}`);
  ok(rg.map(x => x.verbe).join(' · ') === 'Soutenir 400 42px 44.1px -0.42px · Aider 400 42px 44.1px -0.42px · Transmettre 400 42px 44.1px -0.42px', `verbes : serif 400, 42 px, interligne 1,05, interlettrage −0,01 em — ${rg.map(x => x.verbe.split(' ')[0]).join(' · ')}`);
  ok(rg.every(x => x.texte === '9px 17px' && x.marges.split(',').every((mb, i, a) => mb === (i === a.length - 1 ? '0px' : '16px')) && x.mw.every(v => Math.abs(v - g.ch62) < 0.5)) && await pretty(p, '.eng-texte p'),
    `texte : 9 px au-dessus, 17 px, 62ch (${Math.round(g.ch62)} px), 16 px entre paragraphes, text-wrap: pretty`);
  // liens dans le texte
  const l = await p.evaluate(() => { const a = [...document.querySelectorAll('.eng-texte a')], s = getComputedStyle(a[0]), masque = document.querySelector('.lien-texte .visuellement-masque'), mr = masque.getBoundingClientRect();
    return { liens: a.map(x => `${x.className} ${x.firstChild.textContent} → ${x.getAttribute('href')}${x.target ? ' ' + x.target : ''}${x.rel ? ' ' + x.rel : ''}`).join(' | '), masque: `${masque.textContent} ${Math.round(mr.width)}×${Math.round(mr.height)}`,
      contact: document.getElementById('contact') ? document.getElementById('contact').tagName : null, couleur: s.color, filet: s.borderBottom }; });
  ok(l.liens === 'lien-texte Créahmbxl → https://creahmbxl.be _blank noopener | lien-texte Écrivez-nous → #contact' && l.contact === 'FOOTER' && l.masque === ' (nouvel onglet) 1×1',
    `liens : ${l.liens.replace(/lien-texte /g, '')} ; #contact est le pied de page ; « (nouvel onglet) » masqué visuellement`);
  await p.hover('.eng-texte a[href^="https"]');
  const survol = await style(p, '.eng-texte a[href^="https"]', 'borderBottomColor');
  await p.focus('.site-nav a:last-child');
  await p.keyboard.press('Tab');
  const focus = await p.evaluate(() => { const a = document.activeElement; return a.textContent + ' ' + a.matches(':focus-visible') + ' ' + getComputedStyle(a).borderBottomColor; });
  ok(l.couleur === ANTHRACITE && l.filet === `1px solid ${OR_CLAIR}` && survol === OR && focus === `Créahmbxl (nouvel onglet) true ${OR}`, `.lien-texte : anthracite, filet or clair (${l.filet}) ; or au survol (${survol}) et au focus clavier (${focus.split(' ').slice(1).join(' ')})`);
  // typographie, cartel, fichier
  const c = await p.evaluate(() => { const txt = document.querySelector('.registre').textContent, f = document.querySelector('.cartel'), b = f.querySelector('b'), sp = f.querySelector('span'), img = document.querySelector('.oeuvre img'), sb = getComputedStyle(b), ss = getComputedStyle(sp);
    return { espaces: (txt.match(/ :/g) || []).length, insecables: (txt.match(/\u00A0:/g) || []).length, tag: f.tagName + ' ' + f.parentElement.tagName, legende: b.textContent, detail: sp.textContent,
      b: [sb.display, sb.fontSize, sb.fontWeight, sb.color].join(' '), s: [ss.display, ss.fontSize, ss.color].join(' '), ecart: Math.round(f.getBoundingClientRect().top - img.getBoundingClientRect().bottom),
      alt: img.alt, attrs: img.getAttribute('width') + ' × ' + img.getAttribute('height'), src: img.getAttribute('src'), lazy: img.getAttribute('loading') }; });
  ok(c.espaces === 0 && c.insecables === 1, `typographie : espace insécable avant « : » (${c.insecables} « : », aucune espace simple devant)`);
  ok(c.tag === 'FIGCAPTION FIGURE' && c.legende === 'Ines Reddah, 2024' && c.b === `block 14px 500 ${ANTHRACITE}` && c.detail === 'Feutres et acrylique, 65\u00A0×\u00A082\u00A0cm' && c.s === `block 13px ${GRIS}` && c.ecart === 16,
    `cartel, ${c.ecart} px sous l'image : « ${c.legende} » (14 px, 500, anthracite), puis « ${c.detail} » (13 px, gris ; espaces insécables autour de × et avant cm)`);
  ok(c.alt === ALT_OEUVRE && c.attrs === '870 × 1132' && c.src === '../directions/img/ines-reddah-2024-recadree.jpg' && !c.lazy, `œuvre : ${c.src}, width / height ${c.attrs}, texte alternatif (provisoire, lot 3)`);
  // navigation et panneau
  const nav = await p.evaluate(() => [...document.querySelectorAll('.site-nav a')].map(a => `${a.textContent}${a.classList.contains('is-active') ? ' actif' : ''}${a.hasAttribute('aria-current') ? ' aria-current=' + a.getAttribute('aria-current') : ''} → ${a.getAttribute('href')}`).join(' | '));
  ok(nav === 'Réalisations → realisations.html | Engagements actif aria-current=page → engagements.html | Contact → #contact', 'navigation : ' + nav);
  const panneau = await p.evaluate(() => ({ b: [...document.querySelectorAll('.mq__b')].map(f => f.dataset.cle + (f.classList.contains('is-inactif') ? ' (' + f.querySelector('.mq__note--inactif').textContent + ')' : '')).join(' · '),
    onglets: [...document.querySelectorAll('.mq__pages a')].map(a => a.textContent + (a.classList.contains('is-active') ? ' (actif)' : '')).join(' · ') }));
  ok(panneau.b === 'graphique (sans effet sur cette page)' && panneau.onglets === 'Home · Fiche · Réalisations · Engagements (actif)', `panneau : aucune bascule sur cette page — ${panneau.b} ; onglets ${panneau.onglets}`);
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('', [390, 844], {}, ENG);
  const m = await p.evaluate(() => { const s = sel => getComputedStyle(document.querySelector(sel)), rangs = [...document.querySelectorAll('.rang')].map(x => getComputedStyle(x));
    return { logo: s('.logo__texte').display, titre: s('.page__titre').fontSize, tete: s('.page-head').paddingTop + ' / ' + s('.page-head').paddingBottom, registre: s('.registre').paddingTop, verbe: s('.rang__verbe').fontSize,
      cols: rangs.map(x => x.gridTemplateColumns.split(' ').length).join(''), pad: rangs.map(x => x.paddingTop + ' / ' + x.paddingBottom).join(' · '), texte: s('.eng-texte').paddingTop }; });
  ok(m.logo === 'none' && m.titre === '44px' && m.tete === '28px / 24px' && m.registre === '4px' && m.verbe === '30px' && m.cols === '111' && m.pad === '22px / 40px · 22px / 40px · 22px / 44px' && m.texte === '14px',
    `mobile : Φ seul, titre 44 px, ouverture ${m.tete} (celle de .page-head), verbes 30 px, une colonne par rangée (${m.pad}), texte 14 px sous le verbe`);
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('', [1440, 900], { javaScriptEnabled: false }, ENG);
  ok(await p.evaluate(() => !document.querySelector('.mq') && document.querySelectorAll('.rang').length === 3 && getComputedStyle(document.querySelector('.cimaise')).display === 'block' && document.querySelector('.oeuvre img').naturalWidth === 870),
    'sans JavaScript : la page entière (trois rangées, l’œuvre sur sa cimaise), sans panneau');
  await ctx.close();
}
{
  // les liens « Engagements » de la navigation et du plan du pied de page, sur les sept pages (les quatre fiches reprennent l'en-tête et le pied de page
  // communs) ; actif sur la page Engagements seulement
  const liens = [];
  for (const page of ['index', ...DETAILLES.map(pageDe), REAL, ENG]) {
    const { p, ctx } = await ouvrir('', [1440, 900], {}, page);
    liens.push({ page, ...await p.evaluate(() => { const a = [...document.querySelectorAll('.site-nav a, .footer__nav a')].filter(x => x.textContent === 'Engagements');
      return { hrefs: a.map(x => x.getAttribute('href')), actif: a.some(x => x.classList.contains('is-active') || x.hasAttribute('aria-current')) }; }) });
    await ctx.close();
  }
  ok(liens.every(l => l.hrefs.length === 2 && l.hrefs.every(x => x === 'engagements.html') && l.actif === (l.page === ENG)),
    'liens « Engagements » (navigation et plan du pied de page) vers engagements.html sur les sept pages, actif sur la sienne seulement — ' + liens.map(l => `${l.page} : ${l.hrefs.join(', ')}${l.actif ? ' (actif)' : ''}`).join(' · '));
}
await browser.close();
console.log(ko ? `\n${ko} vérification(s) en échec` : '\nTout est vérifié.');
process.exitCode = ko ? 1 : 0;
