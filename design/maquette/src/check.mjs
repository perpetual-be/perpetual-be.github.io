// Vérifications de la maquette (Playwright + Chromium) : premier écran (structure F), débordement, effet de chaque bascule,
// valeurs figées et alignement, en-tête (Φ, wordmark), carte des réalisations, logos partenaires, photo 2800 px, mode présentation,
// page sans JavaScript, polices, contrastes.
// Usage, depuis la racine du dépôt : NODE_PATH=$(npm root -g) node design/maquette/src/check.mjs [--page index]
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)('playwright');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const MAQ = path.resolve(HERE, '..');
const PAGE = (() => { const i = process.argv.indexOf('--page'); return i !== -1 ? process.argv[i + 1] : 'index'; })();
const URL = 'file://' + path.join(MAQ, PAGE + '.html');
let ko = 0;
const ok = (cond, msg) => { console.log((cond ? '  ok  ' : '  KO  ') + msg); if (!cond) ko++; };

// Sur certains environnements, un Chromium pré-installé (PLAYWRIGHT_BROWSERS_PATH) peut être une révision différente de celle que playwright
// vient de télécharger côté npm ; s'il est là, on le pointe explicitement plutôt que de retélécharger un navigateur.
const CHROMIUM_PREINSTALLE = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(fs.existsSync(CHROMIUM_PREINSTALLE) ? { executablePath: CHROMIUM_PREINSTALLE } : {});
async function ouvrir(etat, viewport = [1440, 900], options = {}) {
  const ctx = await browser.newContext({ viewport: { width: viewport[0], height: viewport[1] }, reducedMotion: 'reduce', ...options });
  const p = await ctx.newPage();
  await p.goto(URL + (etat ? '?' + etat : ''), { waitUntil: 'networkidle' });
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
  for (const etat of ['', 'serif=source-serif', 'graisse=500']) {
    const { p, ctx } = await ouvrir(etat, [w, h]);
    const attendu = Math.min(560, Math.max(320, h - 270)), gauche = (w - 1200) / 2 + 40;
    const photo = await rect(p, '.hero__photo'), titre = await rect(p, '.hero__title span'), texte = await rect(p, '.hero__text'), sig = await rect(p, '.signature'), bande = await rect(p, '.stats-band');
    const nom = `${w}×${h} · ${etat || 'défaut'}`;
    ok(photo.top === 76 && photo.height === attendu && photo.width === w, `${nom} · photo pleine largeur sous l’en-tête, ${photo.height} px de haut (clamp → ${attendu})`);
    ok(titre.left === gauche && Math.abs(titre.top - (photo.top + 64)) <= 4 && titre.bottom < photo.bottom - 100 && (await style(p, '.hero__title', 'color')) === BLANC, `${nom} · accroche en blanc, en haut à gauche du container (x ${titre.left}, y ${titre.top})`);
    ok(bande.top >= photo.bottom && texte.top >= bande.bottom && sig.top >= texte.bottom && (await style(p, '.hero__text', 'columnCount')) === '2', `${nom} · la bande vient juste après la photo, puis les paragraphes en deux colonnes et la signature`);
    const chiffres = await p.evaluate(() => [...document.querySelectorAll('.stat__value')].map(s => Math.round(s.getBoundingClientRect().bottom)));
    ok(bande.bottom <= h && chiffres.every(b => b <= h), `${nom} · la bande et ses quatre chiffres tiennent entièrement dans l’écran (bande à ${bande.bottom}, chiffres à ${chiffres.join(', ')})`);
    await ctx.close();
  }
}

console.log('\n2 · Aucun débordement horizontal');
for (const [w, h] of [[1440, 900], [1366, 703], [390, 844]]) {
  for (const etat of ['', 'cadrage=haut', 'cadrage=bas', 'serif=source-serif&graisse=500', 'carte=papier-contour']) {
    const { p, ctx } = await ouvrir(etat, [w, h]);
    ok((await largeur(p)) === 0, `${w} · ${etat || 'défaut'}`); await ctx.close();
  }
}

console.log('\n3 · Chaque valeur de chaque bascule change le rendu');
const tests = [
  ['serif=source-serif', async p => /Source Serif 4/.test(await style(p, '.hero__title', 'fontFamily')) && /Source Serif 4/.test(await style(p, '.stat__value', 'fontFamily')) && /Source Serif 4/.test(await style(p, '.signature', 'fontFamily')) && /Source Serif 4/.test(await style(p, '.h2--serif', 'fontFamily')) && /Instrument Sans/.test(await style(p, '.h2--sans', 'fontFamily'))],
  ['graisse=500', async p => (await style(p, '.hero__title', 'fontWeight')) === '500' && (await style(p, '.stat__value', 'fontWeight')) === '500' && (await style(p, '.signature', 'fontWeight')) === '400' && (await style(p, '.four__name', 'fontWeight')) === '400' && (await style(p, '.h2--serif', 'fontWeight')) === '400', 'graisse=500 : accroche et chiffres en 500, la signature, les noms de projets et le titre de la carte restent en 400'],
  ['cadrage=haut', p => style(p, '.hero__photo img', 'objectPosition').then(v => v === '50% 20%'), 'cadrage=haut : Community 05 en 50% 20%'],
  ['cadrage=bas', p => style(p, '.hero__photo img', 'objectPosition').then(v => v === '50% 75%'), 'cadrage=bas : Community 05 en 50% 75%'],
  ['carte=papier-contour', async p => (await style(p, '.carte__pays', 'fill')) === PAPIER && (await style(p, '.carte__pays', 'stroke')) === TRAIT_CARTE && (await style(p, '.carte__pays', 'strokeWidth')) === '1px'],
];
for (const [etat, test, libelle] of tests) {
  const { p, ctx } = await ouvrir(etat);
  let res = false; try { res = await test(p); } catch (e) { res = false; }
  ok(res, libelle || etat); await ctx.close();
}
{
  // les bascules retirées le 23/09 : un paramètre resté dans une URL ne change plus rien
  const { p, ctx } = await ouvrir('ecran=colonnes&photo=data-box-03&accroche=droite&deco=arcs&signature=anthracite&autres=bande&pied=blanc&portee=partout');
  ok((await style(p, '.hero__photo', 'display')) === 'block' && ['left', 'start'].includes(await style(p, '.hero__title', 'textAlign')) && (await p.evaluate(() => document.querySelectorAll('.deco__svg').length)) === 1
    && (await style(p, '.signature', 'color')) === OR_FONCE && (await style(p, '.carte', 'display')) === 'grid' && (await style(p, '.site-footer', 'backgroundColor')) === PAPIER && (await style(p, '.h2--sans', 'fontWeight')) === '500',
    'paramètres des bascules retirées (ecran, photo, accroche, deco, signature, autres, pied, portee) : sans effet');
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
  ok((await style(p, '.hero__title', 'fontWeight')) === '400' && (await style(p, '.stat__value', 'fontWeight')) === '400', 'graisse 400 par défaut');
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
  ok(cles.join(' ') === 'serif graisse cadrage carte', 'panneau : ' + cles.join(' · '));
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('', [390, 844]);
  ok((await style(p, '.logo__texte', 'display')) === 'none' && (await style(p, '.logo__mark', 'display')) !== 'none' && (await style(p, '.site-header', 'height')) === '64px', 'mobile : Φ seul dans l’en-tête');
  const photo = await rect(p, '.hero__photo'), titre = await rect(p, '.hero__title span'), texte = await rect(p, '.hero__text'), bande = await rect(p, '.stats-band');
  ok(photo.height === 420 && titre.left === 20 && photo.bottom - titre.bottom >= 24 && photo.bottom - titre.bottom <= 40 && bande.top >= photo.bottom && texte.top >= bande.bottom && (await style(p, '.hero__text', 'columnCount')) !== '2', `mobile : photo de ${photo.height} px, accroche en bas à gauche (à ${photo.bottom - titre.bottom} px du bas), bande, puis paragraphes en une colonne`);
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
  const familles = ['Newsreader', 'Source Serif 4', 'Instrument Sans', 'Jost'];
  for (const f of familles) ok(await p.evaluate(async f => { await document.fonts.load(`400 16px "${f}"`); return document.fonts.check(`400 16px "${f}"`); }, f), `police chargée en file:// : ${f}`);
  ok(await p.evaluate(async () => { await document.fonts.load('500 16px "Newsreader"'); await document.fonts.load('500 16px "Source Serif 4"'); return document.fonts.check('500 16px "Newsreader"') && document.fonts.check('500 16px "Source Serif 4"'); }), 'les deux serifs répondent en graisse 500 (axe wght)');
  const inutiles = fs.readdirSync(path.join(MAQ, 'fonts')).filter(f => !/^(newsreader|source-serif-4|instrument-sans|jost)-/.test(f));
  ok(!inutiles.length, 'fonts/ ne contient que les polices utilisées' + (inutiles.length ? ' — en trop : ' + inutiles.join(', ') : ''));
  await ctx.close();
}

console.log('\n7 · Contrastes (WCAG) sur les fonds réels');
const lum = hex => { const c = hex.replace('#', ''); const [r, g, b] = [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contraste = (a, b) => { const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x); return ((l1 + 0.05) / (l2 + 0.05)).toFixed(2); };
const fonds = { blanc: '#FFFFFF', papier: '#F9F9F6', sable: '#F6F1E6' };
const encres = [['#26231F', 'anthracite (texte, barres)'], ['#6B655C', 'gris (étiquettes < 18 px)'], ['#9A948A', 'gris clair (réservé ≥ 18 px)'], ['#9A7A3B', 'or mat (chiffres ≥ 40 px)'], ['#8A6B2F', 'or foncé (liens, signature)'], ['#B8975A', 'or clair (filets seulement)'], ['#7A7466', 'gris chaud (logos, étiquettes des chiffres)']];
for (const [hex, nom] of encres) console.log('  ' + nom.padEnd(30) + Object.entries(fonds).map(([f, h]) => `${f} ${contraste(hex, h)}:1`).join('   '));

await browser.close();
console.log(ko ? `\n${ko} vérification(s) en échec` : '\nTout est vérifié.');
process.exitCode = ko ? 1 : 0;
