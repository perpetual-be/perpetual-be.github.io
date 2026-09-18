// Vérifications de la maquette (Playwright + Chromium) : premier écran, débordement, effet de chaque bascule,
// mouvement réduit, mode présentation, page sans JavaScript, polices, contrastes.
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
  for (const etat of ['', 'projets=roue', 'projets=deux', 'chiffres=photo', 'chiffres=photo&structure=b', 'graphique=anneau', 'chiffres=liste', 'nav=centre&wordmark=playfair']) {
    const { p, ctx } = await ouvrir(etat, [w, h]);
    ok((await largeur(p)) === 0, `${w} · ${etat || 'défaut'}`); await ctx.close();
  }
}

console.log('\n3 · Chaque valeur de chaque bascule change le rendu (dans son contexte)');
const tests = [
  ['nav=centre', async p => { const r = await p.evaluate(() => document.querySelector('.site-nav').getBoundingClientRect()); return Math.abs((r.left + r.right) / 2 - 720) < 30; }],
  ['serif=source-serif', p => style(p, '.hero__title', 'fontFamily').then(v => /Source Serif 4/.test(v))],
  ['serif=literata', p => style(p, '.hero__title', 'fontFamily').then(v => /Literata/.test(v))],
  ['serif=playfair', p => style(p, '.hero__title', 'fontFamily').then(v => /Playfair/.test(v))],
  ['portee=rationnee', async p => /Inter/.test(await style(p, '.h2', 'fontFamily')) && /Newsreader/.test(await style(p, '.hero__title', 'fontFamily'))],
  ['sans=instrument', p => style(p, 'body', 'fontFamily').then(v => /Instrument Sans/.test(v))],
  ['wordmark=jost', async p => (await style(p, '.logo__texte', 'display')) !== 'none' && /Jost/.test(await style(p, '.logo__texte', 'fontFamily')) && (await style(p, '.logo__trace', 'display')) === 'none'],
  ['wordmark=source-serif', p => style(p, '.logo__texte', 'fontFamily').then(v => /Source Serif 4/.test(v))],
  ['wordmark=literata', p => style(p, '.logo__texte', 'fontFamily').then(v => /Literata/.test(v))],
  ['wordmark=playfair', p => style(p, '.logo__texte', 'fontFamily').then(v => /Playfair/.test(v))],
  ['phi=or', p => style(p, '.logo__mark', 'color').then(v => v === 'rgb(154, 122, 59)')],
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
  ['projets=roue', async p => (await style(p, '.roue', 'display')) === 'block' && (await style(p, '.four', 'display')) === 'none'],
  ['projets=deux', async p => (await style(p, '.roue', 'display')) === 'block' && (await style(p, '.four', 'display')) === 'grid'],
  ['projets=aucune', p => style(p, '.section--projets', 'display').then(v => v === 'none')],
  ['projets=roue&roue=mot', async p => (await style(p, '.roue__mot', 'display')) === 'block' && (await style(p, '.roue__phi', 'display')) === 'none'],
  ['projets=roue&roue=phrase', p => style(p, '.roue__phrase', 'display').then(v => v === 'block')],
  ['graphique=anneau', async p => (await style(p, '.ring', 'display')) === 'block' && (await style(p, '.bar__track', 'display')) === 'none'],
  ['logos=gris', p => style(p, '.partners', 'color').then(v => v === 'rgb(122, 116, 102)')],
  ['logos=couleur', async p => (await style(p, '.partner__couleur', 'display')) === 'block' && (await style(p, '.partner__encre', 'display')) === 'none'],
];
for (const [etat, test] of tests) {
  const { p, ctx } = await ouvrir(etat);
  let res = false; try { res = await test(p); } catch (e) { res = false; }
  ok(res, etat); await ctx.close();
}

console.log('\n4 · Mouvement réduit, présentation, sans JavaScript, polices');
{
  const { p, ctx } = await ouvrir('projets=roue', [1440, 900], { reducedMotion: 'reduce' });
  ok((await style(p, '.roue__disque', 'animationName')) === 'none' && (await style(p, '.roue__item', 'animationName')) === 'none', 'prefers-reduced-motion : la roue est immobile'); await ctx.close();
}
{
  const { p, ctx } = await ouvrir('projets=roue', [1440, 900], { reducedMotion: 'no-preference' });
  ok((await style(p, '.roue__disque', 'animationName')) === 'roue-tour', 'sans préférence : la roue tourne'); await ctx.close();
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

console.log('\n5 · Contrastes (WCAG) sur les fonds réels');
const lum = hex => { const c = hex.replace('#', ''); const [r, g, b] = [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contraste = (a, b) => { const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x); return ((l1 + 0.05) / (l2 + 0.05)).toFixed(2); };
const fonds = { blanc: '#FFFFFF', sable: '#F6F1E6', papier: '#F9F9F6' };
const encres = [['#26231F', 'anthracite (texte)'], ['#6B655C', 'gris (étiquettes < 18 px)'], ['#9A948A', 'gris clair (réservé ≥ 18 px)'], ['#9A7A3B', 'or mat (chiffres ≥ 40 px)'], ['#8A6B2F', 'or foncé (liens)'], ['#B8975A', 'or clair (filets seulement)'], ['#7A7466', 'gris chaud (logos)']];
for (const [hex, nom] of encres) console.log('  ' + nom.padEnd(30) + Object.entries(fonds).map(([f, h]) => `${f} ${contraste(hex, h)}:1`).join('   '));

await browser.close();
console.log(ko ? `\n${ko} vérification(s) en échec` : '\nTout est vérifié.');
process.exitCode = ko ? 1 : 0;
