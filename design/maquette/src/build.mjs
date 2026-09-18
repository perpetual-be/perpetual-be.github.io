// Génère les pages de la maquette du lot 2 (design/maquette/*.html) à partir des données du dépôt.
// Exécuter depuis la racine : node design/maquette/src/build.mjs
// Lit data/*.json, content/home.md, content/collectif.md, public/favicon.svg, public/partners/encre/*.svg
// et design/directions/src/wordmark-mask.png. N'écrit que dans design/maquette/. Aucune dépendance hors Node.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '..');            // design/maquette/
const REPO = path.resolve(HERE, '../../..');     // racine du dépôt
const IMG = '../directions/img';                 // photos réduites, relatif aux pages
const PARTNERS = '../../public/partners';        // logos, relatif aux pages
const read = f => fs.readFileSync(path.join(REPO, f), 'utf8');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------- données ----------
const site = JSON.parse(read('data/site.json'));
const projects = JSON.parse(read('data/projects.json'));
const partners = JSON.parse(read('data/partners.json'));
const byId = Object.fromEntries(projects.map(p => [p.id, p]));

function frontmatter(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return { fm: m ? m[1] : '', body: md.slice(m ? m[0].length : 0) };
}
function blocks(body) {
  return body.replace(/<!--[\s\S]*?-->/g, '').split(/\r?\n\s*\r?\n/).map(s => s.trim()).filter(Boolean);
}
const homeMd = frontmatter(read('content/home.md'));
const stats = [...homeMd.fm.matchAll(/-\s+value:\s*"?([^"\n]+?)"?\s*\n\s+label:\s*(.+)/g)].map(x => ({ value: x[1].trim(), label: x[2].trim() }));
const portfolio = {
  title: (homeMd.fm.match(/portfolio:\s*\n\s+title:\s*(.+)/) || [])[1].trim(),
  items: [...homeMd.fm.matchAll(/-\s+label:\s*(.+)\n\s+percent:\s*(\d+)/g)].map(x => ({ label: x[1].trim(), percent: Number(x[2]) })),
};
const homeBlocks = blocks(homeMd.body);
const home = {
  h1: homeBlocks.find(b => b.startsWith('# ')).slice(2).trim(),
  paragraphs: homeBlocks.filter(b => !b.startsWith('# ')).slice(0, -1),
  signature: homeBlocks[homeBlocks.length - 1],
};
const collectifBlocks = blocks(frontmatter(read('content/collectif.md')).body);
const collectif = { paragraphs: collectifBlocks.slice(0, -1), chute: collectifBlocks[collectifBlocks.length - 1] };

// Les quatre projets de la Home : une ligne chacun (mêmes lignes que la planche A), aperçu photo.
const four = [
  { id: 'ateliers-118', line: 'Molenbeek-Saint-Jean · 1 200 m² · Treize ateliers dans une ancienne usine de colle', img: 'ateliers-118-05-s.jpg', href: 'projets.html#ateliers-118' },
  { id: 'the-bank', line: 'Liège · 1 100 m² · Une agence devenue bijouterie, Bancontact et logements', img: 'the-bank-01-s.jpg', href: 'projet-the-bank.html' },
  { id: 'data-box', line: 'Jemelle · 4 200 m² sur un hectare · Un site technique dont l’avenir reste ouvert', img: 'data-box-02-s.jpg', href: 'projets.html#data-box' },
  { id: 'community', line: 'Uccle · 14 unités · Quatorze unités autour d’espaces partagés', img: 'community-05-s.jpg', href: 'projets.html#community' },
];

// La roue : les quatre agences du programme et quatre biens de la galerie.
const roue = [
  { id: 'bnp-braine-le-comte', href: 'projets.html#programme' },
  { id: 'bnp-pont-a-celles', href: 'projets.html#programme' },
  { id: 'bnp-jambes', href: 'projets.html#programme' },
  { id: 'belfius-mettet', href: 'projets.html#programme' },
  { id: 'waremme', href: 'projets.html#galerie' },
  { id: 'gilly', href: 'projets.html#galerie' },
  { id: 'ing-tervuren', href: 'projets.html#galerie' },
  { id: 'ing-landen', href: 'projets.html#galerie' },
].map(r => ({ ...r, img: `${r.id}-01-s.jpg`, p: byId[r.id] }));
for (const r of roue) if (!fs.existsSync(path.join(REPO, 'design/directions/img', r.img))) console.warn('photo absente :', r.img);

// Chiffres sur photo : les candidates de la bascule 9.
const photoCandidates = [
  { key: 'community-05', file: 'community-05.jpg' },
  { key: 'data-box-02', file: 'data-box-02-s.jpg' },
  { key: 'the-bank-01', file: 'the-bank-01.jpg' },
  { key: 'the-bank-03', file: 'the-bank-03.jpg' },
];

// Phrase courte du centre de la roue : les mots de Julien (Ateliers 118, « ce que nous y avons vu »).
const phraseRoue = byId['ateliers-118'].saw.split(' ;')[0] + '.';

// ---------- logos ----------
function partnerSvg(file) {
  let s = fs.readFileSync(path.join(REPO, 'public/partners/encre', path.basename(file)), 'utf8');
  s = s.replace(/<\?xml[^>]*>/, '').replace(/<metadata>[\s\S]*?<\/metadata>/g, '').replace(/\sxmlns:c2pa="[^"]*"/, '');
  s = s.replace(/\swidth="[^"]*"/, '').replace(/\sheight="[^"]*"/, '').replace('<svg', '<svg class="partner__encre" aria-hidden="true"');
  return s.trim();
}
const partnersHtml = partners.map(p => `<li class="partner" title="${esc(p.name)}">${partnerSvg(p.logoInk)}<img class="partner__couleur" src="${PARTNERS}/couleur/${path.basename(p.logo)}" alt="${esc(p.name)}" loading="lazy"></li>`).join('\n');

const markPath = read('public/favicon.svg').match(/<g[\s\S]*<\/g>/)[0];
const phiSymbol = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="phi" viewBox="0 0 100 104.02">${markPath}</symbol></svg>`;
const phi = (cls) => `<svg class="${cls}" aria-hidden="true"><use href="#phi"/></svg>`;
const maskData = 'data:image/png;base64,' + fs.readFileSync(path.resolve(REPO, 'design/directions/src/wordmark-mask.png')).toString('base64');

// ---------- fragments ----------
const stateScript = `<script>(function(){var p=new URLSearchParams(location.search),h=document.documentElement;p.forEach(function(v,k){if(/^[a-z][a-z-]*$/.test(k)&&/^[a-z0-9-]*$/.test(v))h.setAttribute('data-'+k,v)})})();</script>`;

function head(title) {
  return `<!doctype html>
<html lang="fr" data-page="${title.page}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title.text)}</title>
${stateScript}
<link rel="stylesheet" href="maquette.css">
<style>:root{--wordmark-mask:url("${maskData}")}</style>
<link rel="icon" href="../../public/favicon.svg">
</head>
<body>
${phiSymbol}`;
}

function header(active = '') {
  const a = k => active === k ? ' class="trait is-active"' : ' class="trait"';
  return `<header class="site-header">
  <a class="logo" href="index.html" aria-label="Perpetual">${phi('logo__mark')}<span class="logo__trace" role="img" aria-label="Perpetual"></span><span class="logo__texte" aria-hidden="true">Perpetual</span></a>
  <nav class="site-nav" aria-label="Navigation"><a href="projets.html"${a('projets')}>Projets</a><a href="#"${a('engagements')}>Engagements</a><a href="#contact" class="trait">Contact</a></nav>
</header>`;
}

const statsList = (cls = '') => `<ol class="stats${cls}">${stats.map(s => `<li class="stat"><span class="stat__value">${esc(s.value)}</span><span class="stat__label">${esc(s.label)}</span></li>`).join('')}</ol>`;

function deco() {
  const arcL = 'M 0 200 A 520 520 0 0 1 180 0', arcR = 'M 420 20 A 520 520 0 0 1 240 220';
  return `<div class="deco" aria-hidden="true">
    <svg class="deco__svg deco__l deco--arcs" viewBox="0 0 420 220" preserveAspectRatio="xMinYMid slice"><path d="${arcL}" fill="none" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>
    <svg class="deco__svg deco__r deco--arcs" viewBox="0 0 420 220" preserveAspectRatio="xMaxYMid slice"><path d="${arcR}" fill="none" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>
    <svg class="deco__svg deco__phi deco--phi" viewBox="0 0 100 104.02"><use href="#phi"/></svg>
    <svg class="deco__svg deco__r deco--anneaux" viewBox="0 0 420 220" preserveAspectRatio="xMaxYMid meet"><circle cx="270" cy="110" r="110" fill="none" stroke="currentColor" stroke-width="1"/><circle class="deco__2" cx="270" cy="110" r="150" fill="none" stroke="currentColor" stroke-width="1"/></svg>
  </div>`;
}

function lead() {
  return `<div class="lead">
<section class="hero"><div class="container hero__grid">
  <h1 class="hero__title"><span>${home.h1}</span></h1>
  <p class="signature">${home.signature}</p>
  <div class="hero__text">${home.paragraphs.map(p => `<p>${p}</p>`).join('')}</div>
</div></section>
<section class="band stats-band" aria-label="Chiffres clés">${deco()}<div class="container">${statsList()}</div></section>
<section class="stats-photo" aria-label="Chiffres clés">
  ${photoCandidates.map(c => `<img class="stats-photo__img" data-photo="${c.key}" src="${IMG}/${c.file}" alt="" loading="lazy" decoding="async">`).join('\n  ')}
  <div class="container stats-photo__in">${statsList(' stats--photo')}</div>
</section>
</div>`;
}

function ringSvg(items) {
  const gap = 1.4; let start = 0;
  const arcs = items.map(i => {
    const len = i.percent - gap;
    const c = `<circle cx="120" cy="120" r="100" fill="none" stroke="currentColor" stroke-width="22" pathLength="100" stroke-dasharray="${len} ${100 - len}" stroke-dashoffset="${-(start + gap / 2)}"/>`;
    start += i.percent; return c;
  }).join('');
  return `<svg class="ring" viewBox="0 0 240 240" aria-hidden="true"><g transform="rotate(-90 120 120)">${arcs}</g></svg>`;
}

function chart() {
  return `<section class="section section--chart"><div class="container">
  <h2 class="h2">${esc(portfolio.title)}</h2>
  <div class="chart">${ringSvg(portfolio.items)}<div class="bars">${portfolio.items.map(i => `<div class="bar"><span class="bar__label">${esc(i.label)}</span><span class="bar__track"><span class="bar__fill" style="width:${i.percent}%"></span></span><span class="bar__value">${i.percent} %</span></div>`).join('')}</div></div>
</div></section>`;
}

function projets() {
  const rows = four.map((f, i) => `<li class="four__row${i === 0 ? ' is-active' : ''}" data-index="${i}"><a href="${f.href}"><span class="four__name">${esc(byId[f.id].name)}</span><span class="four__line">${esc(f.line)}</span></a></li>`).join('\n      ');
  const previews = four.map((f, i) => `<img${i === 0 ? ' class="is-active"' : ' loading="lazy"'} src="${IMG}/${f.img}" alt="" decoding="async">`).join('');
  const slots = roue.map((r, i) => `<div class="roue__slot" style="--i:${i}"><a class="roue__item" href="${r.href}" title="${esc(r.p.name)} · ${esc(r.p.location)}"><img src="${IMG}/${r.img}" alt="${esc(r.p.name)} · ${esc(r.p.location)}" loading="lazy" decoding="async"></a></div>`).join('\n      ');
  return `<section class="section section--projets" id="projets"><div class="container">
  <p class="eyebrow">Projets</p>
  <div class="four">
    <ol class="four__list">
      ${rows}
    </ol>
    <div class="four__preview" aria-hidden="true">${previews}</div>
  </div>
  <div class="roue" aria-label="Huit projets">
    <div class="roue__disque">
      ${slots}
    </div>
    <div class="roue__centre">${phi('roue__phi')}<span class="roue__mot">Projets</span><span class="roue__phrase">${esc(phraseRoue)}</span></div>
  </div>
</div></section>`;
}

function collectifBlock() {
  return `<section class="section section--collectif" id="collectif"><div class="container">
  <p class="eyebrow">Collectif</p>
  <div class="collectif__text">${collectif.paragraphs.map(p => `<p>${p}</p>`).join('')}<p class="chute">${collectif.chute}</p></div>
  <ul class="partners" aria-label="Partenaires">
${partnersHtml}
  </ul>
</div></section>`;
}

function footer() {
  return `<footer class="site-footer" id="contact"><div class="container footer__grid">
  <div class="footer__contact"><p class="footer__name">Julien De Dobbeleer</p><a class="footer__mail" href="mailto:${site.email}">${site.email}</a><p class="footer__addr">${site.name}, ${site.city}</p></div>
  <nav class="footer__nav" aria-label="Plan du site"><a class="trait" href="projets.html">Projets</a><a class="trait" href="#collectif">Collectif</a><a class="trait" href="#">Engagements</a><a class="trait" href="#">Mentions légales</a><a class="trait" href="#">Confidentialité</a></nav>
  <blockquote class="footer__quote"><p>« ${site.quote.text} »</p><cite>${site.quote.author}</cite></blockquote>
  <p class="footer__legal">© 2026 ${site.name}</p>
</div></footer>
<script src="maquette.js" defer></script>
</body>
</html>
`;
}

// ---------- pages ----------
const pages = {
  'index.html': () => head({ page: 'home', text: `${site.name} — ${site.tagline}` }) + '\n' + header('') + '\n<main>\n' + lead() + '\n' + chart() + '\n' + projets() + '\n' + collectifBlock() + '\n</main>\n' + footer(),
};

for (const [name, render] of Object.entries(pages)) {
  const html = render();
  fs.writeFileSync(path.join(OUT, name), html);
  console.log('écrit', name, Math.round(html.length / 1024) + ' Ko');
}
