// Génère les pages de la maquette du lot 2 (design/maquette/*.html : la Home, la fiche The Bank, la vue Réalisations) à partir des données du dépôt.
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
const PAGE_REALISATIONS = 'realisations.html';   // la vue « Réalisations » (le brief la nommait « Projets »)
const PAGE_FICHE = 'projet-the-bank.html';

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

// Les quatre projets (Home et vue Réalisations) : une ligne chacun (mêmes lignes que la planche A), aperçu photo (img, portrait 4:5) et photo
// de carte (carte, 3:2 — Ateliers 118 n'a que sa vue 05, en portrait, dans design/directions/img/ ; elle est recadrée). The Bank pointe vers sa fiche,
// les trois autres vers leur ancre sur la vue Réalisations.
const four = [
  { id: 'ateliers-118', line: 'Molenbeek-Saint-Jean · 1 200 m² · Treize ateliers dans une ancienne usine de colle', img: 'ateliers-118-05-s.jpg', carte: 'ateliers-118-05-s.jpg', href: `${PAGE_REALISATIONS}#ateliers-118` },
  { id: 'the-bank', line: 'Liège · 1 100 m² · Une agence devenue bijouterie, Bancontact et logements', img: 'the-bank-01-s.jpg', carte: 'the-bank-03-s.jpg', href: PAGE_FICHE },
  { id: 'data-box', line: 'Jemelle · 4 200 m² sur un hectare · Un site technique dont l’avenir reste ouvert', img: 'data-box-02-s.jpg', carte: 'data-box-02-s.jpg', href: `${PAGE_REALISATIONS}#data-box` },
  { id: 'community', line: 'Uccle · 14 unités · Quatorze unités autour d’espaces partagés', img: 'community-05-s.jpg', carte: 'community-05-s.jpg', href: `${PAGE_REALISATIONS}#community` },
];
// Le programme agences (kind agency, dans l'ordre) et la galerie (kind gallery, dans l'ordre) : data/projects.json.
const agencesListe = projects.filter(p => p.kind === 'agency').sort((a, b) => a.order - b.order);
const galerie = projects.filter(p => p.kind === 'gallery').sort((a, b) => a.order - b.order);
// Fiche The Bank : la bande de trois faits (comme la planche A), les photos intercalées (01 portrait, 02 paysage) et leurs légendes, le projet suivant.
// Les légendes ne sont pas dans data/projects.json (pas de captions pour the-bank) : elles décrivent la photo, sans rien ajouter, à confirmer au lot 3.
const bank = byId['the-bank'];
const fiche = {
  projet: bank,
  faits: [['Localisation', 'Liège'], ['Surface', bank.surface], ['Usage', 'Logements & commerce']],
  hero: 'the-bank-03',
  photos: [{ key: 'the-bank-01', legende: 'La façade, rue des Mineurs', sizes: '(max-width:640px) 100vw, 460px' }, { key: 'the-bank-02', legende: 'Le point Bancontact', sizes: '(max-width:640px) 100vw, 660px' }],
  chapitres: [['Ce que c’était', bank.was], ['Ce que nous y avons vu', bank.saw], ['Ce que c’est devenu', bank.became]],
  suivant: { projet: byId['data-box'], href: `${PAGE_REALISATIONS}#data-box` },
};

// Premier écran (structure F, figée le 23/09) : la photo, en 1800 px (<nom>.jpg) puis 2800 px (<nom>-l.jpg) pour les grands écrans ;
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
// La photo déclare son point focal (object-position, posé en style sur l'<img>, vaut aussi sur téléphone). Figée le 23/09 sur Community 05,
// accroche à gauche (bascules 9b et 9d retirées ; data-box-03 reste dans design/directions/img/). Le cadrage de Community 05 se choisit
// avec la bascule temporaire 9c (maquette.css) : la valeur retenue remplacera ce focal, et la bascule disparaîtra.
// Sources d'une photo : <clé>.jpg (1800 px) et <clé>-l.jpg (2800 px) quand ils existent, sinon repli sur <clé>-s.jpg (800 px).
function photoSources(key) {
  const chemin = f => path.join(REPO, 'design/directions/img', f);
  const sources = [`${key}.jpg`, `${key}-l.jpg`].filter(f => fs.existsSync(chemin(f))).map(f => ({ file: f, width: jpegWidth(chemin(f)) }));
  if (!sources.length) { console.warn(`${key} : repli sur ${key}-s.jpg (800 px)`); sources.push({ file: `${key}-s.jpg`, width: jpegWidth(chemin(`${key}-s.jpg`)) }); }
  return sources;
}
// <img> avec srcset quand plusieurs tailles existent ; attrs : attributs supplémentaires, déjà échappés.
function photoImg(key, sizes, attrs = '') {
  const sources = photoSources(key);
  return `<img src="${IMG}/${sources[0].file}"${sources.length > 1 ? ` srcset="${sources.map(s => `${IMG}/${s.file} ${s.width}w`).join(', ')}" sizes="${sizes}"` : ''} alt="" decoding="async"${attrs}>`;
}
const photoCandidates = [
  { key: 'community-05', focal: '50% 50%' },
].map(c => ({ key: c.key, focal: c.focal, sources: photoSources(c.key) }));

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
<link rel="icon" href="../../public/favicon.svg">
</head>
<body>
${phiSymbol}`;
}

function header(active = '') {
  const a = k => active === k ? ' class="trait is-active"' : ' class="trait"';
  return `<header class="site-header">
  <a class="logo" href="index.html" aria-label="Perpetual">${phi('logo__mark')}<span class="logo__texte">Perpetual</span></a>
  <nav class="site-nav" aria-label="Navigation"><a href="${PAGE_REALISATIONS}"${a('realisations')}>${esc(REALISATIONS)}</a><a href="#"${a('engagements')}>Engagements</a><a href="#contact" class="trait">Contact</a></nav>
</header>`;
}

const statsList = () => `<ol class="stats">${stats.map(s => `<li class="stat"><span class="stat__value">${esc(s.value)}</span><span class="stat__label">${esc(s.label)}</span></li>`).join('')}</ol>`;

// Élément de la bande : les anneaux, figés le 23/09 (les deux arcs et « rien » sont retirés).
function deco() {
  return `<div class="deco" aria-hidden="true">
    <svg class="deco__svg deco--anneaux" viewBox="0 0 420 220" preserveAspectRatio="xMaxYMid meet"><circle cx="270" cy="110" r="110" fill="none" stroke="currentColor" stroke-width="1"/><circle class="deco__2" cx="270" cy="110" r="150" fill="none" stroke="currentColor" stroke-width="1"/></svg>
  </div>`;
}

// Premier écran, structure F (figée le 23/09 ; structures E et colonnes retirées) : le CSS replace les enfants de .hero (display:contents sur
// .hero__grid) et remonte la bande des chiffres juste après la photo, avant les paragraphes. Gel du 23/09 : le premier paragraphe à gauche,
// le second à droite avec la signature dessous (.hero__col), les deux colonnes s'équilibrent.
function lead() {
  return `<section class="hero">
<div class="hero__photo" aria-hidden="true">
  ${photoCandidates.map(c => `<img data-photo="${c.key}" style="object-position:${c.focal}" src="${IMG}/${c.sources[0].file}"${c.sources.length > 1 ? ` srcset="${c.sources.map(s => `${IMG}/${s.file} ${s.width}w`).join(', ')}" sizes="100vw"` : ''} alt="" loading="lazy" decoding="async">`).join('\n  ')}
</div>
<div class="container hero__grid">
  <h1 class="hero__title"><span>${home.h1}</span></h1>
  <div class="hero__text"><p>${home.paragraphs[0]}</p><div class="hero__col">${home.paragraphs.slice(1).map(p => `<p>${p}</p>`).join('')}<p class="signature">${home.signature}</p></div></div>
</div>
<section class="band stats-band" aria-label="Chiffres clés">${deco()}<div class="container">${statsList()}</div></section>
</section>`;
}

function chart() {
  return `<section class="section section--chart"><div class="container">
  <h2 class="h2 h2--sans">${esc(portfolio.title)}</h2>
  <div class="bars">${portfolio.items.map(i => `<div class="bar"><span class="bar__label">${esc(i.label)}</span><span class="bar__track"><span class="bar__fill" style="width:${i.percent}%"></span></span><span class="bar__value">${i.percent} %</span></div>`).join('')}</div>
</div></section>`;
}

// La liste des quatre : sur la Home, et sur la vue Réalisations où chaque ligne porte l'ancre du projet (ancres = true ; The Bank n'en a pas,
// sa fiche est la cible). data-ancre sert à maquette.js pour déplacer l'ancre sur la carte quand la bascule 21 est sur « cartes ».
function fourList(ancres = false) {
  const rows = four.map((f, i) => `<li class="four__row${i === 0 ? ' is-active' : ''}" data-index="${i}"${ancres && f.href !== PAGE_FICHE ? ` id="${f.id}" data-ancre="${f.id}"` : ''}><a href="${f.href}"><span class="four__name">${esc(byId[f.id].name)}</span><span class="four__line">${esc(f.line)}</span></a></li>`).join('\n      ');
  const previews = four.map((f, i) => `<img${i === 0 ? ' class="is-active"' : ' loading="lazy"'} src="${IMG}/${f.img}" alt="" decoding="async">`).join('');
  return `<div class="four">
    <ol class="four__list">
      ${rows}
    </ol>
    <div class="four__preview" aria-hidden="true">${previews}</div>
  </div>`;
}
function projets() {
  return `<section class="section section--projets" id="projets"><div class="container">
  <p class="eyebrow">Réalisations</p>
  ${fourList()}
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

// Section Réalisations : la carte, avec le texte à droite (figée le 23/09 ; la bande de vignettes et « aucune » sont retirées).
function autres() {
  return `<section class="section section--autres" id="realisations">
<div class="container">
  <p class="eyebrow">Réalisations</p>
  <div class="carte">
    <div class="carte__fig">${carteSvg()}</div>
    <div class="carte__texte">
      <h2 class="h2 h2--serif">Vingt adresses, de Haaltert à Welkenraedt.</h2>
      <p>${agences}</p>
      <a class="autres__lien trait" href="${PAGE_REALISATIONS}">Toutes les réalisations →</a>
    </div>
  </div>
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
  <nav class="footer__nav" aria-label="Plan du site"><a class="trait" href="${PAGE_REALISATIONS}">${esc(REALISATIONS)}</a><a class="trait" href="index.html#collectif">Collectif</a><a class="trait" href="#">Engagements</a><a class="trait" href="#">Mentions légales</a><a class="trait" href="#">Confidentialité</a></nav>
  <blockquote class="footer__quote"><p>« ${site.quote.text} »</p><cite>${site.quote.author}</cite></blockquote>
  <p class="footer__legal">© 2026 ${site.name}</p>
</div></footer>
<script src="maquette.js" defer></script>
</body>
</html>
`;
}

// ---------- fiche projet (The Bank) ----------
// Brief §2 et §5 : lieu en eyebrow → titre 64 px → photo hero 520 px → bande de trois faits (même composant que la bande des chiffres de la Home :
// surface papier, valeur en serif or, étiquette gris chaud) → chapitre 01 → deux photos (01 portrait sur 5 colonnes, 02 paysage sur 7, 440 px,
// légendes) → chapitres 02 et 03, en colonne de 760 px alignée à gauche → projet suivant → pied de page.
// Bascule 20 (maquette.css) : titres de chapitre en serif 32 px (défaut) ou en sans medium 26 px.
function fichePage() {
  const f = fiche;
  const chapitre = (i, [titre, texte]) => `<section class="chapitre"><p class="chapitre__num">0${i + 1}</p><h2 class="chapitre__titre">${esc(titre)}</h2><p class="chapitre__texte">${texte}</p></section>`;
  return `<article class="fiche">
<div class="container page-head"><p class="eyebrow">${esc(f.projet.location)}</p><h1 class="page__titre">${esc(f.projet.name)}</h1></div>
<div class="fiche__hero">${photoImg(f.hero, '100vw')}</div>
<section class="band faits-band" aria-label="En bref"><div class="container"><ol class="stats stats--faits">${f.faits.map(([l, v]) => `<li class="stat"><span class="stat__value">${esc(v)}</span><span class="stat__label">${esc(l)}</span></li>`).join('')}</ol></div></section>
<div class="container">
  <div class="chapitres">${chapitre(0, f.chapitres[0])}</div>
  <div class="fiche__photos">${f.photos.map(ph => `<figure>${photoImg(ph.key, ph.sizes, ' loading="lazy"')}<figcaption>${esc(ph.legende)}</figcaption></figure>`).join('')}</div>
  <div class="chapitres">${f.chapitres.slice(1).map((c, i) => chapitre(i + 1, c)).join('')}</div>
  <a class="suivant" href="${f.suivant.href}"><span class="eyebrow">Projet suivant</span><span class="suivant__nom trait">${esc(f.suivant.projet.name)} →</span></a>
</div>
</article>`;
}

// ---------- vue Réalisations ----------
// Brief §5 : titre → les 4 projets (bascule 21 : la liste de la Home, défaut, ou quatre cartes photo 3:2) → programme agences (intro et les quatre
// exemples en liste typographique) → galerie en grille 3 colonnes 3:2 (photos <id>-01-s.jpg, nom sous la photo, surface · usage au survol,
// tout affiché sur téléphone) → pied de page.
function realisationsPage() {
  const rmd = frontmatter(read('content/realisations.md'));
  const sous = (rmd.fm.match(/subtitle:\s*(.+)/) || [])[1];
  const cartes = four.map(f => `<li class="cartes__item"${f.href !== PAGE_FICHE ? ` data-ancre="${f.id}"` : ''}><a href="${f.href}"><span class="cartes__photo"><img src="${IMG}/${f.carte}" alt="" loading="lazy" decoding="async"></span><span class="cartes__nom">${esc(byId[f.id].name)}</span><span class="cartes__ligne">${esc(f.line)}</span></a></li>`).join('\n    ');
  const agencesHtml = agencesListe.map(a => `<li><span class="agence__nom">${esc(a.name)}</span><span class="agence__ligne">${esc(a.surface)} · ${esc(a.use)}</span></li>`).join('\n      ');
  const galerieHtml = galerie.map(g => {
    const meta = `${esc(g.surface)} · ${esc(g.use)}`;
    return `<li class="galerie__item"><figure><span class="galerie__photo"><img src="${IMG}/${g.id}-01-s.jpg" alt="" loading="lazy" decoding="async"><span class="galerie__voile" aria-hidden="true">${meta}</span></span><figcaption><span class="galerie__nom">${esc(g.name)}</span><span class="galerie__meta">${meta}</span></figcaption></figure></li>`;
  }).join('\n    ');
  return `<div class="container page-head"><h1 class="page__titre">${esc(rmd.fm.match(/title:\s*(.+)/)[1].trim())}</h1>${sous ? `<p class="page__sous">${esc(sous.trim())}</p>` : ''}</div>
<section class="section section--quatre" id="projets"><div class="container">
  <p class="eyebrow">Projets détaillés</p>
  ${fourList(true)}
  <ol class="cartes">
    ${cartes}
  </ol>
</div></section>
<section class="section section--agences" id="agences"><div class="container">
  <p class="eyebrow">Le programme agences</p>
  <div class="agences">
    <p class="agences__intro">${agences}</p>
    <ol class="agences__liste">
      ${agencesHtml}
    </ol>
  </div>
</div></section>
<section class="section section--galerie" id="galerie"><div class="container">
  <p class="eyebrow">Galerie</p>
  <ul class="galerie">
    ${galerieHtml}
  </ul>
</div></section>`;
}

// ---------- pages ----------
const pages = {
  'index.html': () => head({ page: 'home', text: `${site.name} — ${site.tagline}` }) + '\n' + header('') + '\n<main>\n' + lead() + '\n' + chart() + '\n' + projets() + '\n' + autres() + '\n' + collectifBlock() + '\n</main>\n' + footer(),
  [PAGE_FICHE]: () => head({ page: 'fiche', text: `${fiche.projet.name} — ${site.name}` }) + '\n' + header('realisations') + '\n<main>\n' + fichePage() + '\n</main>\n' + footer(),
  [PAGE_REALISATIONS]: () => head({ page: 'realisations', text: `${REALISATIONS} — ${site.name}` }) + '\n' + header('realisations') + '\n<main>\n' + realisationsPage() + '\n</main>\n' + footer(),
};

for (const [name, render] of Object.entries(pages)) {
  const html = render();
  fs.writeFileSync(path.join(OUT, name), html);
  console.log('écrit', name, Math.round(html.length / 1024) + ' Ko');
}
