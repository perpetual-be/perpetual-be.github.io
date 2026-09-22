// Génère les pages de la maquette du lot 2 (design/maquette/*.html) à partir des données du dépôt.
// Exécuter depuis la racine : node design/maquette/src/build.mjs
// Lit data/*.json, content/home.md, content/collectif.md, content/realisations.md, public/favicon.svg, public/partners/encre/*.svg (hauteurs des logos),
// design/maquette/src/carte/belgique.{svg,json}. N'écrit que dans design/maquette/.
// Aucune dépendance hors Node.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '..');            // design/maquette/
const REPO = path.resolve(HERE, '../../..');     // racine du dépôt
const IMG = '../directions/img';                 // photos réduites, relatif aux pages
const PARTNERS = '../../public/partners';        // logos, relatif aux pages
// Fins de ligne ramenées à \n : un clone Windows (core.autocrlf) livre les .md en CRLF, et « . » ne franchit pas un \r dans une expression régulière.
const read = f => fs.readFileSync(path.join(REPO, f), 'utf8').replace(/\r\n?/g, '\n');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------- données ----------
const site = JSON.parse(read('data/site.json'));
const projects = JSON.parse(read('data/projects.json'));
const partners = JSON.parse(read('data/partners.json'));
const byId = Object.fromEntries(projects.map(p => [p.id, p]));
// Libellé de l'entrée « réalisations » de la navigation et du plan du pied de page : data/site.json est la source unique (reprise par le site au lot 4).
const navLabel = href => { const n = site.nav.find(x => x.href === href); if (!n) throw new Error('data/site.json : entrée de navigation ' + href + ' introuvable'); return n.label; };
const REALISATIONS = navLabel('/realisations');

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
// Section Réalisations : le paragraphe est celui du programme agences (content/realisations.md), tel quel.
const realisationsBlocks = blocks(frontmatter(read('content/realisations.md')).body);
const agences = realisationsBlocks[realisationsBlocks.indexOf('## Le programme agences') + 1];
if (!agences || agences.startsWith('#')) throw new Error('content/realisations.md : paragraphe du programme agences introuvable');
// Bande des réalisations : une vignette par agence du programme (kind: agency) et par bien de la galerie (kind: gallery),
// photo <id>-01-s.jpg (800 px, design/directions/src/reduire-photos.mjs --petit), ville = dernier segment de l'adresse après
// la virgule, code postal retiré (→ « Bruxelles » pour wayez-27 et consolation).
const ville = p => p.address.split(',').pop().trim().replace(/^\d{4}\s+/, '');
const vignettes = projects.filter(p => p.kind === 'agency' || p.kind === 'gallery').map(p => ({ id: p.id, ville: ville(p), img: `${p.id}-01-s.jpg` }));
for (const v of vignettes) if (!fs.existsSync(path.join(REPO, 'design/directions/img', v.img))) console.warn('vignette absente :', v.img);

// Les quatre projets de la Home : une ligne chacun (mêmes lignes que la planche A), aperçu photo.
const four = [
  { id: 'ateliers-118', line: 'Molenbeek-Saint-Jean · 1 200 m² · Treize ateliers dans une ancienne usine de colle', img: 'ateliers-118-05-s.jpg', href: 'projets.html#ateliers-118' },
  { id: 'the-bank', line: 'Liège · 1 100 m² · Une agence devenue bijouterie, Bancontact et logements', img: 'the-bank-01-s.jpg', href: 'projet-the-bank.html' },
  { id: 'data-box', line: 'Jemelle · 4 200 m² sur un hectare · Un site technique dont l’avenir reste ouvert', img: 'data-box-02-s.jpg', href: 'projets.html#data-box' },
  { id: 'community', line: 'Uccle · 14 unités · Quatorze unités autour d’espaces partagés', img: 'community-05-s.jpg', href: 'projets.html#community' },
];

// Structure E (bascule 9 sur « photo ») : les photos candidates de la bascule 9b, en 1800 px (<nom>.jpg) puis 2800 px (<nom>-l.jpg) pour les grands écrans ;
// le srcset porte la largeur réelle de chaque fichier, lue dans l'en-tête JPEG. Les versions se génèrent depuis l'original avec
// design/directions/src/reduire-photos.mjs --grand --tres-grand ; tant qu'elles manquent, la page se replie sur <nom>-s.jpg (800 px).
function jpegWidth(file) {
  const b = fs.readFileSync(file);
  for (let i = 2; i < b.length - 9;) {
    if (b[i] !== 0xFF) { i++; continue; }
    const m = b[i + 1];
    if (m === 0xFF) { i++; continue; }
    if (m === 0xD8 || m === 0x01 || (m >= 0xD0 && m <= 0xD7)) { i += 2; continue; }
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) return b.readUInt16BE(i + 7); // SOFn : longueur, précision, hauteur, largeur
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}
// Chaque photo déclare son point focal (object-position, posé en style sur l'<img>, vaut aussi sur téléphone) et le côté de l'accroche
// quand la bascule 9d est sur « auto » (gauche / droite ; build.mjs en tire les règles de la balise <style> du premier écran).
// La première entrée est le défaut de la bascule 9b. Ne jamais retourner une photo en miroir : on déplace l'accroche, pas l'image.
const photoCandidates = [
  { key: 'data-box-03', focal: '50% 18%', accroche: 'gauche', files: ['data-box-03.jpg', 'data-box-03-l.jpg'] },   // la forêt à gauche
  { key: 'community-05', focal: '50% 50%', accroche: 'droite', files: ['community-05.jpg', 'community-05-l.jpg'] }, // le bardage noir à droite
].map(c => {
  const chemin = f => path.join(REPO, 'design/directions/img', f);
  const sources = c.files.filter(f => fs.existsSync(chemin(f)) || (console.warn('photo absente :', f), false)).map(f => ({ file: f, width: jpegWidth(chemin(f)) }));
  if (!sources.length) { console.warn(`${c.key} : repli sur ${c.key}-s.jpg (800 px)`); sources.push({ file: `${c.key}-s.jpg`, width: jpegWidth(chemin(`${c.key}-s.jpg`)) }); }
  return { key: c.key, focal: c.focal, accroche: c.accroche, sources };
});

// ---------- logos ----------
// Figés en couleur le 22/09 (bascule 14 retirée) : <img> de public/partners/couleur/. La hauteur de chaque logo se calcule à la masse visuelle
// sur le viewBox du fichier encre (mêmes canevas) : 34 px × √(291 / largeur du viewBox), bornée 34–60 px
// (les canevas font 100 de haut ; Batopin, 291 de large, est l'étalon à 34 px). Posée en --logo-h sur le <li>.
function partnerHeight(file) {
  const svg = fs.readFileSync(path.join(REPO, 'public/partners/encre', path.basename(file)), 'utf8');
  const w = Number(svg.match(/viewBox="0 0 ([\d.]+) 100"/)[1]);
  return Math.min(60, Math.max(34, Math.round(34 * Math.sqrt(291 / w))));
}
const partnersHtml = partners.map(p =>
  `<li class="partner" style="--logo-h:${partnerHeight(p.logoInk)}px" title="${esc(p.name)}"><img class="partner__couleur" src="${PARTNERS}/couleur/${path.basename(p.logo)}" alt="${esc(p.name)}" loading="lazy"></li>`
).join('\n');

const markPath = read('public/favicon.svg').match(/<g[\s\S]*<\/g>/)[0];
const phiSymbol = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="phi" viewBox="0 0 100 104.02">${markPath}</symbol></svg>`;
const phi = (cls) => `<svg class="${cls}" aria-hidden="true"><use href="#phi"/></svg>`;

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
${title.page === 'home' ? accrocheAuto() + '\n' : ''}<link rel="icon" href="../../public/favicon.svg">
</head>
<body>
${phiSymbol}`;
}

function header(active = '') {
  const a = k => active === k ? ' class="trait is-active"' : ' class="trait"';
  return `<header class="site-header">
  <a class="logo" href="index.html" aria-label="Perpetual">${phi('logo__mark')}<span class="logo__texte">Perpetual</span></a>
  <nav class="site-nav" aria-label="Navigation"><a href="projets.html"${a('projets')}>${esc(REALISATIONS)}</a><a href="#"${a('engagements')}>Engagements</a><a href="#contact" class="trait">Contact</a></nav>
</header>`;
}

const statsList = () => `<ol class="stats">${stats.map(s => `<li class="stat"><span class="stat__value">${esc(s.value)}</span><span class="stat__label">${esc(s.label)}</span></li>`).join('')}</ol>`;

function deco() {
  const arcL = 'M 0 200 A 520 520 0 0 1 180 0', arcR = 'M 420 20 A 520 520 0 0 1 240 220';
  return `<div class="deco" aria-hidden="true">
    <svg class="deco__svg deco__l deco--arcs" viewBox="0 0 420 220" preserveAspectRatio="xMinYMid slice"><path d="${arcL}" fill="none" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>
    <svg class="deco__svg deco__r deco--arcs" viewBox="0 0 420 220" preserveAspectRatio="xMaxYMid slice"><path d="${arcR}" fill="none" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>
    <svg class="deco__svg deco__r deco--anneaux" viewBox="0 0 420 220" preserveAspectRatio="xMaxYMid meet"><circle cx="270" cy="110" r="110" fill="none" stroke="currentColor" stroke-width="1"/><circle class="deco__2" cx="270" cy="110" r="150" fill="none" stroke="currentColor" stroke-width="1"/></svg>
  </div>`;
}

// Premier écran : structure E (bascule 9, défaut), structure colonnes (?ecran=colonnes) ou structure F (?ecran=photo-bande) — même HTML, le CSS replace
// les enfants de .hero (display:contents sur .hero__grid, sauf en colonnes) et montre .hero__photo (masqué en structure colonnes : ses images en
// chargement paresseux n'y sont pas demandées). La bande des chiffres est un enfant de .hero, après le bloc titre/texte/signature : en colonnes et
// en structure E elle suit son ordre naturel (après les paragraphes) ; en structure F, le CSS la remonte juste après la photo, avant les paragraphes.
// Bascule 9d sur « auto » (sans attribut data-accroche) : le côté de l'accroche suit la photo affichée, tel que photoCandidates le déclare.
// Les deux côtés sont décrits par des variables dans maquette.css (--accroche-align, --voile-coin) ; ici, seulement l'aiguillage photo → côté.
const COTES = { gauche: '--accroche-align:left;--voile-coin:0 0', droite: '--accroche-align:right;--voile-coin:100% 0' };
function accrocheAuto() {
  const sel = (c, i) => `html:not([data-accroche])${i === 0 ? `:is(:not([data-photo]),[data-photo="${c.key}"])` : `[data-photo="${c.key}"]`}`;
  return `<style>/* 9d · accroche « auto » : côté déclaré par photo dans photoCandidates (build.mjs) */\n${photoCandidates.map((c, i) => {
    if (!COTES[c.accroche]) throw new Error(`${c.key} : côté d'accroche inconnu « ${c.accroche} »`);
    return `${sel(c, i)}{${COTES[c.accroche]}}`;
  }).join('\n')}</style>`;
}

function lead() {
  return `<section class="hero">
<div class="hero__photo" aria-hidden="true">
  ${photoCandidates.map(c => `<img data-photo="${c.key}" style="object-position:${c.focal}" src="${IMG}/${c.sources[0].file}"${c.sources.length > 1 ? ` srcset="${c.sources.map(s => `${IMG}/${s.file} ${s.width}w`).join(', ')}" sizes="100vw"` : ''} alt="" loading="lazy" decoding="async">`).join('\n  ')}
</div>
<div class="container hero__grid">
  <h1 class="hero__title"><span>${home.h1}</span></h1>
  <p class="signature">${home.signature}</p>
  <div class="hero__text">${home.paragraphs.map(p => `<p>${p}</p>`).join('')}</div>
</div>
<section class="band stats-band" aria-label="Chiffres clés">${deco()}<div class="container">${statsList()}</div></section>
</section>`;
}

function chart() {
  return `<section class="section section--chart"><div class="container">
  <h2 class="h2">${esc(portfolio.title)}</h2>
  <div class="bars">${portfolio.items.map(i => `<div class="bar"><span class="bar__label">${esc(i.label)}</span><span class="bar__track"><span class="bar__fill" style="width:${i.percent}%"></span></span><span class="bar__value">${i.percent} %</span></div>`).join('')}</div>
</div></section>`;
}

function projets() {
  const rows = four.map((f, i) => `<li class="four__row${i === 0 ? ' is-active' : ''}" data-index="${i}"><a href="${f.href}"><span class="four__name">${esc(byId[f.id].name)}</span><span class="four__line">${esc(f.line)}</span></a></li>`).join('\n      ');
  const previews = four.map((f, i) => `<img${i === 0 ? ' class="is-active"' : ' loading="lazy"'} src="${IMG}/${f.img}" alt="" decoding="async">`).join('');
  return `<section class="section section--projets" id="projets"><div class="container">
  <p class="eyebrow">Réalisations</p>
  <div class="four">
    <ol class="four__list">
      ${rows}
    </ol>
    <div class="four__preview" aria-hidden="true">${previews}</div>
  </div>
</div></section>`;
}

// Carte des réalisations : src/carte/belgique.svg (contour, 17 points, 17 étiquettes placées à la main ; les quatre adresses bruxelloises
// — groupe « Bruxelles » de belgique.json — sont un seul point plus gros, r 6,5, nommé comme l'étiquette). Chaque étiquette est regroupée
// avec son point (même nom, ou membre de son groupe) dans un <g class="carte__lieu"> : le survol d'un point colore l'étiquette en CSS seul
// (les villes sont figées sur « toutes », visibles sans survol). data-rang="1" sur une étiquette du SVG la garde visible sur mobile.
function carteSvg() {
  const svg = fs.readFileSync(path.join(HERE, 'carte/belgique.svg'), 'utf8').replace(/<!--[\s\S]*?-->\s*/g, '');
  const groupes = JSON.parse(fs.readFileSync(path.join(HERE, 'carte/belgique.json'), 'utf8')).groupes;
  const ouverture = svg.match(/<svg[^>]*>/)[0];
  const pays = svg.match(/<path class="carte__pays"[^>]*\/>/)[0];
  const points = [...svg.matchAll(/<circle[^>]*>\s*<title>([^<]*)<\/title>\s*<\/circle>/g)].map(m => ({ nom: m[1], html: m[0] }));
  const etiquettes = [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(m => ({ nom: m[1], html: m[0] }));
  const membres = nom => (groupes.find(g => g.nom === nom) || { membres: [nom] }).membres;
  const lieux = etiquettes.map(e => {
    const pts = points.filter(p => p.nom === e.nom || membres(e.nom).includes(p.nom));
    if (!pts.length) throw new Error('carte : aucun point pour l’étiquette ' + e.nom);
    return `<g class="carte__lieu" data-lieu="${esc(e.nom)}">${pts.map(p => p.html).join('')}${e.html}</g>`;
  });
  const orphelins = points.filter(p => !etiquettes.some(e => e.nom === p.nom || membres(e.nom).includes(p.nom)));
  if (orphelins.length) throw new Error('carte : points sans étiquette : ' + orphelins.map(p => p.nom).join(', '));
  console.log(`carte : ${points.length} points, ${etiquettes.length} étiquettes`);
  return `${ouverture}\n${pays}\n${lieux.join('\n')}\n</svg>`;
}

// Section Réalisations (bascule 15) : la carte (défaut) avec le texte à droite, ou la bande de vignettes qui défile ;
// les deux sont dans la page, le CSS montre l'une ou l'autre. Indépendante de la bascule 11.
function autres() {
  const item = v => `<li class="bande__item"><img src="${IMG}/${v.img}" alt="" loading="lazy" decoding="async"><span class="bande__ville">${esc(v.ville)}</span></li>`;
  return `<section class="section section--autres" id="realisations">
<div class="container">
  <p class="eyebrow">Réalisations</p>
  <a class="autres__tous trait" href="projets.html">Toutes les réalisations →</a>
  <div class="carte">
    <div class="carte__fig">${carteSvg()}</div>
    <div class="carte__texte">
      <h2 class="h2">Vingt adresses, de Haaltert à Welkenraedt.</h2>
      <p>${agences}</p>
      <a class="autres__lien trait" href="projets.html">Toutes les réalisations →</a>
    </div>
  </div>
</div>
<div class="bande" aria-label="Seize réalisations en photo">
  <ul class="bande__piste">${vignettes.map(item).join('')}${vignettes.map(v => item(v).replace('<li class="bande__item">', '<li class="bande__item" aria-hidden="true">')).join('')}</ul>
</div>
</section>`;
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
  <nav class="footer__nav" aria-label="Plan du site"><a class="trait" href="projets.html">${esc(REALISATIONS)}</a><a class="trait" href="#collectif">Collectif</a><a class="trait" href="#">Engagements</a><a class="trait" href="#">Mentions légales</a><a class="trait" href="#">Confidentialité</a></nav>
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
  'index.html': () => head({ page: 'home', text: `${site.name} — ${site.tagline}` }) + '\n' + header('') + '\n<main>\n' + lead() + '\n' + chart() + '\n' + projets() + '\n' + autres() + '\n' + collectifBlock() + '\n</main>\n' + footer(),
};

for (const [name, render] of Object.entries(pages)) {
  const html = render();
  fs.writeFileSync(path.join(OUT, name), html);
  console.log('écrit', name, Math.round(html.length / 1024) + ' Ko');
}
