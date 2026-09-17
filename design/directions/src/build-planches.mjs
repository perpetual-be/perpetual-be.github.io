// Planche typo (8 serifs × 3 sans, avec le wordmark) + planche « élément de la bande » — Perpetual lot 2
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../..');   // racine du dépôt
const OUT = path.resolve(HERE, '..');           // design/directions/

const markPath = fs.readFileSync(path.join(REPO, 'public/favicon.svg'), 'utf8').match(/<g[\s\S]*<\/g>/)[0];
const mark = (cls = '') => `<svg class="mark ${cls}" viewBox="0 0 100 104.02" fill="currentColor" aria-hidden="true">${markPath}</svg>`;
const maskData = 'data:image/png;base64,' + fs.readFileSync(path.join(HERE, 'wordmark-mask.png')).toString('base64');

const serifs = [
  { id: 'newsreader', name: 'Newsreader', family: "'Newsreader'", file: 'newsreader-latin-opsz', italic: true, wRange: '200 800', w: 400,
    note: 'Planche A. Éditoriale, tradition « journal », axe optique : chaude, classique, faite pour lire.' },
  { id: 'instrument', name: 'Instrument Serif', family: "'Instrument Serif'", file: 'instrument-serif-latin-400', italic: true, fixed: true, w: 400,
    note: 'Planche B. Étroite, sèche, affiche seulement — « architecte ».' },
  { id: 'young', name: 'Young Serif', family: "'Young Serif'", file: 'young-serif-latin-400', italic: false, fixed: true, w: 400,
    note: 'La plus proche de l’esprit Marist (Jack & Jill) : contemporaine, terminaisons douces, faible contraste. Pas d’italique.' },
  { id: 'fraunces', name: 'Fraunces', family: "'Fraunces'", file: 'fraunces-latin-opsz', italic: true, wRange: '100 900', w: 400,
    note: 'Contemporaine, souple, un peu « old style » adouci. Très bon axe optique : fine en grand, robuste en petit.' },
  { id: 'sourceserif', name: 'Source Serif 4', family: "'Source Serif 4'", file: 'source-serif-4-latin-opsz', italic: true, wRange: '200 900', w: 400,
    note: 'Sobre, transitionnelle, neutre — la serif « qui ne fait pas de bruit ». Excellente en texte comme en titre.' },
  { id: 'literata', name: 'Literata', family: "'Literata'", file: 'literata-latin-opsz', italic: true, wRange: '200 900', w: 400,
    note: 'Dessinée pour la lecture longue (Google Play Books). Calme, un peu plus large que Source Serif.' },
  { id: 'besley', name: 'Besley', family: "'Besley'", file: 'besley-latin-wght', italic: true, wRange: '400 900', w: 400,
    note: 'Empattements rectangulaires (Clarendon) : solide, terrienne, « brique et béton ». La plus différente des autres.' },
  { id: 'playfair', name: 'Playfair Display', family: "'Playfair Display'", file: 'playfair-display-latin-wght', italic: true, wRange: '400 900', w: 400,
    note: 'Celle de Redevco. Contraste fort, à la limite du Didone — élégante, mais c’est elle qui tire vers le luxe.' },
];
const sansList = [
  { id: 'inter', name: 'Inter', family: "'Inter'", file: 'inter-latin-wght', wRange: '100 900', lockW: 300,
    note: 'Planche A. Neutre, très lisible, omniprésente sur le web.' },
  { id: 'instrsans', name: 'Instrument Sans', family: "'Instrument Sans'", file: 'instrument-sans-latin-wght', wRange: '400 700', lockW: 400,
    note: 'Planche B. Grotesque un peu plus dessinée, légèrement condensée.' },
  { id: 'jost', name: 'Jost', family: "'Jost'", file: 'jost-latin-wght', wRange: '100 900', lockW: 300,
    note: 'Géométrique (famille Futura). En graisse légère et interlettrée, c’est la plus proche des lettres du wordmark actuel — en plus dessinée.' },
];

const fontFaces = [
  ...serifs.map(s => s.fixed
    ? `@font-face{font-family:${s.family};font-style:normal;font-weight:400;src:url(fonts/${s.file}-normal.woff2) format("woff2")}` + (s.italic ? `\n@font-face{font-family:${s.family};font-style:italic;font-weight:400;src:url(fonts/${s.file}-italic.woff2) format("woff2")}` : '')
    : `@font-face{font-family:${s.family};font-style:normal;font-weight:${s.wRange};src:url(fonts/${s.file}-normal.woff2) format("woff2-variations")}` + (s.italic ? `\n@font-face{font-family:${s.family};font-style:italic;font-weight:${s.wRange};src:url(fonts/${s.file}-italic.woff2) format("woff2-variations")}` : '')),
  ...sansList.map(s => `@font-face{font-family:${s.family};font-style:normal;font-weight:${s.wRange};src:url(fonts/${s.file}-normal.woff2) format("woff2-variations")}`),
].join('\n');

const css = `
${fontFaces}
:root{--ink:#26231F;--ink2:#6B655C;--ink3:#9A948A;--line:#E6E1D6;--accent:#9A7A3B;--deep:#8A6B2F;--paper:#F6F1E6;--sans:"Inter",system-ui,sans-serif}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#ECEAE6;color:var(--ink);font-family:var(--sans);font-size:15px;line-height:1.5;-webkit-font-smoothing:antialiased}
.head{padding:40px 48px 24px;border-bottom:1px solid #D9D5CD}
.head h1{font-size:22px;font-weight:600;letter-spacing:-.01em}
.head p{max-width:820px;color:#5C5850;font-size:14px;margin-top:6px}
.sec{padding:32px 48px 8px}
.label{font-size:13px;font-weight:600;color:#5C5850;margin-bottom:12px}
.card{background:#fff;border:1px solid #E3DFD7;padding:28px 36px 30px;margin-bottom:22px}
.card__head{display:flex;justify-content:space-between;align-items:baseline;gap:24px;margin-bottom:18px;border-bottom:1px solid var(--line);padding-bottom:12px}
.card__name{font-size:15px;font-weight:600}
.card__note{font-size:13px;color:var(--ink2);max-width:760px;text-align:right}
.row{display:grid;grid-template-columns:7fr 5fr;gap:48px;align-items:start}
.h1{font-size:52px;line-height:1.08;letter-spacing:-.012em;font-weight:400;text-wrap:balance;max-width:16ch}
.nums{display:flex;gap:40px;align-items:baseline;margin-top:20px}
.num{font-size:58px;line-height:1;color:var(--accent);font-variant-numeric:tabular-nums;font-weight:400}
.num small{display:block;font-family:var(--sans);font-size:13px;color:var(--ink2);margin-top:8px;font-weight:400}
.chap{font-size:32px;line-height:1.15;font-weight:400;margin-bottom:10px}
.chap-num{font-size:15px;color:var(--accent);letter-spacing:.06em;margin-bottom:6px}
.p{font-family:var(--sans);font-size:17px;line-height:1.6;max-width:52ch}
.sig{font-style:italic;font-size:24px;color:var(--deep);margin-top:16px}
.sig.noit{font-style:normal}
.lockups{margin-top:22px;padding-top:18px;border-top:1px solid var(--line);display:flex;gap:56px;align-items:center;flex-wrap:wrap}
.lockup{display:inline-flex;align-items:center;gap:16px;color:var(--ink)}
.mark{width:26px;height:auto;color:var(--accent);flex:none}
.word{font-size:28px;letter-spacing:.26em;text-transform:uppercase;line-height:1;position:relative;top:1px}
.lockup__note{font-size:12px;color:var(--ink3);margin-left:-40px}
.word--png{display:inline-block;width:218px;aspect-ratio:390/47;background:var(--ink);-webkit-mask:url(${maskData}) center/contain no-repeat;mask:url(${maskData}) center/contain no-repeat}
/* sans */
.sans .nav{display:flex;gap:36px;font-size:15px;font-weight:500;margin-bottom:18px}
.sans .nav a{position:relative;padding:6px 0;color:var(--ink);text-decoration:none}
.sans .nav a.on::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:var(--accent)}
.sans .meta{font-size:13px;color:var(--ink3);margin-top:14px}
.sans .lab{font-size:14px;color:var(--ink2);margin-top:6px}
.sans .p{font-family:inherit}
.sans .word{letter-spacing:.3em}
/* bande */
.band{position:relative;overflow:hidden;background:var(--paper);padding:44px 0 40px;margin:0 -48px}
.band .in{max-width:1200px;margin:0 auto;padding:0 40px;position:relative;z-index:1}
.stats{display:grid;grid-template-columns:repeat(4,1fr)}
.stat{padding:4px 32px 4px 28px;border-left:1px solid var(--line)}
.stat:first-child{border-left:0;padding-left:0}
.stat__v{font-family:"Newsreader";font-size:58px;line-height:1;color:var(--accent);font-variant-numeric:tabular-nums}
.stat__l{font-size:14px;color:var(--ink2);margin-top:10px;max-width:18ch;line-height:1.4}
.deco{position:absolute;inset:0;pointer-events:none}
.deco-l,.deco-r{position:absolute;top:0;height:100%;width:420px}
.deco-l{left:0}
.deco-r{right:0}
.bnote{font-size:13px;color:var(--ink2);margin:10px 0 26px}
.chip{display:inline-block;width:12px;height:12px;vertical-align:-1px;margin-right:6px;border:1px solid rgba(0,0,0,.08)}
`;

function serifCard(s) {
  const it = s.italic ? '' : ' noit';
  return `<div class="card" style="font-family:${s.family}">
  <div class="card__head"><div class="card__name" style="font-family:var(--sans)">${s.name}</div><div class="card__note" style="font-family:var(--sans)">${s.note}</div></div>
  <div class="row">
    <div>
      <div class="h1">Le trait d’union entre les idées et le capital.</div>
      <div class="nums"><div class="num">2002<small>Actifs depuis</small></div><div class="num">30+<small>Agences transformées</small></div><div class="num">19<small>Jours entre chaque bien</small></div><div class="num">24<small>Projets en cours</small></div></div>
    </div>
    <div>
      <div class="chap-num" style="font-family:${s.family}">02</div>
      <div class="chap">Ce que nous y avons vu</div>
      <p class="p">Une surface unique qui pouvait en accueillir trois. Le service bancaire maintenu sur ce qu’il lui faut, une vitrine rendue au commerce, et les niveaux supérieurs libérés pour l’habitat.</p>
      <div class="sig${it}">Everything is already inside.${s.italic ? '' : ' <span style="font-family:var(--sans);font-size:12px;color:var(--ink3);font-style:normal">(pas d’italique)</span>'}</div>
    </div>
  </div>
  <div class="lockups">
    <span class="lockup">${mark()}<span class="word" style="font-weight:${s.w}">Perpetual</span></span>
    <span class="lockup">${mark()}<span class="word" style="font-weight:${s.w};letter-spacing:.12em">Perpetual</span></span>
    <span class="lockup__note" style="font-family:var(--sans)">← le wordmark recomposé dans cette serif, interlettrage large puis serré</span>
  </div>
</div>`;
}

function sansCard(s, withWord = true) {
  return `<div class="card sans" style="font-family:${s.family}">
  <div class="card__head"><div class="card__name">${s.name}</div><div class="card__note">${s.note}</div></div>
  <div class="row">
    <div>
      <nav class="nav"><a class="on" href="#">Projets</a><a href="#">Engagements</a><a href="#">Contact</a></nav>
      <p class="p">Le monde change. Ce n’est pas une mauvaise passe, c’est un changement de paradigme. Le commerce de détail se meurt, celui du service et de l’usage se développe. On vit et on travaille autrement, ensemble.</p>
      <div class="lab">Molenbeek-Saint-Jean · 1 200 m² · Treize ateliers dans une ancienne usine de colle</div>
      <div class="meta">Rue des Mineurs, la façade · Localisation · Surface · Usage</div>
    </div>
    ${withWord ? `<div>
      <div class="lockups" style="margin-top:0;padding-top:0;border-top:0;flex-direction:column;align-items:flex-start;gap:22px">
        <span class="lockup">${mark()}<span class="word--png"></span><span class="lockup__note" style="margin-left:8px">wordmark actuel (tracé)</span></span>
        <span class="lockup">${mark()}<span class="word" style="font-weight:${s.lockW}">Perpetual</span><span class="lockup__note" style="margin-left:8px">recomposé en ${s.name} ${s.lockW}</span></span>
        <span class="lockup">${mark()}<span class="word" style="font-weight:${s.lockW + 100};letter-spacing:.18em">Perpetual</span><span class="lockup__note" style="margin-left:8px">graisse ${s.lockW + 100}, interlettrage serré</span></span>
      </div>
    </div>` : ''}
  </div>
</div>`;
}

// ---------- bande : variantes d'élément ----------
const stats = [['2002', 'Actifs depuis'], ['30+', 'Agences bancaires transformées en quatre ans'], ['19', 'Jours entre chaque bien livré'], ['24', 'Projets en cours']];
const statsHtml = `<div class="stats">${stats.map(([v, l]) => `<div class="stat"><div class="stat__v">${v}</div><div class="stat__l">${l}</div></div>`).join('')}</div>`;
const gold = '#D9C9A3', goldMid = '#C9B58A';
const L = (d) => `<svg class="deco-l" viewBox="0 0 420 220" preserveAspectRatio="none"><path d="${d}" fill="none" stroke="${goldMid}" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>`;
const R = (d) => `<svg class="deco-r" viewBox="0 0 420 220" preserveAspectRatio="none"><path d="${d}" fill="none" stroke="${goldMid}" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>`;
const decos = {
  none: '',
  // 1a : bord gauche → bord du haut ; miroir : bord droit → bord du bas
  arcs: L('M 0 200 A 520 520 0 0 1 180 0') + R('M 420 20 A 520 520 0 0 1 240 220'),
  // 1b : chaque arc touche haut et bas
  arcsEdge: L('M 0 220 A 520 520 0 0 1 150 0') + R('M 420 0 A 520 520 0 0 1 270 220'),
  // 1c : coins — haut-gauche du bord du haut au bord gauche ; bas-droit du bord du bas au bord droit
  arcsCorner: L('M 140 0 A 300 300 0 0 0 0 140') + R('M 280 220 A 300 300 0 0 0 420 80'),
  // 1d / 1e : mêmes géométries, droites
  linesEdge: L('M 0 220 L 150 0') + R('M 270 220 L 420 0'),
  linesCorner: L('M 0 140 L 140 0') + R('M 280 220 L 420 80'),
  phi: `<svg viewBox="0 0 100 104.02" width="300" height="312" style="position:absolute;right:-40px;top:-30px;color:#EFE7D3" fill="currentColor">${markPath}</svg>`,
  ring: `<svg class="deco-r" viewBox="0 0 420 220" preserveAspectRatio="xMaxYMid meet"><circle cx="270" cy="110" r="110" fill="none" stroke="${goldMid}" stroke-width="1"/><circle cx="270" cy="110" r="150" fill="none" stroke="${gold}" stroke-width="1"/></svg>`,
};
const bandVariants = [
  ['0 · La bande telle quelle', ['none'], 'Rien. Très simple, très pur.'],
  ['1a · Deux arcs en miroir — bord gauche → bord du haut, bord droit → bord du bas', ['arcs'], 'Deux fragments d’une même grande orbite ; même famille géométrique que la roue.'],
  ['4 · Le Φ en filigrane', ['phi'], 'Très pâle, coupé par le bord — le seul endroit du site où le Φ apparaît en grand.'],
  ['6 · Anneaux concentriques', ['ring'], 'Deux cercles fins ancrés au bord droit ; pourraient devenir la piste de la roue.'],
];

const today = '18/09/2026';
const keepSerifText = ['newsreader', 'sourceserif', 'literata', 'playfair'];
const keepSerifWord = ['sourceserif', 'literata', 'playfair'];
const keepSansText = ['inter', 'instrsans'];
const keepSansWord = ['jost'];
function serifCardShort(s) {
  const text = keepSerifText.includes(s.id), word = keepSerifWord.includes(s.id);
  if (!text && !word) return '';
  if (!text) return `<div class="card" style="font-family:${s.family}"><div class="card__head"><div class="card__name" style="font-family:var(--sans)">${s.name} — wordmark seulement</div><div class="card__note" style="font-family:var(--sans)">${s.note}</div></div>
  <div class="lockups" style="margin-top:0;padding-top:0;border-top:0"><span class="lockup">${mark()}<span class="word" style="font-weight:${s.w}">Perpetual</span></span><span class="lockup">${mark()}<span class="word" style="font-weight:${s.w};letter-spacing:.12em">Perpetual</span></span></div></div>`;
  let card = serifCard(s);
  if (!word) card = card.replace(/<div class="lockups">[\s\S]*?<\/div>\n<\/div>$/, '</div>');
  return card;
}
function sansCardShort(s) {
  const text = keepSansText.includes(s.id), word = keepSansWord.includes(s.id);
  if (!text && !word) return '';
  if (!text) return `<div class="card sans" style="font-family:${s.family}"><div class="card__head"><div class="card__name">${s.name} — wordmark seulement</div><div class="card__note">${s.note}</div></div>
  <div class="lockups" style="margin-top:0;padding-top:0;border-top:0"><span class="lockup">${mark()}<span class="word--png"></span><span class="lockup__note" style="margin-left:8px">tracé actuel</span></span><span class="lockup">${mark()}<span class="word" style="font-weight:${s.lockW + 100};letter-spacing:.18em">Perpetual</span><span class="lockup__note" style="margin-left:8px">${s.name} ${s.lockW + 100}, interlettrage serré — le choix d’Axel</span></span></div></div>`;
  return sansCard(s, word);
}
const typoHtml = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Perpetual — Planche typo</title><style>${css}</style></head><body>
<div class="head"><h1>Planche typo — la short-list d’Axel (18/09), les écartées repliées en bas</h1><p>Texte et titres : Newsreader, Source Serif 4, Literata, Playfair Display. Wordmark en serif : Source Serif 4, Literata, Playfair Display. Texte courant : Inter, Instrument Sans. Wordmark en sans : Jost 400 interlettrage serré, d’office. Chaque serif dans ses quatre rôles réels (accroche 52 px, chiffres 58 px, titre de chapitre 32 px, signature italique 24 px), plus le wordmark PERPETUAL recomposé. Palette A. Toutes libres et auto-hébergeables. Perpetual · lot 2 · ${today}</p></div>
<div class="sec"><div class="label">Serifs — short-list</div>${serifs.map(serifCardShort).join('\n')}</div>
<div class="sec"><div class="label">Sans — short-list</div>${sansList.map(sansCardShort).join('\n')}</div>
<div class="sec"><details><summary class="label" style="cursor:pointer">Écartées le 18/09 — Instrument Serif, Young Serif, Fraunces, Besley (et Jost hors wordmark)</summary>${serifs.filter(x => !keepSerifText.includes(x.id)).map(serifCard).join('\n')}${sansList.filter(x => !keepSansText.includes(x.id)).map(sansCard).join('\n')}</details></div>
<div class="sec" style="padding-bottom:40px"><p style="font-size:12px;color:#8A8680">Le wordmark recomposé n’engage à rien vis-à-vis de Julien : il a demandé de garder le logo. C’est une pièce pour ta revue prévue au lot 2 ; rien ne part chez lui sans qu’il ait d’abord dit oui à l’idée d’y toucher.</p></div>
</body></html>`;

const bandHtml = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Perpetual — Bande des chiffres, variantes d’élément</title><style>${css}</style></head><body>
<div class="head"><h1>La bande des chiffres — short-list finale du 18/09 : 0, 1a, 4, 6</h1><p>Même bande, même palette A. Les éléments sont ancrés aux bords gauche et droit de la bande, quelle que soit la largeur de l’écran. Écartées : les filets (5, 4b, 6b) qui redisent une frontière que la couleur suffit à dire ; 1b–1e, traversées trop nerveuses ou droites trop dures. Ces quatre-là sont la bascule « bande » de la maquette. Or clair <span class="chip" style="background:${gold}"></span>${gold} · or moyen <span class="chip" style="background:${goldMid}"></span>${goldMid} · filigrane <span class="chip" style="background:#EFE7D3"></span>#EFE7D3. Perpetual · lot 2 · ${today}</p></div>
<div class="sec">${bandVariants.map(([t, ks, n]) => `<div class="label">${t}</div><div class="band"><div class="deco">${ks.map(k => decos[k]).join('')}</div><div class="in">${statsHtml}</div></div><div class="bnote">${n}</div>`).join('\n')}</div>
</body></html>`;

fs.writeFileSync(path.join(OUT, 'planche-typo.html'), typoHtml);

fs.writeFileSync(path.join(OUT, 'planche-bande.html'), bandHtml);
console.log('ok');
