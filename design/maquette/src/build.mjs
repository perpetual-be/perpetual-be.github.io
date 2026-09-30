// Génère les pages de la maquette du lot 2 (design/maquette/*.html : la Home, les quatre fiches projet, la vue Réalisations, la page Engagements) à partir des données du dépôt.
// Exécuter depuis la racine : node design/maquette/src/build.mjs
// Lit data/*.json, content/home.md, content/collectif.md, content/realisations.md, content/engagements.md, public/favicon.svg, public/partners/encre/*.svg (hauteurs des logos),
// design/maquette/src/carte/belgique.{svg,json}, et les dimensions des photos de design/directions/img/ (srcset, ratios de la mosaïque, œuvre). N'écrit que dans design/maquette/.
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
const PAGE_ENGAGEMENTS = 'engagements.html';
// Les quatre fiches (P6, 26/09) : une page par projet détaillé, dans l'ordre du champ order — celui de « Projet précédent / suivant » (en boucle) et, depuis le 30/09,
// celui de la liste des 4 de la Home (The Bank, Data Box, Community, Ateliers 118). La vue Réalisations garde sa composition, les rangées ci-dessous.
const pageFiche = id => `projet-${id}.html`;
const DETAILLES = projects.filter(p => p.kind === 'detailed').sort((a, b) => a.order - b.order);
// La photo d'un projet détaillé est la première clé de son champ selection : tête de sa fiche, bloc de la vue Réalisations, et aperçu de la liste des 4 (Home)
// sauf si son champ apercu en choisit une autre (30/09, voir apercuDe) ; les suivantes font la mosaïque de sa fiche, dans cet ordre (clés <id>-NN ; data-box-03
// à -07 sont des vues drone, voir le README de src).
for (const p of DETAILLES) {
  if (!p.selection || !p.selection.length) throw new Error(`data/projects.json : ${p.id}, selection — la photo du projet, puis celles de la mosaïque`);
  const etrangere = p.selection.find(k => !k.startsWith(p.id + '-'));
  if (etrangere) throw new Error(`data/projects.json : ${p.id}, selection — ${etrangere} n'est pas une photo de ce projet`);
}
const photoProjet = id => byId[id].selection[0];

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

// Les quatre projets : leurs infos propres, lues par id — l'ordre de ce tableau ne compte pas, la liste de la Home suit le champ order (DETAILLES). Une ligne
// chacun (mêmes lignes que la planche A) ; sur la vue Réalisations (revue du 26/09), la photo du bloc (bloc, point focal blocFocal posé en style sur l'<img>,
// comme photoCandidates) et les trois faits du survol, lieu, surface et usage (provisoires, lot 3 ; pour The Bank la ville seule, l'adresse exacte n'est pas
// publiée). bloc est la photo du projet, la première clé de son champ selection (P6, 26/09) : <clé>-s.jpg (800 px) et <clé>.jpg (1800 px) en srcset
// (photoImgPetit). Ateliers 118 : ateliers-118-01, toute la façade avec la porte de garage dans le bloc (50% 30%) ; Data Box : data-box-03, la vue drone.
// Les quatre pointent vers leur fiche (la liste de la Home, les quatre blocs-liens de la vue Réalisations, qui gardent leur id). La photo et le cadrage de
// l'aperçu de la Home (30/09) ne sont pas ici : ils sont dans le champ apercu de data/projects.json (apercus, plus bas).
const four = [
  { id: 'ateliers-118', line: 'Molenbeek-Saint-Jean · 1 200 m² · Treize ateliers dans une ancienne usine de colle', blocFocal: '50% 30%', lieu: 'Molenbeek-Saint-Jean', surface: '1 200 m²', usage: 'Ateliers' },
  { id: 'the-bank', line: 'Liège · 1 100 m² · Une agence bancaire transformée pour trois nouveaux usages', blocFocal: '50% 40%', lieu: 'Liège', surface: '1 100 m²', usage: 'Logements & commerce' },
  { id: 'data-box', line: 'Jemelle · 4 200 m² · Un hectare de potentiel, loué jusqu’en 2031', blocFocal: '50% 50%', lieu: 'Jemelle', surface: '4 200 m²', usage: 'Site technique' },
  { id: 'community', line: 'Uccle · 600 m² · Quatorze chez-soi autour d’espaces partagés', blocFocal: '50% 50%', lieu: 'Uccle', surface: '14 unités', usage: 'Co-living' },
].map(f => ({ ...f, bloc: photoProjet(f.id), href: pageFiche(f.id) }));
for (const p of DETAILLES) if (!four.some(f => f.id === p.id)) throw new Error(`build.mjs : ${p.id} absent de four (ligne, blocFocal, lieu, surface, usage)`);
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
// Les quatre fiches (P6, Cowork, 26/09 ; références validées : design/revue-fiche/propositions/p6.html, p6-ateliers-118.html, p6-data-box.html,
// p6-community.html), un seul gabarit. Par projet (valeurs provisoires, lot 3) : la région (eyebrow), les trois infos — lieu, surface, usage —, le cadre
// de la photo de tête et son point focal (object-position, posé en style sur l'<img>). Cadre paysage : 50 % de la page, format 2100 / 1694 ; carré :
// 40 %, 1:1. The Bank : the-bank-01 est en portrait ; calée en haut dans le cadre paysage (1,24), elle en montre exactement les 60,5 % du haut, sans la
// voiture — la découpe de la référence, sans ses fichiers recadrés (img/the-bank-01-facade*.jpg). Les chapitres sont was, saw et became de
// data/projects.json ; la photo de tête est la première clé de selection, la mosaïque les suivantes.
const CADRES = { paysage: { largeur: 50, ratio: 2100 / 1694 }, carre: { largeur: 40, ratio: 1 } };
const fiches = {
  'ateliers-118': { region: 'Bruxelles', lieu: 'Molenbeek-Saint-Jean', surface: '1 200 m²', usage: 'Ateliers', cadre: 'carre', focal: '50% 0%' },
  'the-bank': { region: 'Liège', lieu: 'Centre-ville', surface: '1 100 m²', usage: 'Logements & commerce', cadre: 'paysage', focal: '50% 0%' },
  'data-box': { region: 'Rochefort', lieu: 'Jemelle', surface: '4 200 m²', usage: 'Site technique', cadre: 'paysage', focal: '60% 50%' },
  'community': { region: 'Bruxelles', lieu: 'Uccle', surface: '14 unités', usage: 'Co-living', cadre: 'paysage', focal: '50% 50%' },
};
const CHAPITRES = [['was', 'Ce que c’était'], ['saw', 'Ce que nous y avons vu'], ['became', 'Ce que c’est devenu']];
for (const p of DETAILLES) if (!fiches[p.id] || !CADRES[fiches[p.id].cadre]) throw new Error(`build.mjs : fiche de ${p.id} absente de fiches, ou cadre inconnu`);
// Page Engagements (Cowork, 26/09) : le titre de content/engagements.md (pas de sous-titre, décision d'Axel du 26/09), puis une rangée par titre ## —
// le verbe, et les paragraphes qui le suivent jusqu'au titre suivant ; l'id de la rangée est le verbe (#aider, #transmettre, #soutenir).
const slug = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const engagementsMd = frontmatter(read('content/engagements.md'));
const engagements = { titre: engagementsMd.fm.match(/title:\s*(.+)/)[1].trim(), rangs: [] };
for (const b of blocks(engagementsMd.body)) {
  if (b.startsWith('## ')) engagements.rangs.push({ verbe: b.slice(3).trim(), id: slug(b.slice(3)), paragraphes: [] });
  else if (engagements.rangs.length && !b.startsWith('#')) engagements.rangs[engagements.rangs.length - 1].paragraphes.push(b);
  else throw new Error('content/engagements.md : bloc hors d’une rangée ## — ' + b.slice(0, 60));
}
// L'œuvre du Créahmbxl, sur une cimaise dans la colonne de gauche de la rangée `rang` (« Soutenir »), sous le verbe : le fichier, recadré sur la feuille
// (870 × 1132, copié tel quel de design/revue-engagements/propositions/img/, jamais recompressé ; width et height lus dans l'en-tête JPEG), la légende et
// le détail du cartel, le texte alternatif (provisoire, lot 3). Entière : jamais recadrée par le CSS ni agrandie au-delà de 340 px ; pas un lien, pas de zoom.
const oeuvre = {
  rang: 'soutenir',
  fichier: 'ines-reddah-2024-recadree.jpg',
  legende: 'Ines Reddah, 2024',
  detail: 'Feutres et acrylique, 65\u00A0×\u00A082\u00A0cm',
  alt: 'Peinture d’Ines Reddah, 2024 : deux grands visages ronds cernés de bleu et de rose, entourés de traits verticaux de couleur.',
};
if (!engagements.rangs.some(r => r.id === oeuvre.rang)) throw new Error(`content/engagements.md : pas de rangée #${oeuvre.rang} pour l'œuvre`);

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
// La photo déclare son point focal (object-position, posé en style sur l'<img>, vaut aussi sur téléphone). Figée le 23/09 sur Community 05,
// accroche à gauche (bascules 9b et 9d retirées ; data-box-03, l'autre candidate, est depuis la P6 la photo de Data Box). Plus de bascule 9c : cadrage figé le 26/09 sur
// « haut », 50% 20%, pour le premier écran de la Home seulement (le blocFocal de community-05 dans four, vue Réalisations, reste 50% 50%).
// Sur téléphone, pas d'exception : Community 05 (4:3) est calée sur la hauteur du cadre de 390 × 420, le point focal vertical n'y change rien.
// Sources d'une photo : <clé>.jpg (1800 px) et <clé>-l.jpg (2800 px) quand ils existent, sinon repli sur <clé>-s.jpg (800 px).
function photoSources(key) {
  const chemin = f => path.join(REPO, 'design/directions/img', f);
  const sources = [`${key}.jpg`, `${key}-l.jpg`].filter(f => fs.existsSync(chemin(f))).map(f => ({ file: f, ...jpegSize(chemin(f)) }));
  if (!sources.length) { console.warn(`${key} : repli sur ${key}-s.jpg (800 px)`); sources.push({ file: `${key}-s.jpg`, ...jpegSize(chemin(`${key}-s.jpg`)) }); }
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
// `cadre`) est calée sur la hauteur et a besoin de cadre × (ratio de la photo ÷ ratio du cadre) pixels de large (Data Box 03, 16:9 dans l'aperçu 4:5 :
// 2,2 × la largeur). Chaque terme de `sizes` ([media, largeur]) est multiplié par ce facteur k, lu sur la photo elle-même (sizesCadre ; aussi pour la
// photo de tête des fiches). cadre null : les termes portent déjà la contrainte de hauteur (blocs de la vue Réalisations, dont le cadre change de forme
// avec la fenêtre, sizesBloc), rien n'est multiplié. facteur : quand l'<img> est agrandie pour que le cadre n'en montre qu'une partie (aperçu de la Home avec
// un cadre, apercuImg), elle est 1 / largeur du cadre fois plus large que lui — Data Box 2,22, Community 2,16, Ateliers 118 1,35, The Bank 1 : ce facteur
// remplace alors le rapport photo ÷ cadre.
function sizesCadre(sizes, k) {
  const facteur = expr => /^\d+px$/.test(expr) ? `${Math.round(parseFloat(expr) * k)}px` : k === 1 ? `calc(${expr})` : `calc((${expr}) * ${k.toFixed(3)})`;
  return sizes.map(([media, w]) => (media ? `${media} ` : '') + facteur(w)).join(', ');
}
function photoImgPetit(key, cadre, sizes, attrs = '', facteur = null) {
  const sources = photoSourcesPetit(key);
  const k = facteur ?? (cadre ? Math.max(1, (sources[0].width / sources[0].height) / cadre) : 1);
  return `<img${attrs} src="${IMG}/${sources[0].file}"${sources.length > 1 ? ` srcset="${sources.map(s => `${IMG}/${s.file} ${s.width}w`).join(', ')}" sizes="${sizesCadre(sizes, k)}"` : ''} alt="" decoding="async">`;
}
// Largeur affichée : le cadre de l'aperçu de la liste = 5/12 du container moins la gouttière de 64 px (440 px à partir de 1280 px de fenêtre ; masqué sous
// 641 px) ; l'<img> qu'il contient est 1 / largeur de son cadre fois plus large (apercuImg).
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
  { key: 'community-05', focal: '50% 20%' },
].map(c => ({ key: c.key, focal: c.focal, sources: photoSources(c.key) }));

// Aperçu de la liste des 4 (Home, 30/09) : le champ apercu de data/projects.json, { photo?, cadre: [x, y, largeur, hauteur] }. La photo est apercu.photo, à défaut
// la première clé de selection (Community montre community-15 : le premier écran de la Home montre déjà community-05, pas deux fois la même photo) ; elle doit
// être du projet et avoir ses fichiers réduits, comme les clés de selection. Le cadre est la partie de l'image que montre le cadre 4:5 de l'aperçu, en fractions
// de l'image entière (x et largeur sur sa largeur, y et hauteur sur sa hauteur) : refusé s'il n'a pas quatre nombres, s'il sort de l'image, ou si son rapport en
// pixels, (largeur × L) / (hauteur × H) mesuré sur <clé>.jpg, s'écarte de 4/5 de plus de 1 % (la partie montrée serait alors déformée ou rognée). Sans
// apercu : la photo de selection[0], centrée en cover, comme avant. La tête de fiche et le bloc de la vue Réalisations ne lisent pas ce champ.
function apercuDe(p) {
  const a = p.apercu, ou = `data/projects.json : ${p.id}, apercu`;
  const photo = (a && a.photo) || photoProjet(p.id);
  if (typeof photo !== 'string' || !photo.startsWith(p.id + '-')) throw new Error(`${ou}.photo — ${photo} n'est pas une photo de ce projet`);
  const sources = photoSourcesPetit(photo);   // refuse une clé sans fichiers réduits
  if (!a) return { photo, cadre: null };
  const c = a.cadre;
  if (!Array.isArray(c) || c.length !== 4 || !c.every(v => typeof v === 'number' && Number.isFinite(v))) throw new Error(`${ou}.cadre — quatre nombres attendus, [x, y, largeur, hauteur]`);
  const [x, y, l, h] = c;
  if (x < 0 || y < 0 || l <= 0 || h <= 0 || x + l > 1 + 1e-9 || y + h > 1 + 1e-9) throw new Error(`${ou}.cadre — [${c.join(', ')}] sort de l'image (x, y ≥ 0 ; largeur, hauteur > 0 ; x + largeur ≤ 1 ; y + hauteur ≤ 1)`);
  const grande = sources[sources.length - 1], rapport = (l * grande.width) / (h * grande.height);
  if (Math.abs(rapport / (4 / 5) - 1) > 0.01) throw new Error(`${ou}.cadre — rapport en pixels ${rapport.toFixed(4)} = (${l} × ${grande.width}) / (${h} × ${grande.height}) sur ${grande.file} ; 4/5 attendu, à 1 % près`);
  return { photo, cadre: c };
}
const apercus = Object.fromEntries(DETAILLES.map(p => [p.id, apercuDe(p)]));

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

// Page active : le trait sous son lien ; sur la page Engagements, aria-current="page" en plus (26/09 ; le lien de « Réalisations » ne change pas).
function header(active = '') {
  const a = k => active === k ? ` class="trait is-active"${k === 'engagements' ? ' aria-current="page"' : ''}` : ' class="trait"';
  return `<header class="site-header">
  <a class="logo" href="index.html" aria-label="Perpetual">${phi('logo__mark')}<span class="logo__texte">Perpetual</span></a>
  <nav class="site-nav" aria-label="Navigation"><a href="${PAGE_REALISATIONS}"${a('realisations')}>${esc(REALISATIONS)}</a><a href="${PAGE_ENGAGEMENTS}"${a('engagements')}>Engagements</a><a href="#contact" class="trait">Contact</a></nav>
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

// L'<img> de l'aperçu d'un projet (apercus). Avec un cadre [x, y, l, h], l'image entière est agrandie de sorte que le cadre 4:5 (.four__preview, overflow
// hidden) en montre exactement cette partie : largeur 100 / l %, hauteur 100 / h %, décalée de −100·x / l % et −100·y / h % (pourcentages du cadre) ; son
// rapport est celui du fichier (à 1 % près, refusé sinon par apercuDe), le object-fit: cover de la feuille n'y rogne rien. transform-origin est le centre de la
// partie visible, (x + l/2, y + h/2) en % de l'image : le zoom du survol y reste centré. sizes : l'<img> est 1 / l fois plus large que le cadre (photoImgPetit).
// Sans cadre : centrée en cover, comme avant. La première est l'active au repos, les autres sont paresseuses.
function apercuImg(p, i) {
  const { photo, cadre } = apercus[p.id], base = i === 0 ? ' class="is-active"' : ' loading="lazy"';
  if (!cadre) return photoImgPetit(photo, 4 / 5, SIZES_APERCU, base);
  const [x, y, l, h] = cadre, pct = v => `${+v.toFixed(4)}%`;
  const style = ` style="width:${pct(100 / l)};height:${pct(100 / h)};left:${pct(-100 * x / l)};top:${pct(-100 * y / h)};transform-origin:${pct(100 * (x + l / 2))} ${pct(100 * (y + h / 2))}"`;
  return photoImgPetit(photo, 4 / 5, SIZES_APERCU, base + style, 1 / l);
}
// Ligne de la liste des 4 : lieu · surface · phrase, séparateurs aérés (lot 3, 30/09 : les trois éléments paraissaient serrés) ; espace insécable
// avant le point (jamais en début de ligne), marge de .four__sep de part et d'autre (maquette.css).
const ligneQuatre = s => s.split(' · ').map(esc).join('\u00A0<span class="four__sep">·</span> ');
// La liste des quatre, sur la Home (la vue Réalisations a ses blocs photo depuis le 26/09), dans l'ordre du champ order (DETAILLES : The Bank, Data Box,
// Community, Ateliers 118 ; plus d'ordre écrit ici) : l'aperçu photo suit la ligne survolée (maquette.js), 800 / 1800 px en srcset (photoImgPetit, cadre 4:5),
// la photo et le cadrage de chacun étant son champ apercu (apercuImg).
function fourList() {
  const rows = DETAILLES.map((p, i) => { const f = four.find(x => x.id === p.id); return `<li class="four__row${i === 0 ? ' is-active' : ''}" data-index="${i}"><a href="${f.href}"><span class="four__name">${esc(p.name)}</span><span class="four__line">${ligneQuatre(f.line)}</span></a></li>`; }).join('\n      ');
  const previews = DETAILLES.map(apercuImg).join('');
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

// Section « En Belgique » (intitulé du 28/09, lot 3 : « Réalisations » faisait doublon avec la liste des 4) : la carte, avec le texte à droite (figée le 23/09 ; la bande de vignettes et « aucune » sont retirées).
function autres() {
  return `<section class="section section--autres" id="realisations">
<div class="container">
  <p class="eyebrow">En Belgique</p>
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
  <nav class="footer__nav" aria-label="Plan du site"><a class="trait" href="${PAGE_REALISATIONS}">${esc(REALISATIONS)}</a><a class="trait" href="index.html#collectif">Collectif</a><a class="trait" href="${PAGE_ENGAGEMENTS}">Engagements</a><a class="trait" href="#">Mentions légales</a><a class="trait" href="#">Confidentialité</a></nav>
  <blockquote class="footer__quote"><p>«\u00A0${site.quote.text}\u00A0»</p><cite>${site.quote.author}</cite></blockquote>
  <p class="footer__legal">© 2026 ${site.name}</p>
</div></footer>
<script src="maquette.js" defer></script>
</body>
</html>
`;
}

// ---------- visionneuse (vue Réalisations et fiches) ----------
// Fond blanc, la photo entière dans un cadre 4:3, flèches de part et d'autre, « Fermer », Échap, Tab contenu (maquette.js). Sur la vue Réalisations, la ville
// puis « surface · usage » et le compteur sous la photo ; sur les fiches, le compteur seul (« 3 / 10 »), pas de légende.
const FLECHE_G = '<svg viewBox="0 0 14 28" aria-hidden="true"><path d="M12 2 2 14l10 12" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
const FLECHE_D = '<svg viewBox="0 0 14 28" aria-hidden="true"><path d="M2 2l10 12L2 26" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
const visio = label => `<div class="visio" hidden role="dialog" aria-modal="true" aria-label="${label}">
  <button type="button" class="visio__fermer trait" data-fermer>Fermer</button>
  <button type="button" class="visio__fleche visio__fleche--g" data-v-prec aria-label="Photo précédente">${FLECHE_G}</button>
  <div class="visio__cadre"><div class="visio__piste" tabindex="0"></div></div>
  <button type="button" class="visio__fleche visio__fleche--d" data-v-suiv aria-label="Photo suivante">${FLECHE_D}</button>
  <p class="visio__bas"><span class="visio__legende"></span><span class="visio__compteur"></span></p>
</div>`;

// ---------- fiches projet (P6, Cowork, 26/09) ----------
// Un seul gabarit pour les quatre projets détaillés, sur la grille large (comme la vue Réalisations ; le pied de page reste sur le container de 1 200 px) :
// une grille de trois colonnes, marge | texte | photo. À gauche, la région en eyebrow, le titre (serif 64 px), les infos (Localisation, Surface, Usage :
// la valeur en sans or foncé, l'étiquette dessous), puis les trois chapitres empilés (titres en sans medium, bascule 20 figée) ; à droite, la photo de tête
// au bord de la fenêtre, dès le bas de l'en-tête, qui suit le texte quand il est plus long qu'elle (CSS). Dessous, sur la grille large : « Photos », la
// mosaïque (une figure par photo, au format du fichier, sans légende ; rangées justifiées par maquette.js, clic → visionneuse), puis le projet précédent
// et le suivant, en boucle dans l'ordre du champ order.
// Photo de tête : <clé>.jpg et <clé>-l.jpg (photoImg), sans lazy, sizes corrigé du recadrage cover (sizesCadre). Mosaïque : <clé>-s.jpg et <clé>.jpg avec
// leur largeur réelle, --r et data-r = le ratio du plus grand fichier (en-tête JPEG) ; le sizes posé ici ne vaut que sans JavaScript (et avant le
// placement), maquette.js le remplace par la largeur de chaque tuile. Chaque tuile est un bouton (clavier) qui ouvre la visionneuse sur son <clé>.jpg.
function fichePage(p, i) {
  const f = fiches[p.id], cadre = CADRES[f.cadre], n = DETAILLES.length, prec = DETAILLES[(i + n - 1) % n], suiv = DETAILLES[(i + 1) % n];
  const [tete, ...autres] = p.selection;
  const s = photoSources(tete)[0], k = Math.max(1, (s.width / s.height) / cadre.ratio);
  const photo = photoImg(tete, sizesCadre([['(max-width:640px)', '100vw'], ['', `${cadre.largeur}vw`]], k), ` style="object-position:${f.focal}"`);
  const fait = (valeur, etiquette) => `<li class="fiche__fait"><span class="fiche__valeur">${esc(valeur)}</span><span class="fiche__etiquette">${etiquette}</span></li>`;
  const chapitre = ([champ, titre], j) => `<section class="chapitre"><p class="chapitre__num">0${j + 1}</p><h2 class="chapitre__titre">${esc(titre)}</h2><p class="chapitre__texte">${p[champ]}</p></section>`;
  const tuile = (cle, j) => {
    const sources = photoSourcesPetit(cle), grand = sources[sources.length - 1], r = (grand.width / grand.height).toFixed(4);
    return `<figure class="fiche__tuile" style="--r:${r}" data-r="${r}"><button type="button" class="fiche__agrandir" data-grande="${IMG}/${grand.file}" aria-label="Agrandir la photo ${j + 1} sur ${autres.length}">`
      + `<img src="${IMG}/${sources[0].file}"${sources.length > 1 ? ` srcset="${sources.map(x => `${IMG}/${x.file} ${x.width}w`).join(', ')}" sizes="(max-width:640px) 100vw, ${Math.round(r * 440)}px"` : ''} alt="" loading="lazy" decoding="async"></button></figure>`;
  };
  const mosaique = autres.length ? `\n<div class="large fiche__autres"><p class="eyebrow">Photos</p><div class="fiche__mosaique">${autres.map(tuile).join('')}</div></div>` : '';
  return `<article class="fiche">
<div class="fiche__corps fiche__corps--${f.cadre}">
  <div class="fiche__gauche"><div class="fiche__titre"><p class="eyebrow">${esc(f.region)}</p><h1 class="page__titre">${esc(p.name)}</h1></div><ol class="fiche__faits" aria-label="En bref">${fait(f.lieu, 'Localisation')}${fait(f.surface, 'Surface')}${fait(f.usage, 'Usage')}</ol><div class="fiche__chapitres">${CHAPITRES.map(chapitre).join('')}</div></div>
  <figure class="fiche__photo">${photo}</figure>
</div>${mosaique}
<div class="large"><nav class="fiche__voisins" aria-label="Autres projets"><a class="fiche__voisin fiche__voisin--prec" href="${pageFiche(prec.id)}"><span class="eyebrow">Projet précédent</span><span class="suivant__nom trait">← ${esc(prec.name)}</span></a><a class="fiche__voisin fiche__voisin--suiv" href="${pageFiche(suiv.id)}"><span class="eyebrow">Projet suivant</span><span class="suivant__nom trait">${esc(suiv.name)} →</span></a></nav></div>
</article>
${visio('Photos du projet')}`;
}

// ---------- vue Réalisations ----------
// Revue du 26/09, proposition P2 retenue (design/revue-realisations/propositions/p2-defilement.html), sur la grille large (.large, 1600 px gouttières
// comprises) : l'ouverture — le titre en sans léger, puis la phrase du subtitle de content/realisations.md (provisoire, lot 3), sur une ligne —
// → les quatre projets en deux rangées de blocs photo (nom en serif sur la photo, Lieu / Surface / Usage au survol et au focus) ; depuis la P6 (26/09), les
// quatre blocs sont des liens vers leur fiche et gardent leur id (#ateliers-118, #the-bank, #data-box, #community) → le programme agences : l'énoncé sur
// papier (eyebrow, première phrase en serif à gauche, la suite à droite), puis la rangée des seize biens, quatre visibles, en boucle, chacun avec ses photos
// et la visionneuse (maquette.js, qui lit window.BIENS : ville, surface, usage et photos 1800 px, déjà échappés pour innerHTML) → en réserve (bascule 23),
// les projets de l'ancien site → pied de page. La piste des photos d'un bien a un tabindex="-1" : Chromium rend focalisable un conteneur qui défile, et ses
// clones (aria-hidden) seraient sinon autant d'arrêts de tabulation invisibles ; au clavier, les photos se parcourent avec les flèches du bien.
function realisationsPage() {
  const rmd = frontmatter(read('content/realisations.md'));
  const phrase = (rmd.fm.match(/subtitle:\s*(.+)/) || [])[1];
  const fait = (etiquette, valeur) => `<span><span class="fait__et">${etiquette}</span><span class="fait__val">${esc(valeur)}</span></span>`;
  const bloc = ([id, fr]) => {
    const f = four.find(x => x.id === id);
    const contenu = photoImgPetit(f.bloc, null, sizesBloc(f.bloc, fr), ` style="object-position:${f.blocFocal}"`)
      + `<span class="bloc__texte"><span class="bloc__nom">${esc(byId[id].name)}</span><span class="bloc__faits">${fait('Lieu', f.lieu)}${fait('Surface', f.surface)}${fait('Usage', f.usage)}</span><span class="bloc__mobile">${esc(f.lieu)} · ${esc(f.surface)}</span></span>`;
    // un lien vers sa fiche : ses faits s'affichent au survol comme au focus clavier, et sa photo zoome (photo cliquable)
    return `<a class="bloc" id="${id}" href="${f.href}">${contenu}</a>`;
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
${visio('Photos du bien')}
<script>window.BIENS=${JSON.stringify(BIENS)};</script>`;
}

// ---------- page Engagements ----------
// Cowork, 26/09 (référence validée par Axel : design/revue-engagements/propositions/p1.html), sur le container de 1 200 px comme la Home : le titre seul,
// sans sous-titre, en sans léger comme Réalisations → le registre, une rangée par titre ## de content/engagements.md : le verbe en serif à gauche, les
// paragraphes à droite, un filet au-dessus → dans la colonne de gauche de la rangée oeuvre.rang (« Soutenir »), sous le verbe, l'œuvre sur sa cimaise,
// avec son cartel → pied de page.
// Markdown en ligne des paragraphes : les liens seuls, en .lien-texte — une ancre ou une page telle quelle ([Écrivez-nous](#contact) : le bloc du pied de
// page), un autre site dans un nouvel onglet (target _blank, rel noopener), annoncé aux lecteurs d'écran ; puis l'espace insécable avant « : ».
const enLigne = md => md.replace(/ :/g, '\u00A0:').replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, texte, href) => /^https?:\/\//.test(href)
  ? `<a class="lien-texte" href="${esc(href)}" target="_blank" rel="noopener">${texte}<span class="visuellement-masque"> (nouvel onglet)</span></a>`
  : `<a class="lien-texte" href="${esc(href)}">${texte}</a>`);
function engagementsPage() {
  const taille = jpegSize(path.join(REPO, 'design/directions/img', oeuvre.fichier));
  const cimaise = `<div class="cimaise"><figure class="oeuvre"><img src="${IMG}/${oeuvre.fichier}" width="${taille.width}" height="${taille.height}" alt="${esc(oeuvre.alt)}" decoding="async">`
    + `<figcaption class="cartel"><b>${esc(oeuvre.legende)}</b><span>${esc(oeuvre.detail)}</span></figcaption></figure></div>`;
  const rang = r => `<section class="rang" id="${r.id}">
    <div class="rang__g"><h2 class="rang__verbe">${esc(r.verbe)}</h2>${r.id === oeuvre.rang ? cimaise : ''}</div>
    <div class="rang__d"><div class="eng-texte">${r.paragraphes.map(p => `<p>${enLigne(p)}</p>`).join('')}</div></div>
  </section>`;
  return `<div class="container page-head"><h1 class="page__titre">${esc(engagements.titre)}</h1></div>
<div class="container registre">
  ${engagements.rangs.map(rang).join('\n  ')}
</div>`;
}

// ---------- pages ----------
const pages = {
  'index.html': () => head({ page: 'home', text: `${site.name} — ${site.tagline}` }) + '\n' + header('') + '\n<main>\n' + lead() + '\n' + chart() + '\n' + projets() + '\n' + autres() + '\n' + collectifBlock() + '\n</main>\n' + footer(),
  ...Object.fromEntries(DETAILLES.map((p, i) => [pageFiche(p.id), () => head({ page: 'fiche', text: `${p.name} — ${site.name}` }) + '\n' + header('realisations') + '\n<main>\n' + fichePage(p, i) + '\n</main>\n' + footer()])),
  [PAGE_REALISATIONS]: () => head({ page: 'realisations', text: `${REALISATIONS} — ${site.name}` }) + '\n' + header('realisations') + '\n<main>\n' + realisationsPage() + '\n</main>\n' + footer(),
  [PAGE_ENGAGEMENTS]: () => head({ page: 'engagements', text: `${engagements.titre} — ${site.name}` }) + '\n' + header('engagements') + '\n<main>\n' + engagementsPage() + '\n</main>\n' + footer(),
};

for (const [name, render] of Object.entries(pages)) {
  const html = render();
  fs.writeFileSync(path.join(OUT, name), html);
  console.log('écrit', name, Math.round(html.length / 1024) + ' Ko');
}
if (sousGrand.size) console.warn(`${sousGrand.size} photos dont le <clé>.jpg fait moins de 1800 px — tiré d'une planche en attendant l'original (à produire depuis l'original, reduire-photos.mjs --petit --grand, puis rebâtir), ou original plus petit (community-04, -11, -13 : 1080 px ; -14 à -16 : 1536 px ; connu) : ${[...sousGrand].join(', ')}`);
