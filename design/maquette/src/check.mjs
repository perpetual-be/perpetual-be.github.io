// Vérifications de la maquette (Playwright + Chromium) : premier écran, débordement, effet de chaque bascule, carte et bande
// des réalisations, Φ de l'en-tête, logos partenaires, photo 2800 px, mode présentation, page sans JavaScript, polices, contrastes.
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

const browser = await chromium.launch();
async function ouvrir(etat, viewport = [1440, 900], options = {}) {
  const ctx = await browser.newContext({ viewport: { width: viewport[0], height: viewport[1] }, reducedMotion: 'reduce', ...options });
  const p = await ctx.newPage();
  await p.goto(URL + (etat ? '?' + etat : ''), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  return { p, ctx };
}
const style = (p, sel, prop) => p.evaluate(([s, pr]) => { const el = document.querySelector(s); return el ? getComputedStyle(el)[pr] : null; }, [sel, prop]);
const bas = (p) => p.evaluate(() => { const el = [...document.querySelectorAll('.stats-band, .stats-photo')].find(e => getComputedStyle(e).display !== 'none'); return el ? Math.round(el.getBoundingClientRect().bottom) : null; });
const largeur = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

console.log('\n1 · Premier écran : bas des chiffres (px) — doit tenir dans 900 à 1440 et dans 703 à 1366');
const variantes = [['4 colonnes', ''], ['liste', 'chiffres=liste'], ['sur photo, C’', 'chiffres=photo'], ['sur photo, B', 'chiffres=photo&structure=b']];
const serifs = ['newsreader', 'source-serif', 'literata', 'playfair'];
for (const [w, h] of [[1440, 900], [1366, 703]]) {
  for (const [nom, etat] of variantes) {
    const ligne = [];
    for (const s of serifs) {
      const { p, ctx } = await ouvrir([etat, s !== 'newsreader' ? 'serif=' + s : ''].filter(Boolean).join('&'), [w, h]);
      const b = await bas(p); ligne.push(`${s} ${b}`); await ctx.close();
      if (nom === '4 colonnes' || s === 'newsreader') ok(b <= h, `${w}×${h} · ${nom} · ${s} : ${b}`);
    }
    if (nom !== '4 colonnes') console.log('        autres serifs : ' + ligne.slice(1).join(' · '));
  }
}

console.log('\n2 · Aucun débordement horizontal');
for (const [w, h] of [[1440, 900], [1366, 703], [390, 844]]) {
  for (const etat of ['', 'chiffres=photo', 'chiffres=photo&structure=b', 'chiffres=liste', 'wordmark=playfair', 'autres=bande']) {
    const { p, ctx } = await ouvrir(etat, [w, h]);
    ok((await largeur(p)) === 0, `${w} · ${etat || 'défaut'}`); await ctx.close();
  }
}

console.log('\n3 · Chaque valeur de chaque bascule change le rendu (dans son contexte)');
const tests = [
  ['serif=source-serif', p => style(p, '.hero__title', 'fontFamily').then(v => /Source Serif 4/.test(v))],
  ['serif=literata', p => style(p, '.hero__title', 'fontFamily').then(v => /Literata/.test(v))],
  ['serif=playfair', p => style(p, '.hero__title', 'fontFamily').then(v => /Playfair/.test(v))],
  ['portee=rationnee', async p => /Inter/.test(await style(p, '.h2', 'fontFamily')) && /Newsreader/.test(await style(p, '.hero__title', 'fontFamily'))],
  ['sans=instrument', p => style(p, 'body', 'fontFamily').then(v => /Instrument Sans/.test(v))],
  ['wordmark=jost', async p => (await style(p, '.logo__texte', 'display')) !== 'none' && /Jost/.test(await style(p, '.logo__texte', 'fontFamily')) && (await style(p, '.logo__trace', 'display')) === 'none'],
  ['wordmark=source-serif', p => style(p, '.logo__texte', 'fontFamily').then(v => /Source Serif 4/.test(v))],
  ['wordmark=literata', p => style(p, '.logo__texte', 'fontFamily').then(v => /Literata/.test(v))],
  ['wordmark=playfair', p => style(p, '.logo__texte', 'fontFamily').then(v => /Playfair/.test(v))],
  ['phi=or', async p => (await style(p, '.logo__mark', 'color')) === 'rgb(154, 122, 59)' && (await style(p, '.logo__mark', 'fill')) === 'rgb(154, 122, 59)'],
  ['or=touches', async p => (await style(p, '.stat__value', 'color')) === 'rgb(38, 35, 31)' && (await style(p, '.stats-band', 'backgroundColor')) === 'rgb(255, 255, 255)' && (await style(p, '.signature', 'color')) === 'rgb(38, 35, 31)'],
  ['or=touches&bande=papier', p => style(p, '.stats-band', 'backgroundColor').then(v => v === 'rgb(249, 249, 246)')],
  ['or=touches&chiffres=photo', p => style(p, '.stats--photo .stat__value', 'color').then(v => v === 'rgb(255, 255, 255)')],
  ['bande=papier', p => style(p, '.stats-band', 'backgroundColor').then(v => v === 'rgb(249, 249, 246)')],
  ['chiffres=liste', p => style(p, '.stats', 'display').then(v => v === 'block')],
  ['chiffres=photo', async p => (await style(p, '.stats-photo', 'display')) === 'block' && (await style(p, '.stats-band', 'display')) === 'none' && (await style(p, '.stats-photo__img[data-photo="community-05"]', 'display')) === 'block'],
  ['chiffres=photo&structure=b', async p => (await style(p, '.lead', 'display')) === 'flex' && (await p.evaluate(() => document.querySelector('.hero__text').getBoundingClientRect().top > document.querySelector('.stats-photo').getBoundingClientRect().bottom - 1))],
  ['chiffres=photo&photo=data-box-02', async p => (await style(p, '.stats-photo__img[data-photo="data-box-02"]', 'display')) === 'block' && (await style(p, '.stats-photo__img[data-photo="community-05"]', 'display')) === 'none'],
  ['chiffres=photo&photo=the-bank-01', p => style(p, '.stats-photo__img[data-photo="the-bank-01"]', 'display').then(v => v === 'block')],
  ['chiffres=photo&photo=the-bank-03', p => style(p, '.stats-photo__img[data-photo="the-bank-03"]', 'display').then(v => v === 'block')],
  ['chiffres=photo&cote=droite', p => style(p, '.stats-photo__in', 'justifyContent').then(v => v === 'flex-end')],
  ['deco=arcs', p => style(p, '.deco--arcs', 'display').then(v => v === 'block')],
  ['deco=phi', p => style(p, '.deco--phi', 'display').then(v => v === 'block')],
  ['deco=anneaux', p => style(p, '.deco--anneaux', 'display').then(v => v === 'block')],
  ['projets=aucune', p => style(p, '.section--projets', 'display').then(v => v === 'none')],
  ['projets=aucune', p => style(p, '.section--autres', 'display').then(v => v === 'block'), 'projets=aucune : la section Réalisations reste (bascule 15 indépendante de la 11)'],
  ['autres=bande', async p => (await style(p, '.bande', 'display')) === 'block' && (await style(p, '.carte', 'display')) === 'none' && (await style(p, '.autres__tous', 'display')) !== 'none' && (await p.evaluate(() => document.querySelectorAll('.bande__item').length)) === 32],
  ['autres=aucune', p => style(p, '.section--autres', 'display').then(v => v === 'none')],
  ['carte=trait', async p => (await style(p, '.carte__pays', 'fill')) === 'none' && (await style(p, '.carte__pays', 'stroke')) === 'rgb(214, 208, 196)' && (await style(p, '.carte__pays', 'strokeWidth')) === '1px'],
  ['villes=quelques-unes', p => p.evaluate(() => { const l = [...document.querySelectorAll('.carte__lab')]; const v = l.filter(t => getComputedStyle(t).opacity === '1'); return l.length === 17 && v.length === 3 && v.every(t => t.dataset.rang === '1'); })],
  ['villes=aucune', async p => {
    if (!(await p.evaluate(() => [...document.querySelectorAll('.carte__lab')].every(t => getComputedStyle(t).opacity === '0')))) return false;
    await p.hover('.carte__lieu[data-lieu="Liège"] .carte__pt');
    return p.evaluate(() => { const s = getComputedStyle(document.querySelector('.carte__lieu[data-lieu="Liège"] .carte__lab')); return s.opacity === '1' && s.fill === 'rgb(38, 35, 31)'; });
  }, 'villes=aucune : points seuls, l’étiquette du point survolé apparaît en anthracite'],
  ['or=touches', p => style(p, '.carte__pt', 'fill').then(v => v === 'rgb(38, 35, 31)'), 'or=touches : points de la carte en anthracite'],
  ['logos=gris', p => style(p, '.partners', 'color').then(v => v === 'rgb(122, 116, 102)')],
  ['logos=couleur', async p => (await style(p, '.partner__couleur', 'display')) === 'block' && (await style(p, '.partner__encre', 'display')) === 'none'],
];
for (const [etat, test, libelle] of tests) {
  const { p, ctx } = await ouvrir(etat);
  let res = false; try { res = await test(p); } catch (e) { res = false; }
  ok(res, libelle || etat); await ctx.close();
}

console.log('\n4 · Réalisations : la carte (défaut) et la bande');
{
  const { p, ctx } = await ouvrir('');
  const c = await p.evaluate(() => ({
    place: document.querySelector('.section--projets').nextElementSibling.classList.contains('section--autres') && document.querySelector('.section--autres').nextElementSibling.classList.contains('section--collectif'),
    pts: document.querySelectorAll('.carte__pt').length, labs: document.querySelectorAll('.carte__lab').length, rang1: [...document.querySelectorAll('.carte__lab[data-rang="1"]')].map(t => t.textContent),
    groupe: document.querySelector('.carte__lab--groupe').textContent, fig: Math.round(document.querySelector('.carte__fig').getBoundingClientRect().width),
    section: Math.round(document.querySelector('.section--autres').getBoundingClientRect().height),
  }));
  ok(c.place, 'la section Réalisations est entre Projets et Collectif');
  ok(c.pts === 20 && c.labs === 17 && c.groupe === 'Bruxelles', `carte : ${c.pts} points, ${c.labs} étiquettes, groupe « ${c.groupe} »`);
  ok(c.rang1.length === 3, 'carte : étiquettes de rang 1 — ' + c.rang1.join(' · '));
  ok(c.fig <= 500, `carte : SVG ${c.fig} px de large (500 max)`);
  ok((await style(p, '.carte__pays', 'fill')) === 'rgb(246, 241, 230)' && (await style(p, '.carte__pt', 'fill')) === 'rgb(154, 122, 59)' && (await style(p, '.carte__pt', 'stroke')) === 'rgb(255, 255, 255)' && (await style(p, '.carte__lab', 'fill')) === 'rgb(107, 101, 92)' && (await style(p, '.carte__lab--groupe', 'fill')) === 'rgb(38, 35, 31)', 'carte : pays sable, points or à liseré blanc, étiquettes gris chaud, Bruxelles anthracite');
  await p.hover('.carte__lieu[data-lieu="Jemelle"] .carte__pt');
  ok((await style(p, '.carte__lieu[data-lieu="Jemelle"] .carte__lab', 'fill')) === 'rgb(38, 35, 31)', 'carte : le survol d’un point passe son étiquette en anthracite');
  console.log(`        hauteur de la section : ${c.section} px (visée ≈ 550)`);
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('autres=bande', [1440, 900], { reducedMotion: 'no-preference' });
  ok((await style(p, '.bande__piste', 'animationName')) === 'bande' && (await style(p, '.bande__piste', 'animationDuration')) === '70s' && (await style(p, '.bande__piste', 'animationTimingFunction')) === 'linear' && (await style(p, '.bande__piste', 'animationIterationCount')) === 'infinite', 'bande : défile en 70 s, linéaire, en continu');
  const b = await p.evaluate(() => {
    const items = [...document.querySelectorAll('.bande__item')], img = items[0].querySelector('img').getBoundingClientRect();
    return { piste: document.querySelector('.bande__piste').offsetWidth, copie: items[16].offsetLeft - items[0].offsetLeft, gap: items[1].offsetLeft - items[0].offsetLeft - items[0].offsetWidth,
      vignette: `${Math.round(img.width)}×${Math.round(img.height)}`, section: Math.round(document.querySelector('.section--autres').getBoundingClientRect().height),
      villes: items.slice(0, 16).map(li => li.querySelector('.bande__ville').textContent), photos: items.slice(0, 16).map(li => li.querySelector('img').getAttribute('src')), liens: document.querySelectorAll('.bande a').length };
  });
  ok(Math.abs(b.piste / 2 - b.copie) < 1, `bande : la copie commence à −50 % de la piste (${b.copie} / ${b.piste} px)`);
  ok(b.vignette === '200×133' && b.gap === 24 && b.liens === 0, `bande : vignettes ${b.vignette}, gap ${b.gap} px, rien à cliquer`);
  ok(b.villes.filter(v => v === 'Bruxelles').length === 2 && !b.villes.some(v => /\d/.test(v)), 'bande : villes sans code postal, « Bruxelles » deux fois — ' + b.villes.join(' · '));
  const absentes = b.photos.filter(src => !fs.existsSync(path.join(MAQ, src)));
  ok(!absentes.length, 'bande : les 16 photos existent' + (absentes.length ? ' — absentes : ' + absentes.map(s => path.basename(s)).join(', ') : ''));
  console.log(`        hauteur de la section : ${b.section} px (visée ≈ 360)`);
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('autres=bande');
  ok((await style(p, '.bande__piste', 'animationName')) === 'none', 'bande : immobile sous prefers-reduced-motion'); await ctx.close();
}
{
  const { p, ctx } = await ouvrir('', [390, 844]);
  const m = await p.evaluate(() => ({ cols: getComputedStyle(document.querySelector('.carte')).gridTemplateColumns.split(' ').length, fig: Math.round(document.querySelector('.carte__fig').getBoundingClientRect().width), visibles: [...document.querySelectorAll('.carte__lab')].filter(t => getComputedStyle(t).opacity === '1').map(t => t.textContent) }));
  ok(m.cols === 1 && m.fig === 350, `mobile : carte pleine largeur (${m.fig} px, une colonne)`);
  ok(m.visibles.length === 3 && m.visibles.every(v => ['Bruxelles', 'Liège', 'Jemelle'].includes(v)), 'mobile : étiquettes de rang 1 seulement — ' + m.visibles.join(' · '));
  await ctx.close();
}

console.log('\n5 · Φ de l’en-tête, logos partenaires, photo 2800 px, présentation, sans JavaScript, polices');
{
  const { p, ctx } = await ouvrir('');
  ok((await style(p, '.logo__mark', 'fill')) === 'rgb(104, 78, 30)', 'Φ de l’en-tête peint en bronze par défaut (fill hérité de color)');
  const logos = await p.evaluate(() => [...document.querySelectorAll('.partner')].map(li => { const r = li.querySelector('.partner__encre').getBoundingClientRect(); return { nom: li.title, h: Math.round(r.height), c: Math.round((r.top + r.bottom) / 2) }; }));
  const attendu = { ASAP: 42, Batopin: 34, 'CN Architecture': 35, 'Felis & Associés': 34, Menuisol: 34, 'Property Lab': 49, Synopsis: 60, 'Zekaj Construct': 34 };
  ok(logos.length === 8 && logos.every(l => l.h === attendu[l.nom]), 'logos à la masse visuelle : ' + logos.map(l => `${l.nom} ${l.h}`).join(' · '));
  ok(Math.max(...logos.map(l => l.c)) - Math.min(...logos.map(l => l.c)) <= 1, 'logos alignés au centre de la rangée');
  await ctx.close();
}
{
  const { p, ctx } = await ouvrir('chiffres=photo', [1440, 900], { deviceScaleFactor: 2 });
  ok(await p.evaluate(() => /community-05-l\.jpg$/.test(document.querySelector('.stats-photo__img[data-photo="community-05"]').currentSrc)), 'chiffres sur photo : la version 2800 px est servie à 1440 × 2'); await ctx.close();
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
  ok(await p.evaluate(() => !document.querySelector('.mq') && !!document.querySelector('.four__preview img.is-active')), 'sans JavaScript : la page est la planche A, sans panneau'); await ctx.close();
}
{
  const { p, ctx } = await ouvrir('');
  const familles = ['Newsreader', 'Source Serif 4', 'Literata', 'Playfair Display', 'Inter', 'Instrument Sans', 'Jost'];
  for (const f of familles) ok(await p.evaluate(async f => { await document.fonts.load(`400 16px "${f}"`); return document.fonts.check(`400 16px "${f}"`); }, f), `police chargée en file:// : ${f}`);
  await ctx.close();
}

console.log('\n6 · Contrastes (WCAG) sur les fonds réels');
const lum = hex => { const c = hex.replace('#', ''); const [r, g, b] = [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contraste = (a, b) => { const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x); return ((l1 + 0.05) / (l2 + 0.05)).toFixed(2); };
const fonds = { blanc: '#FFFFFF', sable: '#F6F1E6', papier: '#F9F9F6' };
const encres = [['#26231F', 'anthracite (texte)'], ['#6B655C', 'gris (étiquettes < 18 px)'], ['#9A948A', 'gris clair (réservé ≥ 18 px)'], ['#9A7A3B', 'or mat (chiffres ≥ 40 px)'], ['#8A6B2F', 'or foncé (liens)'], ['#B8975A', 'or clair (filets seulement)'], ['#7A7466', 'gris chaud (logos)']];
for (const [hex, nom] of encres) console.log('  ' + nom.padEnd(30) + Object.entries(fonds).map(([f, h]) => `${f} ${contraste(hex, h)}:1`).join('   '));

await browser.close();
console.log(ko ? `\n${ko} vérification(s) en échec` : '\nTout est vérifié.');
process.exitCode = ko ? 1 : 0;
