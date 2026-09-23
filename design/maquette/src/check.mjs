// Vérifications de la maquette (Playwright + Chromium) : premier écran (structure F), débordement, effet de chaque bascule,
// valeurs figées et alignement (gel de la Home du 23/09 : signature, espacements, pied de page), en-tête (Φ, wordmark), carte des réalisations,
// logos partenaires, photo 2800 px, mode présentation, page sans JavaScript, polices, contrastes ; puis la fiche The Bank et la vue Réalisations
// (débordement horizontal, polices, premier écran, bascules 20 et 21, ancres, galerie).
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
  await p.goto(URL(page) + (etat ? '?' + etat : ''), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  return { p, ctx };
}
const style = (p, sel, prop) => p.evaluate(([s, pr]) => { const el = document.querySelector(s); return el ? getComputedStyle(el)[pr] : null; }, [sel, prop]);
const rect = (p, sel) => p.evaluate(s => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) }; }, sel);
const largeur = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

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
  ok(cles.join(' ') === 'cadrage carte chapitres quatre', 'panneau : ' + cles.join(' · '));
  const liens = await p.evaluate(() => ({ nav: document.querySelector('.site-nav a').getAttribute('href'), plan: document.querySelector('.footer__nav a').getAttribute('href'), tous: document.querySelector('.autres__lien').getAttribute('href'),
    quatre: [...document.querySelectorAll('.four__row a')].map(a => a.getAttribute('href')) }));
  ok(liens.nav === 'realisations.html' && liens.plan === 'realisations.html' && liens.tous === 'realisations.html' && liens.quatre.join(' ') === 'realisations.html#ateliers-118 projet-the-bank.html realisations.html#data-box realisations.html#community',
    'liens : navigation, plan et « Toutes les réalisations → » vers realisations.html ; The Bank vers sa fiche, les trois autres vers leur ancre');
  ok((await p.evaluate(() => [...document.querySelectorAll('.mq__b[data-cle="cadrage"] input')].map(i => i.value).join(' '))) === 'centre haut', 'bascule 9c : centre / haut seulement (« bas » retiré)');
  await ctx.close();
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
  ok(await p.evaluate(() => /community-05-l\.jpg$/.test(document.querySelector('.hero__photo img').currentSrc)), 'premier écran : la version 2800 px est servie à 1440 × 2'); await ctx.close();
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
for (const [hex, nom] of encres) console.log('  ' + nom.padEnd(30) + Object.entries(fonds).map(([f, h]) => `${f} ${contraste(hex, h)}:1`).join('   '));

// ---------- fiche The Bank et vue Réalisations ----------
const FICHE = 'projet-the-bank', REAL = 'realisations';
const familles = ['Newsreader', 'Instrument Sans', 'Jost'];
async function polices(p, nom) {
  for (const f of familles) ok(await p.evaluate(async f => { await document.fonts.load(`400 16px "${f}"`); return document.fonts.check(`400 16px "${f}"`); }, f), `${nom} : police chargée en file:// : ${f}`);
}

console.log('\n8 · Fiche The Bank');
for (const [w, h] of [[1440, 900], [1366, 703], [390, 844]]) {
  for (const etat of ['', 'chapitres=sans']) {
    const { p, ctx } = await ouvrir(etat, [w, h], {}, FICHE);
    ok((await largeur(p)) === 0, `fiche · ${w} · ${etat || 'défaut'} : aucun débordement horizontal`); await ctx.close();
  }
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
  ok(hero.height === 520 && hero.width === 1440 && hero.top >= head.bottom && await p.evaluate(() => /the-bank-03(-l)?\.jpg$/.test(document.querySelector('.fiche__hero img').currentSrc)), `photo hero the-bank-03, pleine largeur, ${hero.height} px de haut`);
  ok(faits.bottom <= 900, `premier écran à 1440 × 900 : le titre, la photo et la bande de faits tiennent (bande à ${faits.bottom})`);
  const f = await p.evaluate(() => ({ bande: getComputedStyle(document.querySelector('.faits-band')).backgroundColor, valeurs: [...document.querySelectorAll('.stats--faits .stat__value')].map(v => { const s = getComputedStyle(v); return { t: v.textContent, c: s.color, ff: s.fontFamily, fs: s.fontSize, fw: s.fontWeight }; }),
    etiquettes: [...document.querySelectorAll('.stats--faits .stat__label')].map(l => ({ t: l.textContent, c: getComputedStyle(l).color })) }));
  ok(f.bande === PAPIER && f.valeurs.map(v => v.t).join(' · ') === 'Liège · 1 100 m² · Logements & commerce' && f.valeurs.every(v => v.c === OR && v.ff.startsWith('Newsreader') && v.fs === '28px' && v.fw === '400')
    && f.etiquettes.map(l => l.t).join(' · ') === 'Localisation · Surface · Usage' && f.etiquettes.every(l => l.c === GRIS_CHAUD),
    'bande de faits : surface papier, valeurs en serif or 28 px (Liège · 1 100 m² · Logements & commerce), étiquettes gris chaud');
  const ch = await p.evaluate(() => [...document.querySelectorAll('.chapitre')].map(c => { const t = c.querySelector('.chapitre__titre'), s = getComputedStyle(t); return { num: c.querySelector('.chapitre__num').textContent, numColor: getComputedStyle(c.querySelector('.chapitre__num')).color, titre: t.textContent, ff: s.fontFamily, fs: s.fontSize, fw: s.fontWeight, texte: c.querySelector('.chapitre__texte').textContent.length, largeur: Math.round(c.parentElement.getBoundingClientRect().width), left: Math.round(c.getBoundingClientRect().left) }; }));
  ok(ch.length === 3 && ch.map(c => c.num).join(' ') === '01 02 03' && ch.map(c => c.titre).join(' / ') === 'Ce que c’était / Ce que nous y avons vu / Ce que c’est devenu' && ch.every(c => c.texte > 20 && c.numColor === OR), 'trois chapitres numérotés 01 02 03 (numéros or) avec les textes de data/projects.json');
  ok(ch.every(c => c.ff.startsWith('Newsreader') && c.fs === '32px' && c.fw === '400'), 'titres de chapitre : serif Newsreader 400, 32 px par défaut (bascule 20)');
  ok(ch.every(c => c.largeur === 760 && c.left === 160), 'chapitres en colonne de 760 px alignée à gauche');
  const photos = await p.evaluate(() => [...document.querySelectorAll('.fiche__photos figure')].map(fg => { const r = fg.querySelector('img').getBoundingClientRect(); return { src: fg.querySelector('img').currentSrc.replace(/^.*\//, ''), w: Math.round(r.width), h: Math.round(r.height), legende: fg.querySelector('figcaption').textContent }; }));
  const place = await p.evaluate(() => { const ch = [...document.querySelectorAll('.chapitre')].map(c => c.getBoundingClientRect().top), ph = document.querySelector('.fiche__photos').getBoundingClientRect().top; return ch[0] < ph && ph < ch[1]; });
  ok(photos.length === 2 && /^the-bank-01/.test(photos[0].src) && /^the-bank-02/.test(photos[1].src) && photos.every(x => x.h === 440) && photos[0].w < photos[1].w && Math.abs(photos[0].w / photos[1].w - 5 / 7) < 0.03 && photos.every(x => x.legende.length > 5) && place,
    `photos intercalées entre les chapitres 01 et 02 : the-bank-01 portrait (${photos[0] && photos[0].w} px) et the-bank-02 paysage (${photos[1] && photos[1].w} px), 440 px, légendes`);
  const suivant = await p.evaluate(() => { const a = document.querySelector('.suivant'); return { href: a.getAttribute('href'), texte: a.querySelector('.eyebrow').textContent + ' — ' + a.querySelector('.suivant__nom').textContent, color: getComputedStyle(a.querySelector('.suivant__nom')).color, bloc: getComputedStyle(a.querySelector('.eyebrow')).display }; });
  ok(suivant.href === 'realisations.html#data-box' && suivant.texte === 'Projet suivant — Data Box →' && suivant.color === OR_FONCE && suivant.bloc === 'block', `« ${suivant.texte} » → ${suivant.href}, or foncé, l'étiquette au-dessus du nom`);
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.site-footer')).backgroundColor === 'rgb(249, 249, 246)' && document.querySelector('.footer__nav a').getAttribute('href') === 'realisations.html' && document.querySelector('.footer__nav a[href="index.html#collectif"]') !== null), 'pied de page papier ; plan vers realisations.html, Collectif vers index.html#collectif');
  const panneau = await p.evaluate(() => [...document.querySelectorAll('.mq__b')].map(f => f.dataset.cle + (f.classList.contains('is-inactif') ? ' (sans effet)' : '')).join(' · '));
  ok(panneau === 'cadrage (sans effet) · carte (sans effet) · chapitres · quatre (sans effet)', 'panneau : ' + panneau);
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('chapitres=sans', [1440, 900], {}, FICHE);
  const t = await p.evaluate(() => [...document.querySelectorAll('.chapitre__titre')].map(t => { const s = getComputedStyle(t); return s.fontFamily.startsWith('"Instrument Sans"') && s.fontSize === '26px' && s.fontWeight === '500'; }));
  ok(t.length === 3 && t.every(Boolean) && (await style(p, '.page__titre', 'fontFamily')).startsWith('Newsreader') && (await style(p, '.stats--faits .stat__value', 'fontFamily')).startsWith('Newsreader'), 'chapitres=sans : titres de chapitre en Instrument Sans medium 26 px, le titre et les faits restent en serif');
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('chapitres=sans&quatre=cartes');
  ok((await p.evaluate(() => document.querySelectorAll('.chapitre').length)) === 0 && (await style(p, '.four', 'display')) === 'grid', 'Home : chapitres=sans et quatre=cartes sont sans effet');
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('', [1366, 703], {}, FICHE);
  const hero = await rect(p, '.fiche__hero'), h1 = await rect(p, '.page__titre');
  ok(h1.bottom < hero.top && hero.top < 703 - 300, `premier écran à 1366 × 703 : le titre et au moins 300 px de la photo (photo de ${hero.top} à ${hero.bottom})`);
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('', [390, 844], {}, FICHE);
  ok((await style(p, '.logo__texte', 'display')) === 'none' && (await style(p, '.page__titre', 'fontSize')) === '44px' && (await rect(p, '.fiche__hero')).height === 300, 'mobile : Φ seul, titre 44 px, photo de 300 px');
  const m = await p.evaluate(() => ({ faits: getComputedStyle(document.querySelector('.stats--faits')).gridTemplateColumns.split(' ').length, photos: getComputedStyle(document.querySelector('.fiche__photos')).gridTemplateColumns.split(' ').length, h: Math.round(document.querySelector('.fiche__photos img').getBoundingClientRect().height), titre: getComputedStyle(document.querySelector('.chapitre__titre')).fontSize, bande: Math.round(document.querySelector('.faits-band').getBoundingClientRect().bottom) }));
  ok(m.faits === 2 && m.photos === 1 && m.h === 300 && m.titre === '26px', `mobile : faits en 2 × 2, photos en une colonne de 300 px, titres de chapitre 26 px`);
  ok(m.bande <= 844, `mobile : le titre, la photo et la bande de faits tiennent dans 844 (bande à ${m.bande})`);
  await ctx.close();
}

console.log('\n9 · Vue Réalisations');
for (const [w, h] of [[1440, 900], [1366, 703], [390, 844]]) {
  for (const etat of ['', 'quatre=cartes']) {
    const { p, ctx } = await ouvrir(etat, [w, h], {}, REAL);
    ok((await largeur(p)) === 0, `réalisations · ${w} · ${etat || 'défaut'} : aucun débordement horizontal`); await ctx.close();
  }
}
{
  const { p, ctx } = await ouvrir('', [1440, 900], {}, REAL);
  await polices(p, 'réalisations');
  const t = await p.evaluate(() => ({ title: document.title, h1: document.querySelector('.page__titre').textContent, sous: document.querySelector('.page__sous').textContent, actif: document.querySelector('.site-nav a.is-active') && document.querySelector('.site-nav a.is-active').textContent }));
  ok(t.title === 'Réalisations — Perpetual' && t.h1 === 'Réalisations' && t.actif === 'Réalisations', `titre « ${t.h1} », « ${t.actif} » actif dans la navigation (${t.sous})`);
  const liste = await p.evaluate(() => ({ four: getComputedStyle(document.querySelector('.section--quatre .four')).display, cartes: getComputedStyle(document.querySelector('.cartes')).display, rows: [...document.querySelectorAll('.section--quatre .four__row')].map(r => (r.id || '—') + ' → ' + r.querySelector('a').getAttribute('href')),
    apercu: !!document.querySelector('.section--quatre .four__preview img.is-active'), bas: Math.round(document.querySelector('.section--quatre .four').getBoundingClientRect().bottom) }));
  ok(liste.four === 'grid' && liste.cartes === 'none' && liste.rows.join(' | ') === 'ateliers-118 → realisations.html#ateliers-118 | — → projet-the-bank.html | data-box → realisations.html#data-box | community → realisations.html#community' && liste.apercu,
    'les 4 projets en liste par défaut (bascule 21), ancres sur les lignes, The Bank vers sa fiche, aperçu photo');
  ok(liste.bas <= 900, `premier écran à 1440 × 900 : le titre et la liste des 4 tiennent (liste à ${liste.bas})`);
  ok(await p.evaluate(() => [...document.querySelectorAll('[id]')].map(e => e.id).filter((x, i, a) => a.indexOf(x) !== i).length === 0), 'aucun id en double');
  const ag = await p.evaluate(() => ({ intro: document.querySelector('.agences__intro').textContent.slice(0, 30), noms: [...document.querySelectorAll('.agence__nom')].map(n => n.textContent), lignes: [...document.querySelectorAll('.agence__ligne')].map(n => n.textContent), ff: getComputedStyle(document.querySelector('.agence__nom')).fontFamily }));
  ok(ag.noms.join(' · ') === 'Braine-le-Comte · Pont-à-Celles · Jambes · Mettet' && ag.lignes.every(l => /^\d.*m² · /.test(l)) && ag.ff.startsWith('Newsreader') && ag.intro.startsWith('Une agence bancaire fermée'), 'programme agences : intro de content/realisations.md, puis ' + ag.noms.join(' · '));
  const g = await p.evaluate(() => ({ n: document.querySelectorAll('.galerie__item').length, cols: getComputedStyle(document.querySelector('.galerie')).gridTemplateColumns.split(' ').length, srcs: [...document.querySelectorAll('.galerie__item img')].map(i => i.getAttribute('src').replace(/^.*\//, '')),
    ratio: (() => { const r = document.querySelector('.galerie__photo').getBoundingClientRect(); return r.width / r.height; })(), noms: [...document.querySelectorAll('.galerie__nom')].map(n => n.textContent), voile: getComputedStyle(document.querySelector('.galerie__voile')).opacity, meta: getComputedStyle(document.querySelector('.galerie__meta')).display,
    metaTexte: document.querySelector('.galerie__voile').textContent }));
  ok(g.n === 12 && g.cols === 3 && g.srcs.every(s => /-01-s\.jpg$/.test(s)) && Math.abs(g.ratio - 1.5) < 0.01 && g.noms[0] === '# Bank 24' && g.noms[11] === 'Ode to Joy' && g.voile === '0' && g.meta === 'none' && /^\d.* m² · /.test(g.metaTexte),
    `galerie : ${g.n} biens en 3 colonnes, photos <id>-01-s.jpg en 3:2, nom sous la photo, « ${g.metaTexte} » caché au repos`);
  await p.hover('.galerie__item:nth-child(2) .galerie__photo');
  const hv = await p.evaluate(() => { const it = document.querySelector('.galerie__item:nth-child(2)'); return { voile: getComputedStyle(it.querySelector('.galerie__voile')).opacity, zoom: getComputedStyle(it.querySelector('img')).transform }; });
  ok(hv.voile === '1' && /^matrix\(1\.035, 0, 0, 1\.035/.test(hv.zoom), `galerie : au survol, surface · usage en surimpression et zoom 1,035 (${hv.zoom})`);
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('quatre=cartes', [1440, 900], {}, REAL);
  const c = await p.evaluate(() => ({ four: getComputedStyle(document.querySelector('.section--quatre .four')).display, cartes: getComputedStyle(document.querySelector('.cartes')).display, cols: getComputedStyle(document.querySelector('.cartes')).gridTemplateColumns.split(' ').length,
    items: [...document.querySelectorAll('.cartes__item')].map(i => (i.id || '—') + ' → ' + i.querySelector('a').getAttribute('href')), ratio: (() => { const r = document.querySelector('.cartes__photo').getBoundingClientRect(); return r.width / r.height; })(),
    noms: [...document.querySelectorAll('.cartes__nom')].map(n => n.textContent), lignes: document.querySelectorAll('.cartes__ligne').length, rowsId: [...document.querySelectorAll('.four__row[id]')].length, doublons: [...document.querySelectorAll('[id]')].map(e => e.id).filter((x, i, a) => a.indexOf(x) !== i).length }));
  ok(c.four === 'none' && c.cartes === 'grid' && c.cols === 2 && Math.abs(c.ratio - 1.5) < 0.01 && c.noms.join(' · ') === 'Ateliers 118 · The Bank · Data Box · Community' && c.lignes === 4, 'quatre=cartes : la liste disparaît, quatre cartes photo 3:2 en 2 × 2, nom et ligne sous la photo');
  ok(c.items.join(' | ') === 'ateliers-118 → realisations.html?quatre=cartes#ateliers-118 | — → projet-the-bank.html?quatre=cartes | data-box → realisations.html?quatre=cartes#data-box | community → realisations.html?quatre=cartes#community' && c.rowsId === 0 && c.doublons === 0,
    'quatre=cartes : les ancres passent sur les cartes (les lignes de la liste les perdent), aucun id en double');
  await p.hover('.cartes__item:first-child a');
  ok(/^matrix\(1\.035/.test(await p.evaluate(() => getComputedStyle(document.querySelector('.cartes__item:first-child img')).transform)), 'cartes : zoom 1,035 au survol');
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('', [390, 844], {}, REAL);
  const m = await p.evaluate(() => ({ cols: getComputedStyle(document.querySelector('.galerie')).gridTemplateColumns.split(' ').length, meta: getComputedStyle(document.querySelector('.galerie__meta')).display, voile: getComputedStyle(document.querySelector('.galerie__voile')).display,
    agences: getComputedStyle(document.querySelector('.agences')).gridTemplateColumns.split(' ').length, apercu: getComputedStyle(document.querySelector('.section--quatre .four__preview')).display, titre: getComputedStyle(document.querySelector('.page__titre')).fontSize }));
  ok(m.cols === 1 && m.meta === 'block' && m.voile === 'none' && m.agences === 1 && m.apercu === 'none' && m.titre === '44px', 'mobile : galerie en une colonne avec surface · usage affichés, agences en une colonne, liste sans aperçu, titre 44 px');
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('quatre=cartes', [390, 844], {}, REAL);
  ok((await style(p, '.cartes', 'gridTemplateColumns')).split(' ').length === 1, 'mobile : cartes en une colonne');
  await ctx.close();
}

await browser.close();
console.log(ko ? `\n${ko} vérification(s) en échec` : '\nTout est vérifié.');
process.exitCode = ko ? 1 : 0;
