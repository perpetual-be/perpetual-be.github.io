// Lot 2b, items 10 à 12 — mosaïque des agences et Brosse sur la vue Réalisations, page de travail à comparer dans le navigateur.
// v1 (Cowork, 04/10 après-midi) : trois options A / B / C. v2 (Cowork, 04/10 soir), d'après les retours d'Axel :
//  - le style Redevco ; des rangées de 3 et de 4 photos au plus (pas de rangées de 1 ou 2 : la qualité des photos des agences ne le permet pas, et ce
//    sont des projets semblables) ; les « 4 lignes » de Julien ne sont pas une contrainte ;
//  - le texte dans une ou deux cases, pas plus : soit 4 × 4 avec 15 agences et le texte en première case, soit l'énoncé coupé en deux, la première
//    phrase en haut à gauche et la seconde en bas à droite ;
//  - l'intérieur (le couloir Bancontact) en photo n° 1 pour deux agences seulement : Belgrade et Bois-de-Villers (les deux citées par Julien) ;
//  - Brosse : 18 photos retenues (première sélection, à revoir).
// v3 (Cowork, 04/10 tard) : Brosse est un projet comme les quatre autres (pas de fiche pour l'instant) : cinq projets en haut, en rangées de 2 et une
// rangée d'un seul projet (comme Redevco) — 2-2-1 ou 2-1-2 —, puis les agences. La carte de la Home ne change pas (le portfolio et la carte n'ont pas
// à montrer les mêmes biens).
// v4 (Cowork, 04/10 vers minuit) : les choix d'Axel figés — projets en 2-2-1 avec Brosse seule en bas, 9 photos de Brosse dans son ordre (n° 1 : la 31),
// le même effet de survol partout (plus de nombre de photos sur les tuiles), et la mosaïque déléguée à Cowork : 4-3-4-3-4 au format entier. Plus de panneau.
// Ajout de Cowork (v2) : chaque photo peut garder son format entier (la largeur de la case suit le format de la photo, comme une rangée « justifiée ») ou
// être recadrée dans des cases égales.
//
// Rien dans design/maquette/ ni dans le site ne change : la page reprend realisations.html (en-tête, ouverture, les 4 projets, pied de page) tel que
// build.mjs le produit et remplace les projets, la section des agences et les anciens projets.
// Lancer depuis la racine du dépôt : node design/revue-mosaique/src/options.mjs
// Ouvrir : design/revue-mosaique/propositions/mosaique.html
import fs from 'node:fs';
import path from 'node:path';

const REPO = process.cwd();
const OUT = path.join(REPO, 'design/revue-mosaique/propositions');
const read = f => fs.readFileSync(path.join(REPO, f), 'utf8');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const IMG = '../../directions/img';

// ---------- données ----------
const projects = JSON.parse(read('data/projects.json'));
const byId = Object.fromEntries(projects.map(p => [p.id, p]));
// photo n° 1 : l'intérieur pour Belgrade et Bois-de-Villers seulement (Axel, 04/10) ; ailleurs, la première clé de selection
const INTERIEUR = { 'ing-belgrade': 'ing-belgrade-02', 'bnp-bois-de-villers': 'bnp-bois-de-villers-01' };
const bien = id => {
  const p = byId[id];
  let photos = p.selection && p.selection.length ? p.selection : [`${p.id}-01`];
  if (INTERIEUR[id]) photos = [INTERIEUR[id], ...photos.filter(k => k !== INTERIEUR[id])];
  return { id, ville: p.kind === 'agency' ? p.name : p.location, surface: p.surface, usage: p.use, photos };
};
// Brosse (ancien site, repris le 30/09) : pas encore dans data/projects.json ; les faits viennent du tableau ANCIENS de build.mjs (site 2020)
const BROSSE = {
  nom: 'Brosse', lieu: 'Forest', surface: '800 m²', projet: 'Rafraîchissement et division d’un ancien atelier de brosses',
  photos: [31, 16, 29, 27, 23, 61, 19, 22, 70].map(n => `brosse-${n}`),   // sélection et ordre d'Axel, 04/10 (23 h 50) ; n° 1 : la 31 plutôt que la 24, mieux en pleine largeur
};
const dims = k => {   // largeur et hauteur du fichier 800 px (en-tête JPEG)
  const buf = fs.readFileSync(path.join(REPO, 'design/directions/img', `${k}-s.jpg`));
  for (let i = 2; i < buf.length;) {
    const m = buf[i + 1], len = buf.readUInt16BE(i + 2);
    if (m >= 0xC0 && m <= 0xC3) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
    i += 2 + len;
  }
  throw new Error(k);
};
const grande = k => fs.existsSync(path.join(REPO, 'design/directions/img', `${k}.jpg`)) ? `${k}.jpg` : `${k}-s.jpg`;

// textes des cases : ceux de Julien (content/realisations.md), provisoires (lot 3, item 15)
const rmd = read('content/realisations.md');
const para = rmd.split('## Le programme agences')[1].replace(/<!--[\s\S]*?-->/g, '').split('##')[0].trim();
const [enonce, suite] = para.match(/^(.+?[.!?])\s+(.+)$/s).slice(1);
const CASES = {   // r : le format de la case (largeur / hauteur) quand les photos gardent leur format entier
  tout: { r: 1.5, cls: 'cas--enonce', html: `<p class="eyebrow eyebrow--sans-marge">Programme agences</p><div><p class="cas__enonce">${esc(enonce)}</p><p class="cas__suite">${esc(suite)}</p></div>` },
  debut: { r: 1.15, cls: 'cas--enonce', html: `<p class="eyebrow eyebrow--sans-marge">Programme agences</p><p class="cas__enonce">${esc(enonce)}</p>` },
  fin: { r: 1.15, cls: 'cas--phrase', html: `<p class="cas__phrase">${esc(suite)}</p>` },
};

// ---------- les deux structures de la mosaïque ----------
// Une rangée = la liste de ses cases, dans l'ordre : l'id d'un bien ou « cas:<clé> ». Les deux couloirs (Bois-de-Villers, Belgrade) ne se touchent pas ;
// les trois photos en hauteur (Pont-à-Celles, Perwez, Consolation) sont réparties.
// v4 : 4-3-4-3-4, photos au format entier (choix de Cowork, délégué par Axel : « celle qui convient le mieux aux photos ») — les rangées de 3 (cases les plus
// grandes) portent les photos les plus solides ; les plus faibles (Gilly, les deux couloirs, Tervuren, Welkenraedt) et les trois photos en hauteur sont dans
// les rangées de 4. Les deux couloirs ne se touchent pas.
const TEXTES = {
  alterne: {
    nom: '4-3-4-3-4 · 16 agences · l’énoncé en haut à gauche et en bas à droite',
    rangs: [
      ['cas:debut', 'bnp-braine-le-comte', 'bnp-pont-a-celles', 'bnp-jambes'],
      ['belfius-braine-l-alleud', 'ing-haaltert', 'belfius-mettet'],
      ['bnp-bois-de-villers', 'ing-tervuren', 'perwez', 'ing-welkenraedt'],
      ['wayez-27', 'ing-landen', 'waremme'],
      ['gilly', 'consolation', 'ing-belgrade', 'cas:fin'],
    ],
  },
};
const SEIZE = projects.filter(p => p.kind === 'agency' || p.kind === 'gallery').map(p => p.id).sort();
for (const [cle, t] of Object.entries(TEXTES)) {
  const ids = t.rangs.flat().filter(x => !x.startsWith('cas:'));
  if (new Set(ids).size !== ids.length || ids.some(x => !SEIZE.includes(x))) throw new Error(`${cle} : un bien en double ou inconnu`);
  if (t.rangs.some(r => r.length > 4 || r.length < 3)) throw new Error(`${cle} : des rangées de 3 ou 4 cases`);
}

// ---------- rendu ----------
const albums = [];   // visionneuse : un album par bien, Brosse compris
const albumDe = (cle, legende, photos) => {
  let k = albums.findIndex(a => a.cle === cle);
  if (k === -1) { albums.push({ cle, legende, l: photos.map(c => `${IMG}/${grande(c)}`) }); k = albums.length - 1; }
  return k;
};
const img = (c, sizes) => { const [w] = dims(c); return `<img src="${IMG}/${c}-s.jpg" srcset="${IMG}/${c}-s.jpg ${w}w, ${IMG}/${grande(c)} 1800w" sizes="${sizes}" alt="" loading="lazy" decoding="async">`; };
const fait = (et, val) => `<span><span class="fait__et">${et}</span><span class="fait__val">${esc(val)}</span></span>`;
const tuile = id => {
  const b = bien(id), [w, h] = dims(b.photos[0]);
  const k = albumDe(id, `<b>${esc(b.ville)}</b>${esc(b.surface)} · ${esc(b.usage)}`, b.photos);
  return `<button type="button" class="tuile" style="--r:${(w / h).toFixed(3)}" data-album="${k}" aria-label="${esc(b.ville)}, ${esc(b.surface)}, ${esc(b.usage)} — ${b.photos.length} photo${b.photos.length > 1 ? 's' : ''}">${img(b.photos[0], '(max-width:640px) 50vw, 520px')}`
    + `<span class="tuile__texte" aria-hidden="true"><span class="tuile__nom">${esc(b.ville)}</span><span class="tuile__faits">${fait('Surface', b.surface)}${fait('Usage', b.usage)}</span><span class="tuile__mobile">${esc(b.surface)}</span></span></button>`;
};
const cas = cle => `<div class="cas ${CASES[cle].cls} provisoire" style="--r:${CASES[cle].r}" title="texte provisoire (lot 3, item 15)"><div class="cas__in">${CASES[cle].html}</div></div>`;
const mosaique = (cle, t) => `<div class="mos" data-texte="${cle}">
${t.rangs.map(r => `  <div class="mos__rang mos__rang--${r.length}">${r.map(x => x.startsWith('cas:') ? cas(x.slice(4)) : tuile(x)).join('')}</div>`).join('\n')}
</div>`;
// ---------- les projets : les 4 projets à fiche et Brosse (v3, 04/10 tard) ----------
// Axel : Brosse est un projet comme les quatre autres (seule différence : pas de fiche, peut-être plus tard) ; cinq projets, donc une rangée d'un seul
// projet, comme chez Redevco : 2-2-1 ou 2-1-2, puis les agences. La rangée seule garde la hauteur des autres et prend toute la largeur.
const imgBloc = (c, focal, sizes) => {
  const [w] = dims(c), f = n => fs.existsSync(path.join(REPO, 'design/directions/img', n));
  const src = [`${IMG}/${c}-s.jpg ${w}w`, `${IMG}/${grande(c)} 1800w`];
  if (f(`${c}-l.jpg`)) src.push(`${IMG}/${c}-l.jpg ${c.startsWith('brosse') ? 2362 : 2800}w`);
  return `<img style="object-position:${focal}" src="${IMG}/${c}-s.jpg" srcset="${src.join(', ')}" sizes="${sizes}" alt="" decoding="async">`;
};
const SIZES = { 7: '(max-width:640px) calc(100vw - 40px), 58vw', 5: '(max-width:640px) calc(100vw - 40px), 42vw', 12: '(max-width:640px) calc(100vw - 40px), min(100vw, 1600px)' };
const brosseBloc = (largeur, focal) => {
  const k = albumDe('brosse', `<b>${BROSSE.nom}</b>${BROSSE.lieu} · ${BROSSE.surface}`, BROSSE.photos);
  return `<button type="button" class="bloc bloc--album" data-album="${k}" aria-label="${BROSSE.nom}, ${BROSSE.lieu}, ${BROSSE.surface} — ${BROSSE.photos.length} photos">${imgBloc(BROSSE.photos[0], focal, SIZES[largeur])}`
    + `<span class="bloc__texte"><span class="bloc__nom">${BROSSE.nom}</span><span class="bloc__faits">${fait('Lieu', BROSSE.lieu)}${fait('Surface', BROSSE.surface)}<span class="provisoire" title="intitulé du site 2020, provisoire"><span class="fait__et">Projet</span><span class="fait__val">${esc(BROSSE.projet)}</span></span></span><span class="bloc__mobile">${BROSSE.lieu} · ${BROSSE.surface}</span></span></button>`;
};
// les quatre blocs tels que build.mjs les produit (liens vers les fiches), repris de realisations.html ; sans leur id dans les variantes (ancres en double)
const original = read('design/maquette/realisations.html');
const blocDe = id => { const m = original.match(new RegExp(`<a class="bloc" id="${id}"[\\s\\S]*?</a>`)); if (!m) throw new Error(id); return m[0].replace(` id="${id}"`, ''); };
// v4 : 2-2-1, Brosse seule sur la dernière rangée (choix d'Axel, 04/10) ; la 31 cadrée à 40 % de sa hauteur (l'entrée et l'escalier, l'aile de l'atelier)
const PROJETS = {
  '221': { nom: '2-2-1 · Brosse seule en bas', rangs: [['a', blocDe('community'), blocDe('ateliers-118')], ['b', blocDe('the-bank'), blocDe('data-box')], ['seul', brosseBloc(12, '50% 40%')]] },
};
const projetsHtml = Object.entries(PROJETS).map(([c, v]) => `<div class="projets-var" data-projets="${c}">\n${v.rangs.map(([cls, ...b]) => `  <div class="alt__rang alt__rang--${cls}">${b.join('')}</div>`).join('\n')}\n</div>`).join('\n');

// ---------- la page : realisations.html de la maquette, sections des projets, des agences et des anciens projets remplacées ----------
let page = original;
const couper = (debutTxt, finTxt) => { const d = page.indexOf(debutTxt), f = page.indexOf(finTxt, d) + finTxt.length; if (d < 0) throw new Error(debutTxt); return [d, f]; };
const [p1, p2] = couper('<section class="large alt" id="projets"', '</section>');
page = page.slice(0, p1) + `<section class="large alt" id="projets" aria-label="Projets">\n${projetsHtml}\n</section>` + page.slice(p2);
const [d1] = couper('<section class="bloc-agences"', '</section>');
const [, f2] = couper('<section class="large anciens"', '</section>');
page = page.slice(0, d1) + `<section class="large mos-section" id="agences" aria-label="Programme agences">
${Object.entries(TEXTES).map(([c, t]) => mosaique(c, t)).join('\n')}
</section>` + page.slice(f2);
page = page
  .replace(/<script>window\.BIENS=.*?<\/script>/s, `<script>window.ALBUMS=${JSON.stringify(albums.map(({ legende, l }) => ({ legende, l })))};</script>`)
  .replace('<script src="maquette.js" defer></script>', '<script src="mosaique.js" defer></script>')
  .replace('<html lang="fr" data-page="realisations">', '<html lang="fr" data-page="realisations" data-projets="221" data-texte="alterne" data-cadrage="entiere">')
  .replace('<link rel="stylesheet" href="maquette.css">', '<link rel="stylesheet" href="../../maquette/maquette.css">\n<link rel="stylesheet" href="mosaique.css">')
  .replace(/(src|srcset|href)="\.\.\/directions\/img\//g, '$1="../../directions/img/')
  .replace(/, \.\.\/directions\/img\//g, ', ../../directions/img/')
  .replace('href="../../public/favicon.svg"', 'href="../../../public/favicon.svg"')
  .replace(/href="(index|realisations|engagements|projet-[a-z0-9-]+)\.html/g, 'href="../../maquette/$1.html')
  .replace('<title>Réalisations — Perpetual</title>', '<title>Réalisations — page de travail</title>');
if (/"\.\.\/directions\//.test(page)) throw new Error('chemin d\'image non réécrit');
if ((page.match(/data-album="\d+" aria-label="Brosse/g) || []).length !== 1) throw new Error('Brosse : un bloc');
if (!page.includes('data-cadrage="entiere"')) throw new Error('<html> : état par défaut');
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'mosaique.html'), page);
console.log(`mosaique.html (v4) : ${albums.length} albums (Brosse compris)`);
