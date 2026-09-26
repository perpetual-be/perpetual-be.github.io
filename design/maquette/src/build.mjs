// Génère les pages de la maquette du lot 2 (design/maquette/*.html : la Home, la fiche The Bank, la vue Réalisations) à partir des données du dépôt.
// Exécuter depuis la racine : node design/maquette/src/build.mjs
// Lit data/*.json, content/home.md, content/collectif.md, content/realisations.md, public/favicon.svg, public/partners/encre/*.svg (hauteurs des logos),
// design/maquette/src/carte/belgique.{svg,json}, et les dimensions des photos de design/directions/img/ (srcset). N'écrit que dans design/maquette/.
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
// Vue Réalisations (revue du 26/09) : le même paragraphe, coupé à la première phrase — l'énoncé en serif à gauche, la suite à droite.
const [enonce, enonceSuite] = (agences.match(/^(.+?[.!?])\s+(.+)$/s) || []).slice(1);
if (!enonceSuite) throw new Error('content/realisations.md : le paragraphe du programme agences doit compter au moins deux phrases');

// Les quatre projets : une ligne chacun (mêmes lignes que la planche A) et la photo de l'aperçu de la liste de la Home (img, cadre portrait 4:5) ;
// sur la vue Réalisations (revue du 26/09), la photo du bloc (bloc, point focal blocFocal posé en style sur l'<img>, comme photoCandidates) et les trois
// faits du survol, lieu, surface et usage (provisoires, lot 3 ; pour The Bank la ville seule, l'adresse exacte n'est pas publiée).
// Les photos sont des clés : <clé>-s.jpg (800 px) et <clé>.jpg (1800 px) en srcset (photoImgPetit).
// The Bank pointe vers sa fiche — c'est le seul bloc cliquable de la vue Réalisations —, les trois autres vers leur ancre sur la vue Réalisations (l'id de leur bloc).
const four = [
  { id: 'ateliers-118', line: 'Molenbeek-Saint-Jean · 1 200 m² · Treize ateliers dans une ancienne usine de colle', img: 'ateliers-118-05', bloc: 'ateliers-118-05', blocFocal: '50% 55%', lieu: 'Molenbeek-Saint-Jean', surface: '1 200 m²', usage: 'Ateliers', href: `${PAGE_REALISATIONS}#ateliers-118` },
  { id: 'the-bank', line: 'Liège · 1 100 m² · Une agence devenue bijouterie, Bancontact et logements', img: 'the-bank-01', bloc: 'the-bank-01', blocFocal: '50% 40%', lieu: 'Liège', surface: '1 100 m²', usage: 'Logements & commerce', href: PAGE_FICHE },
  { id: 'data-box', line: 'Jemelle · 4 200 m² sur un hectare · Un site technique dont l’avenir reste ouvert', img: 'data-box-02', bloc: 'data-box-02', blocFocal: '50% 55%', lieu: 'Jemelle', surface: '4 200 m²', usage: 'Site technique', href: `${PAGE_REALISATIONS}#data-box` },
  { id: 'community', line: 'Uccle · 14 unités · Quatorze unités autour d’espaces partagés', img: 'community-05', bloc: 'community-05', blocFocal: '50% 50%', lieu: 'Uccle', surface: '14 unités', usage: 'Co-living', href: `${PAGE_REALISATIONS}#community` },
];
// Vue Réalisations : les quatre blocs en deux rangées, 7fr / 5fr puis 5fr / 7fr (.alt__rang--a, .alt__rang--b).
const rangees = [[['community', 7], ['ateliers-118', 5]], [['the-bank', 5], ['data-box', 7]]];
// Le programme agences, vue Réalisations : la rangée des seize biens, kind agency dans l'ordre puis kind gallery dans l'ordre (data/projects.json).
// La ville est le nom d'une agence, le lieu d'un bien de la galerie ; ses photos sont son champ selection (clés <id>-NN, dans l'ordre d'affichage,
// la première sur la vignette au repos), <id>-01 à défaut.
const parOrdre = kind => projects.filter(p => p.kind === kind).sort((a, b) => a.order - b.order);
const biens = [...parOrdre('agency'), ...parOrdre('gallery')].map(p => {
  const photos = p.selection && p.selection.length ? p.selection : [`${p.id}-01`];
  const etrangere = photos.find(k => !k.startsWith(p.id + '-'));
  if (etrangere) throw new Error(`data/projects.json : ${p.id}, selection — ${etrangere} n'est pas une photo de ce bien`);
  return { ville: p.kind === 'agency' ? p.name : p.location, surface: p.surface, usage: p.use, photos };
});
// Réserve, à confirmer avec Julien : les projets de l'ancien site (bascule 23, « anciens projets » ; masqués par défaut).
const ANCIENS = [
  { nom: 'Serhieux', lieu: 'Seraing', surface: '7 200 m²', usage: 'Valorisation et vente d’un bien à un organisme public' },
  { nom: 'Le petit Julien', lieu: 'Bruxelles', surface: '90 m²', usage: 'Restauration d’un immeuble classé en micro-hôtel de quatre chambres' },
  { nom: 'Brosse', lieu: 'Forest', surface: '800 m²', usage: 'Rafraîchissement et division d’un ancien atelier de brosses' },
  { nom: 'Robin-sur-les-Bois', lieu: 'Saint-Georges-sur-Meuse', surface: '5 200 m²', usage: 'Conversion d’un établissement d’hébergement et construction de logements' },
  { nom: 'Stéphanie', lieu: 'Bruxelles', surface: '250 m²', usage: 'Démolition et reconstruction d’un immeuble de logements collectifs' },
  { nom: 'Omalius', lieu: 'Méan', surface: '3 200 m²', usage: 'Transformation en logements à loyers modérés' },
  { nom: 'Ixelles', lieu: 'Ixelles', surface: '500 m²', usage: 'Deux maisons unifamiliales entièrement restaurées' },
  { nom: 'Batar', lieu: 'Bruxelles', surface: '45 m²', usage: 'Ouverture d’un bar à pistolets' },
  { nom: 'Maître', lieu: 'Forest', surface: '500 m²', usage: 'Réorganisation d’une maison unifamiliale en co-living' },
  { nom: 'Meuhh', lieu: 'Méan', surface: '3,2 ha', usage: 'Urbanisation d’un ensemble de terrains à bâtir' },
  { nom: 'Genval', lieu: 'Genval', surface: '180 m²', usage: 'Rénovation complète d’une maison unifamiliale dans un style contemporain' },
];
// Fiche The Bank : la photo de tête et son point focal, la bande de trois faits (comme la planche A), la paire de photos intercalée et ses légendes, le projet suivant.
// Revue de la fiche (23/09) : la façade (the-bank-01) passe en tête ; son point focal est posé en variables sur l'<img> (--focal au-dessus de 640 px :
// le bas de l'image juste au-dessus de la voiture, de 1280 à 1920 px de large ; --focal-mobile à 390 : toute la façade), lues par .fiche__hero img.
// La paire devient 02 (extérieur, à gauche) + 03 (intérieur, à droite), en deux colonnes égales.
// Les légendes ne sont pas dans data/projects.json (pas de captions pour the-bank) : provisoires, à confirmer au lot 3.
const bank = byId['the-bank'];
const fiche = {
  projet: bank,
  faits: [['Localisation', 'Liège'], ['Surface', bank.surface], ['Usage', 'Logements & commerce']],
  hero: { key: 'the-bank-01', focal: '50% 44%', focalMobile: '50% 5%' },
  photos: [{ key: 'the-bank-02', legende: 'Le point Bancontact, rue des Mineurs', sizes: '(max-width:640px) 100vw, 548px' }, { key: 'the-bank-03', legende: 'Le point Bancontact, l’intérieur', sizes: '(max-width:640px) 100vw, 548px' }],
  chapitres: [['Ce que c’était', bank.was], ['Ce que nous y avons vu', bank.saw], ['Ce que c’est devenu', bank.became]],
  suivant: { projet: byId['data-box'], href: `${PAGE_REALISATIONS}#data-box` },
};

// Premier écran (structure F, figée le 23/09) : la photo, en 1800 px (<nom>.jpg) puis 2800 px (<nom>-l.jpg) pour les grands écrans ;
// le srcset porte la largeur réelle de chaque fichier, lue dans l'en-tête JPEG. Les versions se génèrent depuis l'original avec
// design/directions/src/reduire-photos.mjs --grand --tres-grand ; tant qu'elles manquent, la page se replie sur <nom>-s.jpg (800 px).
function jpegSize(file) {
  const b = fs.readFileSync(file);
  for (let i = 2; i < b.length - 9;) {
    if (b[i] !== 0xFF) { i++; continue; }
    const m = b[i + 1];
    if (m === 0xFF) { i++; continue; }
    if (m === 0xD8 || m === 0x01 || (m >= 0xD0 && m <= 0xD7)) { i += 2; continue; }
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) }; // SOFn : longueur, précision, hauteur, largeur
    i += 2 + b.readUInt16BE(i + 2);
  }
  throw new Error(`${file} : dimensions JPEG introuvables`);
}
const jpegWidth = file => jpegSize(file).width;
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
// Photos de l'aperçu de la liste des 4 (Home) et de la vue Réalisations (blocs des 4 projets, vignettes des agences) : <clé>-s.jpg (800 px) et <clé>.jpg
// (1800 px) en srcset, avec la largeur réelle de chaque fichier — l'aperçu fait 440 × 550 à 1440, le 800 px seul y est agrandi sur les écrans 2× (et Data Box 02,
// 800 × 450, même sur un écran 1×). Tant que le 1800 px manque, l'<img> n'a que le 800 px et build.mjs le signale : le produire avec
// node design/directions/src/reduire-photos.mjs --grand <original.jpg>, puis rebâtir. Un <clé>.jpg plus petit que 1800 px (tiré d'une planche, pas de
// l'original) est signalé aussi, en fin de construction.
const sousGrand = new Set();
function photoSourcesPetit(key) {
  const chemin = f => path.join(REPO, 'design/directions/img', f);
  const sources = [`${key}-s.jpg`, `${key}.jpg`].filter(f => fs.existsSync(chemin(f))).map(f => ({ file: f, ...jpegSize(chemin(f)) }));
  if (!sources.length) throw new Error(`${key} : aucune photo réduite dans design/directions/img/`);
  if (sources.length < 2) console.warn(`${key} : pas de version 1800 px (${key}.jpg), srcset réduit au 800 px — reduire-photos.mjs --grand`);
  else if (Math.max(sources[1].width, sources[1].height) < 1800) sousGrand.add(`${key} (${Math.max(sources[1].width, sources[1].height)} px)`);
  return sources;
}
// sizes : le navigateur choisit la source sur la largeur affichée seule ; en object-fit: cover, une photo plus large que son cadre (ratio largeur/hauteur
// `cadre`) est calée sur la hauteur et a besoin de cadre × (ratio de la photo ÷ ratio du cadre) pixels de large (Data Box 02, 16:9 dans l'aperçu 4:5 :
// 2,2 × la largeur). Chaque terme de `sizes` ([media, largeur]) est multiplié par ce facteur, lu sur la photo elle-même. cadre null : les termes portent
// déjà la contrainte de hauteur (blocs de la vue Réalisations, dont le cadre change de forme avec la fenêtre, sizesBloc), rien n'est multiplié.
function photoImgPetit(key, cadre, sizes, attrs = '') {
  const sources = photoSourcesPetit(key);
  const k = cadre ? Math.max(1, (sources[0].width / sources[0].height) / cadre) : 1;
  const facteur = expr => /^\d+px$/.test(expr) ? `${Math.round(parseFloat(expr) * k)}px` : k === 1 ? `calc(${expr})` : `calc((${expr}) * ${k.toFixed(3)})`;
  const sz = sizes.map(([media, w]) => (media ? `${media} ` : '') + facteur(w)).join(', ');
  return `<img${attrs} src="${IMG}/${sources[0].file}"${sources.length > 1 ? ` srcset="${sources.map(s => `${IMG}/${s.file} ${s.width}w`).join(', ')}" sizes="${sz}"` : ''} alt="" decoding="async">`;
}
// Largeur affichée : aperçu de la liste = 5/12 du container moins la gouttière de 64 px (440 px à partir de 1280 px de fenêtre ; masqué sous 641 px).
// Vue Réalisations, sur la grille large (1600 px, gouttières comprises) : vignette = le quart de la rangée moins trois écarts de 24 px (362 px à partir
// de 1600 ; 78 % de la rangée sur téléphone).
const SIZES_APERCU = [['(max-width:1280px)', '(100vw - 144px) * 5 / 12'], ['', '440px']];
const SIZES_VIGNETTE = [['(max-width:640px)', '(100vw - 40px) * .78'], ['(max-width:1600px)', '(100vw - 152px) / 4'], ['', '362px']];
// Bloc de la vue Réalisations : sa largeur suit la fenêtre (7/12 ou 5/12 de la rangée moins l'écart de 14 px, 879 et 628 px à partir de 1600 px) et sa
// hauteur aussi (clamp(340px, 100vh − 262px, 540px)) : son cadre change de forme, un facteur fixe ne suffit pas. En object-fit: cover, la photo a besoin
// de la plus grande des deux largeurs, celle du cadre ou la hauteur × son propre ratio ; sur téléphone, un cadre 4:3 pleine largeur.
function sizesBloc(key, fr) {
  const [s] = photoSourcesPetit(key), ratio = s.width / s.height, telephone = Math.max(1, ratio / (4 / 3));
  return [['(max-width:640px)', telephone === 1 ? '100vw - 40px' : `(100vw - 40px) * ${telephone.toFixed(3)}`],
    ['', `max((min(100vw, 1600px) - 94px) * ${fr} / 12, clamp(340px, 100vh - 262px, 540px) * ${ratio.toFixed(3)})`]];
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

// La liste des quatre, sur la Home (la vue Réalisations a ses blocs photo depuis le 26/09) : l'aperçu photo suit la ligne survolée (maquette.js),
// 800 / 1800 px en srcset (photoImgPetit, cadre 4:5).
function fourList() {
  const rows = four.map((f, i) => `<li class="four__row${i === 0 ? ' is-active' : ''}" data-index="${i}"><a href="${f.href}"><span class="four__name">${esc(byId[f.id].name)}</span><span class="four__line">${esc(f.line)}</span></a></li>`).join('\n      ');
  const previews = four.map((f, i) => photoImgPetit(f.img, 4 / 5, SIZES_APERCU, i === 0 ? ' class="is-active"' : ' loading="lazy"')).join('');
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
  <blockquote class="footer__quote"><p>«\u00A0${site.quote.text}\u00A0»</p><cite>${site.quote.author}</cite></blockquote>
  <p class="footer__legal">© 2026 ${site.name}</p>
</div></footer>
<script src="maquette.js" defer></script>
</body>
</html>
`;
}

// ---------- fiche projet (The Bank) ----------
// Brief §2 et §5 : lieu en eyebrow → titre 64 px → photo hero the-bank-01 (hauteur calée sur la fenêtre, point focal en variables) → bande de trois faits
// (même composant que la bande des chiffres de la Home : surface papier, valeur en serif or, étiquette gris chaud) → chapitre 01 → deux photos (02 et 03,
// colonnes égales, 440 px, légendes) → chapitres 02 et 03, en colonne de 760 px alignée à gauche → projet suivant → pied de page.
// Titres de chapitre en sans medium (bascule 20 figée sur « sans », revue du 23/09).
function fichePage() {
  const f = fiche;
  const chapitre = (i, [titre, texte]) => `<section class="chapitre"><p class="chapitre__num">0${i + 1}</p><h2 class="chapitre__titre">${esc(titre)}</h2><p class="chapitre__texte">${texte}</p></section>`;
  return `<article class="fiche">
<div class="container page-head"><p class="eyebrow">${esc(f.projet.location)}</p><h1 class="page__titre">${esc(f.projet.name)}</h1></div>
<div class="fiche__hero">${photoImg(f.hero.key, '100vw', ` style="--focal:${f.hero.focal};--focal-mobile:${f.hero.focalMobile}"`)}</div>
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
// Revue du 26/09, proposition P2 retenue (design/revue-realisations/propositions/p2-defilement.html), sur la grille large (.large, 1600 px gouttières
// comprises) : l'ouverture — le titre en sans léger, puis la phrase du subtitle de content/realisations.md (provisoire, lot 3), sur une ligne —
// → les quatre projets en deux rangées de blocs photo (nom en serif sur la photo, Lieu / Surface / Usage au survol et au focus ; seule The Bank est un lien,
// les trois autres gardent leur id, ancre de la Home et du « Projet suivant » de la fiche) → le programme agences : l'énoncé sur papier (eyebrow, première
// phrase en serif à gauche, la suite à droite), puis la rangée des seize biens, quatre visibles, en boucle, chacun avec ses photos et la visionneuse
// (maquette.js, qui lit window.BIENS : ville, surface, usage et photos 1800 px, déjà échappés pour innerHTML) → en réserve (bascule 23), les projets de
// l'ancien site → pied de page. La piste des photos d'un bien a un tabindex="-1" : Chromium rend focalisable un conteneur qui défile, et ses clones
// (aria-hidden) seraient sinon autant d'arrêts de tabulation invisibles ; au clavier, les photos se parcourent avec les flèches du bien.
const FLECHE_G = '<svg viewBox="0 0 14 28" aria-hidden="true"><path d="M12 2 2 14l10 12" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
const FLECHE_D = '<svg viewBox="0 0 14 28" aria-hidden="true"><path d="M2 2l10 12L2 26" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
function realisationsPage() {
  const rmd = frontmatter(read('content/realisations.md'));
  const phrase = (rmd.fm.match(/subtitle:\s*(.+)/) || [])[1];
  const fait = (etiquette, valeur) => `<span><span class="fait__et">${etiquette}</span><span class="fait__val">${esc(valeur)}</span></span>`;
  const bloc = ([id, fr]) => {
    const f = four.find(x => x.id === id);
    const contenu = photoImgPetit(f.bloc, null, sizesBloc(f.bloc, fr), ` style="object-position:${f.blocFocal}"`)
      + `<span class="bloc__texte"><span class="bloc__nom">${esc(byId[id].name)}</span><span class="bloc__faits">${fait('Lieu', f.lieu)}${fait('Surface', f.surface)}${fait('Usage', f.usage)}</span><span class="bloc__mobile">${esc(f.lieu)} · ${esc(f.surface)}</span></span>`;
    // un bloc non cliquable reste atteignable au clavier (tabindex) : ses faits s'affichent au focus comme au survol
    return f.href === PAGE_FICHE ? `<a class="bloc" href="${f.href}">${contenu}</a>` : `<div class="bloc" id="${id}" tabindex="0">${contenu}</div>`;
  };
  const rangeesHtml = rangees.map((r, i) => `<div class="alt__rang alt__rang--${'ab'[i]}">${r.map(bloc).join('')}</div>`).join('\n  ');
  const vignettes = biens.map((b, k) => `<li><div class="vignette__photo"><div class="bien" data-bien="${k}" data-n="${b.photos.length}"><div class="bien__piste" tabindex="-1">${b.photos.map(c => photoImgPetit(c, 3 / 2, SIZES_VIGNETTE, ' loading="lazy"')).join('')}</div>`
    + `<span class="bien__compteur" aria-hidden="true">1 / ${b.photos.length}</span><button type="button" class="bien__fleche bien__fleche--g" aria-label="Photo précédente">${FLECHE_G}</button><button type="button" class="bien__fleche bien__fleche--d" aria-label="Photo suivante">${FLECHE_D}</button></div></div>`
    + `<p class="vignette__nom">${esc(b.ville)}<span>${esc(b.surface)}</span></p><p class="vignette__usage">${esc(b.usage)}</p></li>`).join('\n      ');
  const grande = c => fs.existsSync(path.join(REPO, 'design/directions/img', `${c}.jpg`)) ? `${c}.jpg` : `${c}-s.jpg`;
  const BIENS = biens.map(b => ({ ville: esc(b.ville), surface: esc(b.surface), usage: esc(b.usage), l: b.photos.map(c => `${IMG}/${grande(c)}`) }));
  const anciens = ANCIENS.map(a => `<li class="ancien"><p class="ancien__nom">${esc(a.nom)}</p><p class="ancien__lieu">${esc(a.lieu)} · ${esc(a.surface)}</p><p class="ancien__usage">${esc(a.usage)}</p></li>`).join('\n    ');
  return `<div class="large p2-ouv">
  <h1 class="page__titre">${esc(rmd.fm.match(/title:\s*(.+)/)[1].trim())}</h1>${phrase ? `\n  <p class="ouv__texte provisoire" title="texte provisoire, lot 3">${esc(phrase.trim())}</p>` : ''}
</div>
<section class="large alt" id="projets" aria-label="Quatre projets">
  ${rangeesHtml}
</section>
<section class="bloc-agences" id="agences">
  <div class="bloc-agences__bande"><div class="large bloc-agences__tete">
    <div><p class="eyebrow eyebrow--sans-marge">Programme agences</p><h2 class="enonce">${enonce}</h2></div>
    <p class="ouv__texte">${enonceSuite}</p>
  </div></div>
  <div class="large bloc-agences__defil"><div class="defil">
    <ul class="defil__piste" tabindex="0" aria-label="${biens.length} agences">
      ${vignettes}
    </ul>
    <div class="defil__nav"><span class="defil__compteur">1–4 / ${biens.length}</span><span class="defil__fleches"><a href="#" class="trait" data-d-prec aria-label="Agences précédentes">←</a><a href="#" class="trait" data-d-suiv aria-label="Agences suivantes">→</a></span></div>
  </div></div>
</section>
<section class="large anciens" id="autres" aria-label="Autres réalisations">
  <div class="anciens__tete"><div><p class="eyebrow eyebrow--sans-marge">Autres réalisations</p><h2 class="enonce provisoire" title="intitulé provisoire">Et, depuis 2002, des projets de toutes tailles.</h2></div></div>
  <ul class="anciens__liste">
    ${anciens}
  </ul>
</section>
<div class="visio" hidden role="dialog" aria-modal="true" aria-label="Photos du bien">
  <button type="button" class="visio__fermer trait" data-fermer>Fermer</button>
  <button type="button" class="visio__fleche visio__fleche--g" data-v-prec aria-label="Photo précédente">${FLECHE_G}</button>
  <div class="visio__cadre"><div class="visio__piste" tabindex="0"></div></div>
  <button type="button" class="visio__fleche visio__fleche--d" data-v-suiv aria-label="Photo suivante">${FLECHE_D}</button>
  <p class="visio__bas"><span class="visio__legende"></span><span class="visio__compteur"></span></p>
</div>
<script>window.BIENS=${JSON.stringify(BIENS)};</script>`;
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
if (sousGrand.size) console.warn(`${sousGrand.size} photos sans leur version 1800 px (<clé>.jpg plus petit, tiré d'une planche) — à produire depuis les originaux, reduire-photos.mjs --petit --grand, puis rebâtir : ${[...sousGrand].join(', ')}`);
