// Lot 2b, items 10 et 11 (Cowork, 04/10/2026) : trois options pour la mosaïque des agences de la vue Réalisations, à comparer dans le navigateur.
// Retour de Julien du 30/09 : le carrousel (4 visibles, en boucle) devient une mosaïque sur 4 lignes, photos agrandies dans le style des 4 projets
// (nom sur la photo, faits au survol, même zoom), structure plus libre que 7/5 puis 5/7, avec des cases de texte (l'énoncé, et de temps en temps une
// phrase qui explique) ; photo n° 1 d'une agence : l'intérieur d'abord quand la façade est laide (Belgrade, Bois-de-Villers, revoir les autres).
//
// Page de travail, pas la maquette : elle reprend realisations.html (en-tête, ouverture, les 4 projets, pied de page) tel que build.mjs le produit et
// remplace la section des agences. Rien dans design/maquette/ ni dans le site ne change.
// Lancer depuis la racine du dépôt : node design/revue-mosaique/src/options.mjs (après node design/maquette/src/build.mjs si la maquette a changé).
// Ouvrir : design/revue-mosaique/propositions/mosaique.html?option=a|b|c&photo=actuelles|julien|plus (panneau en bas à gauche ; ?panneau=off le masque).
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
const bien = id => {
  const p = byId[id];
  const photos = p.selection && p.selection.length ? p.selection : [`${p.id}-01`];
  return { id, ville: p.kind === 'agency' ? p.name : p.location, surface: p.surface, usage: p.use, photos };
};
// photo n° 1 : trois jeux, au choix dans le panneau (item 11). « julien » : les deux agences qu'il a citées le 30/09 ; « plus » : aussi les deux
// façades que Cowork propose de regarder (voitures au premier plan à Tervuren, façade plate à Welkenraedt). L'intérieur, partout, c'est le couloir
// Bancontact : les seules photos intérieures reçues.
const N1 = {
  julien: { 'ing-belgrade': 'ing-belgrade-02', 'bnp-bois-de-villers': 'bnp-bois-de-villers-01' },
  plus: { 'ing-belgrade': 'ing-belgrade-02', 'bnp-bois-de-villers': 'bnp-bois-de-villers-01', 'ing-tervuren': 'ing-tervuren-03', 'ing-welkenraedt': 'ing-welkenraedt-02' },
};
const album = (b, jeu) => {
  const k = jeu && N1[jeu][b.id];
  return k ? [k, ...b.photos.filter(x => x !== k)] : b.photos;
};
const dims = k => {   // largeur et hauteur du fichier 800 px (en-tête JPEG), pour le srcset et le ratio
  const buf = fs.readFileSync(path.join(REPO, 'design/directions/img', `${k}-s.jpg`));
  for (let i = 2; i < buf.length;) {
    const m = buf[i + 1], len = buf.readUInt16BE(i + 2);
    if (m >= 0xC0 && m <= 0xC3) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
    i += 2 + len;
  }
  throw new Error(k);
};
const grande = k => fs.existsSync(path.join(REPO, 'design/directions/img', `${k}.jpg`)) ? `${k}.jpg` : `${k}-s.jpg`;

// textes des cases : tous tirés du matériel de Julien, provisoires (lot 3, item 15 : textes des cases de la mosaïque)
const rmd = read('content/realisations.md');
const para = rmd.split('## Le programme agences')[1].replace(/<!--[\s\S]*?-->/g, '').split('##')[0].trim();
const [enonce, suite] = para.match(/^(.+?[.!?])\s+(.+)$/s).slice(1);
const CASES = {
  enonce: { cls: 'cas--enonce', html: `<p class="eyebrow eyebrow--sans-marge">Programme agences</p><p class="cas__enonce">${esc(enonce)}</p>` },
  enonceTout: { cls: 'cas--enonce', html: `<p class="eyebrow eyebrow--sans-marge">Programme agences</p><div><p class="cas__enonce">${esc(enonce)}</p><p class="cas__suite">${esc(suite)}</p></div>` },
  suite: { cls: 'cas--phrase', html: `<p class="cas__phrase">${esc(suite)}</p>` },
  chiffre: { cls: 'cas--chiffre', html: `<p><span class="stat__value">30+</span><span class="stat__label">Agences bancaires transformées depuis 2022</span></p>` },
  usages: { cls: 'cas--phrase', html: `<p class="cas__phrase">Éducation, sport, commerce, logement, service public : cinq usages pour un même type de bâtiment.</p>` },
};

// ---------- les trois options ----------
// Chaque rangée : sa hauteur (h, en px à 1 521 px de large ; voir --h-* dans mosaique.css) et ses cases [contenu, largeur en 24es].
// Contenu : l'id d'un bien (data/projects.json) ou « cas:<clé> ». Ordre des biens commun aux trois options, pour comparer la structure seule :
// les 4 agences puis la galerie (Bois-de-Villers et Belgrade écartées l'une de l'autre : en couloir, elles ne doivent pas se toucher) ;
// les trois photos en hauteur (Pont-à-Celles, Perwez, Consolation) tombent dans les cases étroites.
const OPTIONS = {
  a: {
    nom: 'A — Rangées', note: '4 rangées de même hauteur, 4 photos par rangée, largeurs variées ; 3 cases de texte en 5e case',
    rangs: [
      ['h-a', [['cas:enonce', 5], ['bnp-braine-le-comte', 5], ['bnp-pont-a-celles', 4], ['bnp-jambes', 5], ['belfius-mettet', 5]]],
      ['h-a', [['belfius-braine-l-alleud', 7], ['bnp-bois-de-villers', 5], ['ing-haaltert', 6], ['ing-belgrade', 6]]],
      ['h-a', [['ing-landen', 5], ['cas:chiffre', 5], ['ing-tervuren', 5], ['perwez', 4], ['ing-welkenraedt', 5]]],
      ['h-a', [['gilly', 5], ['wayez-27', 5], ['consolation', 4], ['cas:suite', 5], ['waremme', 5]]],
    ],
  },
  b: {
    nom: 'B — Rangées alternées', note: '4 rangées, hautes (3 photos, plus grandes) et basses (5 photos) en alternance ; 2 cases de texte',
    rangs: [
      ['h-b-haut', [['cas:enonceTout', 6], ['bnp-braine-le-comte', 7], ['bnp-pont-a-celles', 5], ['bnp-jambes', 6]]],
      ['h-b-bas', [['belfius-mettet', 5], ['belfius-braine-l-alleud', 5], ['bnp-bois-de-villers', 5], ['ing-haaltert', 5], ['cas:chiffre', 4]]],
      ['h-b-haut', [['ing-belgrade', 7], ['ing-landen', 6], ['perwez', 5], ['ing-tervuren', 6]]],
      ['h-b-bas', [['ing-welkenraedt', 5], ['gilly', 5], ['consolation', 3], ['wayez-27', 6], ['waremme', 5]]],
    ],
  },
  c: {
    nom: 'C — Trois par rangée', note: '6 rangées de 3 cases, photos les plus grandes, rythme des 4 projets ; 2 cases de texte — plus que 4 lignes',
    rangs: [
      ['h-c', [['cas:enonceTout', 9], ['bnp-braine-le-comte', 10], ['bnp-pont-a-celles', 5]]],
      ['h-c', [['bnp-jambes', 10], ['belfius-mettet', 7], ['belfius-braine-l-alleud', 7]]],
      ['h-c', [['bnp-bois-de-villers', 8], ['ing-haaltert', 8], ['cas:chiffre', 8]]],
      ['h-c', [['ing-belgrade', 9], ['ing-landen', 6], ['ing-tervuren', 9]]],
      ['h-c', [['perwez', 5], ['ing-welkenraedt', 9], ['gilly', 10]]],
      ['h-c', [['wayez-27', 10], ['consolation', 5], ['waremme', 9]]],
    ],
  },
};
// contrôle : chaque option montre les 16 biens, une fois chacun, et chaque rangée fait 24
const SEIZE = [...projects.filter(p => p.kind === 'agency'), ...projects.filter(p => p.kind === 'gallery')].map(p => p.id).sort();
for (const [cle, o] of Object.entries(OPTIONS)) {
  const ids = o.rangs.flatMap(([, c]) => c.map(([x]) => x)).filter(x => !x.startsWith('cas:')).sort();
  if (JSON.stringify(ids) !== JSON.stringify(SEIZE)) throw new Error(`option ${cle} : les 16 biens, une fois chacun`);
  o.rangs.forEach(([, c], i) => { const s = c.reduce((t, [, w]) => t + w, 0); if (s !== 24) throw new Error(`option ${cle}, rangée ${i + 1} : ${s} / 24`); });
}

// ---------- rendu ----------
const ordreBiens = [];   // index des albums de la visionneuse
const tuile = (id, largeur) => {
  const b = bien(id);
  let k = ordreBiens.indexOf(id); if (k === -1) { ordreBiens.push(id); k = ordreBiens.length - 1; }
  // une <img> par jeu de photo n° 1 quand il change la photo, sinon une seule ; le CSS montre celle du jeu choisi (html[data-photo])
  const jeux = [['actuelles', album(b)[0]], ['julien', album(b, 'julien')[0]], ['plus', album(b, 'plus')[0]]];
  const vues = [...new Set(jeux.map(([, c]) => c))];
  const imgs = vues.map(c => {
    const pour = jeux.filter(([, x]) => x === c).map(([j]) => j).join(' ');
    const [w] = dims(c);
    return `<img data-pour="${pour}" src="${IMG}/${c}-s.jpg" srcset="${IMG}/${c}-s.jpg ${w}w, ${IMG}/${grande(c)} 1800w" sizes="(max-width:640px) 50vw, ${Math.round(largeur * 60.6 * 1.4)}px" alt="" loading="lazy" decoding="async">`;
  }).join('');
  const fait = (et, val) => `<span><span class="fait__et">${et}</span><span class="fait__val">${esc(val)}</span></span>`;
  return `<button type="button" class="tuile" data-bien="${k}" aria-label="${esc(b.ville)}, ${esc(b.surface)}, ${esc(b.usage)} — ${b.photos.length} photos">${imgs}`
    + `<span class="tuile__compte" aria-hidden="true">${b.photos.length} photos</span>`
    + `<span class="tuile__texte" aria-hidden="true"><span class="tuile__nom">${esc(b.ville)}</span><span class="tuile__faits">${fait('Surface', b.surface)}${fait('Usage', b.usage)}</span><span class="tuile__mobile">${esc(b.surface)}</span></span></button>`;
};
const cas = cle => `<div class="cas ${CASES[cle].cls} provisoire" title="texte provisoire (lot 3, item 15)">${CASES[cle].html}</div>`;
const optionHtml = (cle, o) => `<div class="mos" data-option="${cle}">
${o.rangs.map(([h, cases]) => `  <div class="mos__rang ${h}" style="grid-template-columns:${cases.map(([, w]) => `${w}fr`).join(' ')}">${cases.map(([x, w]) => x.startsWith('cas:') ? cas(x.slice(4)) : tuile(x, w)).join('')}</div>`).join('\n')}
</div>`;
const mosaiques = Object.entries(OPTIONS).map(([c, o]) => optionHtml(c, o)).join('\n');
const albums = ordreBiens.map(id => {
  const b = bien(id);
  return { ville: b.ville, surface: b.surface, usage: b.usage, l: { actuelles: album(b).map(c => `${IMG}/${grande(c)}`), julien: album(b, 'julien').map(c => `${IMG}/${grande(c)}`), plus: album(b, 'plus').map(c => `${IMG}/${grande(c)}`) } };
});

// ---------- la page : realisations.html de la maquette, section des agences remplacée ----------
let page = read('design/maquette/realisations.html');
const debut = page.indexOf('<section class="bloc-agences"'), fin = page.indexOf('</section>', debut) + '</section>'.length;
if (debut < 0) throw new Error('realisations.html : section des agences introuvable');
const panneau = `<aside class="mo-panneau" aria-label="Options de la mosaïque (page de travail)">
  <p class="mo-panneau__titre">Mosaïque des agences — page de travail</p>
  <fieldset><legend>Option</legend>${Object.entries(OPTIONS).map(([c, o]) => `<label><input type="radio" name="option" value="${c}"> ${esc(o.nom)}</label>`).join('')}</fieldset>
  <fieldset><legend>Photo n° 1</legend><label><input type="radio" name="photo" value="actuelles"> actuelles</label><label><input type="radio" name="photo" value="julien"> intérieur : Belgrade, Bois-de-Villers</label><label><input type="radio" name="photo" value="plus"> + Tervuren, Welkenraedt</label></fieldset>
  <p class="mo-panneau__note" data-note></p>
</aside>`;
page = page.slice(0, debut) + `<section class="large mos-section" id="agences" aria-label="Programme agences">
${mosaiques}
</section>` + page.slice(fin);
page = page
  .replace(/<script>window\.BIENS=.*?<\/script>/s, `<script>window.ALBUMS=${JSON.stringify(albums)};window.NOTES=${JSON.stringify(Object.fromEntries(Object.entries(OPTIONS).map(([c, o]) => [c, o.note])))};</script>`)
  .replace('<script src="maquette.js" defer></script>', `${panneau}\n<script src="mosaique.js" defer></script>`)
  .replace('<link rel="stylesheet" href="maquette.css">', '<link rel="stylesheet" href="../../maquette/maquette.css">\n<link rel="stylesheet" href="mosaique.css">')
  .replace(/(src|srcset|href)="\.\.\/directions\/img\//g, '$1="../../directions/img/')
  .replace(/, \.\.\/directions\/img\//g, ', ../../directions/img/')
  .replace('href="../../public/favicon.svg"', 'href="../../../public/favicon.svg"')
  .replace(/href="(index|realisations|engagements|projet-[a-z0-9-]+)\.html/g, 'href="../../maquette/$1.html')
  .replace('<title>Réalisations — Perpetual</title>', '<title>Mosaïque des agences — options</title>');
if (/"\.\.\/directions\//.test(page)) throw new Error('chemin d\'image non réécrit');
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'mosaique.html'), page);
console.log(`mosaique.html : ${Object.keys(OPTIONS).length} options, ${ordreBiens.length} biens`);
