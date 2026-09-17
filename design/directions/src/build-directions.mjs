// Génère direction-a.html et direction-b.html — planches de direction visuelle Perpetual (lot 2)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../..');   // racine du dépôt
const OUT = path.resolve(HERE, '..');           // design/directions/

// ---------- données ----------
const site = JSON.parse(fs.readFileSync(path.join(REPO, 'data/site.json'), 'utf8'));
const projects = JSON.parse(fs.readFileSync(path.join(REPO, 'data/projects.json'), 'utf8'));
const partners = JSON.parse(fs.readFileSync(path.join(REPO, 'data/partners.json'), 'utf8'));
const byId = Object.fromEntries(projects.map(p => [p.id, p]));

const stats = [
  { value: '2002', label: 'Actifs depuis' },
  { value: '30+', label: 'Agences bancaires transformées en quatre ans' },
  { value: '19', label: 'Jours entre chaque bien livré' },
  { value: '24', label: 'Projets en cours' },
];
const portfolio = { title: '11 150 m² en cours de transformation', items: [
  { label: 'Industrial', percent: 41 }, { label: 'Residential', percent: 34 }, { label: 'Retail', percent: 25 } ] };

const home = {
  h1: 'Le trait d’union entre les idées et le capital.',
  p1: 'Le monde change. Ce n’est pas une mauvaise passe, c’est un changement de paradigme. Le commerce de détail se meurt, celui du service et de l’usage se développe. On vit et on travaille autrement, ensemble. Les infrastructures ne se privatisent plus : elles se partagent.',
  p2: 'Notre attention se porte là où l’usage d’un bâtiment peut être changé pour le rendre à nouveau pertinent — en phase avec les enjeux sociaux et économiques d’aujourd’hui.',
  signature: 'Everything is already inside.',
};

const four = [
  { id: 'ateliers-118', line: 'Molenbeek-Saint-Jean · 1 200 m² · Treize ateliers dans une ancienne usine de colle', img: 'ateliers-118-05-s.jpg' },
  { id: 'the-bank', line: 'Liège · 1 100 m² · Une agence devenue bijouterie, Bancontact et logements', img: 'the-bank-01-s.jpg' },
  { id: 'data-box', line: 'Jemelle · 4 200 m² sur un hectare · Un site technique dont l’avenir reste ouvert', img: 'data-box-02-s.jpg' },
  { id: 'community', line: 'Uccle · 14 unités · Quatorze unités autour d’espaces partagés', img: 'community-05-s.jpg' },
];

const collectif = {
  p1: 'Nous n’avons aucun salarié. Une cinquantaine de personnes travaillent régulièrement avec nous. Au cœur, trois associés aux compétences complémentaires.',
  p2: 'Autour : des architectes choisis pour leur région et leur style, des géomètres, des avocats spécialisés, des agents immobiliers, un réseau d’apporteurs d’affaires, des entreprises générales de construction et les corps de métier spécialisés qui les accompagnent, des gestionnaires, des investisseurs privés qui nous font confiance.',
  chute: 'Personne n’est tenu de revenir. Tous reviennent.',
};

const gallery = [
  { id: 'bnp-braine-le-comte', img: 'bnp-braine-le-comte-01-s.jpg', name: 'Braine-le-Comte', meta: '600 m² · Commerce & équipement public' },
  { id: 'ing-tervuren', img: 'ing-tervuren-01-s.jpg', name: '# Bank 8 — Tervuren', meta: '320 m² · Commerces & parkings' },
  { id: 'waremme', img: 'waremme-01-s.jpg', name: 'Corner — Waremme', meta: '110 m² · Commerce' },
];

const bank = byId['the-bank'];

// ---------- logos partenaires (encre, inline, sans métadonnées) ----------
function partnerSvg(file) {
  let s = fs.readFileSync(path.join(REPO, 'public/partners/encre', path.basename(file)), 'utf8');
  s = s.replace(/<\?xml[^>]*>/, '').replace(/<metadata>[\s\S]*?<\/metadata>/g, '').replace(/xmlns:c2pa="[^"]*"/, '');
  s = s.replace(/\swidth="[^"]*"/, '').replace(/\sheight="[^"]*"/, '');
  return s.trim();
}
const partnersHtml = partners.map(p => `<span class="partner" title="${p.name}">${partnerSvg(p.logoInk || p.logoMono || p.logo)}</span>`).join('\n');

// ---------- logo Perpetual ----------
const markPath = fs.readFileSync(path.join(REPO, 'public/favicon.svg'), 'utf8').match(/<g[\s\S]*<\/g>/)[0];
const markSvg = `<svg class="logo__mark" viewBox="0 0 100 104.02" fill="currentColor" aria-hidden="true">${markPath}</svg>`;
const maskData = 'data:image/png;base64,' + fs.readFileSync(path.join(HERE, 'wordmark-mask.png')).toString('base64');

// ---------- contraste ----------
function lum(hex) { const c = hex.replace('#', ''); const [r, g, b] = [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
function contrast(a, b) { const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x); return ((l1 + 0.05) / (l2 + 0.05)).toFixed(1); }

// ---------- thèmes ----------
const themes = {
  a: {
    key: 'a', title: 'Direction A — Blanc et or', short: 'A · Blanc et or',
    intro: 'Blanc, texte anthracite chaud, l’or mat du Φ comme seule couleur — pour les éléments de design, jamais pour un paragraphe. Une seule bande colorée sous l’accroche.',
    serif: '"Newsreader Variable", Georgia, serif', sans: '"Inter Variable", system-ui, sans-serif',
    fontFaces: `
@font-face{font-family:"Newsreader Variable";font-style:normal;font-weight:200 800;src:url(fonts/newsreader-latin-opsz-normal.woff2) format("woff2-variations")}
@font-face{font-family:"Newsreader Variable";font-style:italic;font-weight:200 800;src:url(fonts/newsreader-latin-opsz-italic.woff2) format("woff2-variations")}
@font-face{font-family:"Inter Variable";font-style:normal;font-weight:100 900;src:url(fonts/inter-latin-wght-normal.woff2) format("woff2-variations")}`,
    vars: { bg: '#FFFFFF', paper: '#F6F1E6', ink: '#26231F', ink2: '#6B655C', ink3: '#9A948A', line: '#E6E1D6', accent: '#9A7A3B', accentDeep: '#8A6B2F', accentSoft: '#B8975A', gold: '#9A7A3B', logoMark: '#9A7A3B', logoWord: '#26231F' },
    logoNote: 'Sur le site : Φ à l’or mat du site, nom en anthracite — le « retravail des couleurs » permis par Julien.',
    typoNote: 'Newsreader (serif, axe optique) pour l’accroche, les titres, les chiffres et la citation · Inter pour le texte courant, la navigation et les étiquettes.',
    gamme: [
      ['#684E1E', 'Φ du logo, favicon'], ['#8A6B2F', 'liens, texte accent'], ['#9A7A3B', 'chiffres, filets épais — recommandé'], ['#B8975A', 'filets fins, survol'],
      ['#D1AB69', 'favicon en mode sombre'], ['#CFC56B', 'site actuel — trop pâle sur blanc'], ['#F6F1E6', 'bande sable'],
    ],
    heroPhoto: null,
    alts: [ ['Or mat', '#9A7A3B', '#F6F1E6'], ['Vert profond', '#3E5B4C', '#EEF2EE'], ['Brique', '#A85A3C', '#F7EEE9'] ],
  },
  b: {
    key: 'b', title: 'Direction B — Noir et blanc', short: 'B · Noir et blanc',
    intro: 'Blanc, noir doux, logo dans ses couleurs d’origine. Aucune bande colorée : les chiffres vivent sur la photo. L’or n’apparaît que dans les filets et le favicon.',
    serif: '"Instrument Serif", Georgia, serif', sans: '"Instrument Sans Variable", system-ui, sans-serif',
    fontFaces: `
@font-face{font-family:"Instrument Serif";font-style:normal;font-weight:400;src:url(fonts/instrument-serif-latin-400-normal.woff2) format("woff2")}
@font-face{font-family:"Instrument Serif";font-style:italic;font-weight:400;src:url(fonts/instrument-serif-latin-400-italic.woff2) format("woff2")}
@font-face{font-family:"Instrument Sans Variable";font-style:normal;font-weight:400 700;src:url(fonts/instrument-sans-latin-wght-normal.woff2) format("woff2-variations")}`,
    vars: { bg: '#FFFFFF', paper: '#FFFFFF', ink: '#141414', ink2: '#6A6A6A', ink3: '#9B9B9B', line: '#E3E3E3', accent: '#141414', accentDeep: '#141414', accentSoft: '#6A6A6A', gold: '#B8975A', logoMark: '#684E1E', logoWord: '#222460' },
    logoNote: 'Sur le site : le logo garde ses couleurs d’origine (Φ #684E1E, nom #222460) — choix d’Axel. Variante à droite : nom en noir, si le bleu nuit jure avec le texte.',
    typoNote: 'Instrument Serif (serif sèche, un seul dessin) pour l’accroche, les titres et les chiffres · Instrument Sans pour le texte courant, la navigation et les étiquettes.',
    gamme: [ ['#141414', 'texte, titres, chiffres'], ['#6A6A6A', 'texte secondaire'], ['#9B9B9B', 'légendes'], ['#E3E3E3', 'filets'], ['#B8975A', 'filets or : navigation active, citation'], ['#684E1E', 'Φ du logo (origine), favicon'], ['#222460', 'nom du logo (origine)'] ],
    heroPhoto: 'img/community-05.jpg',
    alts: null,
  },
};

// ---------- fragments ----------
function header(t, variant = 'right', active = '') {
  const cls = variant === 'center-nav' ? ' site-header--centernav' : variant === 'center-all' ? ' site-header--centerall' : '';
  return `<header class="site-header${cls}">
  <a class="logo" href="#" aria-label="Perpetual">${markSvg}<span class="logo__word" role="img" aria-label="Perpetual"></span></a>
  <nav class="site-nav">
    <a href="#"${active === 'projets' ? ' class="is-active"' : ''}>Projets</a>
    <a href="#"${active === 'engagements' ? ' class="is-active"' : ''}>Engagements</a>
    <a href="#contact">Contact</a>
  </nav>
</header>`;
}

function statsBlock(cls = '') {
  return `<div class="stats ${cls}">${stats.map(s => `<div class="stat"><div class="stat__value">${s.value}</div><div class="stat__label">${s.label}</div></div>`).join('')}</div>`;
}

function heroA() {
  return `<section class="hero hero--a">
  <div class="container hero__grid">
    <div class="hero__left"><h1 class="hero__title">${home.h1}</h1><p class="signature">${home.signature}</p></div>
    <div class="hero__text"><p>${home.p1}</p><p>${home.p2}</p></div>
  </div>
</section>
<section class="band band--stats"><div class="container">${statsBlock()}</div></section>`;
}

function heroB(t) {
  return `<section class="hero hero--b">
  <div class="container"><h1 class="hero__title">${home.h1}</h1></div>
  <div class="hero__photo"><img src="${t.heroPhoto}" alt=""><div class="hero__stats">${statsBlock('stats--onphoto')}</div></div>
  <div class="container hero__after"><div class="hero__text"><p>${home.p1}</p><p>${home.p2}</p><p class="signature">${home.signature}</p></div></div>
</section>`;
}

function homeFirstScreen(t, variant) {
  return `${header(t, variant)}${t.key === 'a' ? heroA() : heroB(t)}`;
}

function chart(t) {
  const max = 100;
  return `<section class="section section--chart"><div class="container">
  <h2 class="h2">${portfolio.title}</h2>
  <div class="bars">${portfolio.items.map(i => `<div class="bar"><div class="bar__label">${i.label}</div><div class="bar__track"><div class="bar__fill" style="width:${i.percent / max * 100}%"></div></div><div class="bar__value">${i.percent} %</div></div>`).join('')}</div>
</div></section>`;
}

function fourProjects(t) {
  return `<section class="section section--four"><div class="container">
  <div class="eyebrow">Quatre projets</div>
  <div class="four">
    <ol class="four__list">${four.map((f, i) => { const p = byId[f.id]; return `<li class="four__row${i === 0 ? ' is-active' : ''}" data-img="img/${f.img}"><a href="#"><span class="four__name">${p.name}</span><span class="four__line">${f.line}</span></a></li>`; }).join('')}</ol>
    <div class="four__preview"><img src="img/${four[0].img}" alt=""><div class="four__hint">aperçu de la ligne survolée</div></div>
  </div>
</div></section>`;
}

function collectifBlock(t) {
  return `<section class="section section--collectif" id="collectif"><div class="container">
  <div class="eyebrow">Collectif</div>
  <div class="collectif">
    <div class="collectif__text"><p>${collectif.p1}</p><p>${collectif.p2}</p><p class="chute">${collectif.chute}</p></div>
  </div>
  <div class="partners" aria-label="Partenaires">${partnersHtml}</div>
</div></section>`;
}

function footer(t) {
  return `<footer class="site-footer" id="contact"><div class="container footer__grid">
  <div class="footer__contact">
    <div class="footer__name">Julien De Dobbeleer</div>
    <a class="footer__mail" href="mailto:${site.email}">${site.email}</a>
    <div class="footer__addr">Perpetual, ${site.city}</div>
  </div>
  <nav class="footer__nav"><a href="#">Projets</a><a href="#collectif">Collectif</a><a href="#">Engagements</a><a href="#">Mentions légales</a><a href="#">Confidentialité</a></nav>
  <blockquote class="footer__quote"><p>« ${site.quote.text} »</p><cite>${site.quote.author}</cite></blockquote>
  <div class="footer__legal">© 2026 Perpetual</div>
</div></footer>`;
}

function fiche(t) {
  const facts = [['Localisation', 'Liège'], ['Surface', bank.surface], ['Usage', 'Logements & commerce']];
  return `${header(t, 'right', 'projets')}
<article class="fiche">
  <div class="container fiche__head"><div class="eyebrow">${bank.location}</div><h1 class="fiche__title">${bank.name}</h1></div>
  <div class="fiche__hero"><img src="img/the-bank-03.jpg" alt=""></div>
  <div class="band band--facts"><div class="container facts">${facts.map(([l, v]) => `<div class="fact"><div class="fact__value">${v}</div><div class="fact__label">${l}</div></div>`).join('')}</div></div>
  <div class="container"><div class="chapters">
    <section class="chapter"><div class="chapter__num">01</div><h2 class="chapter__title">Ce que c’était</h2><p>${bank.was}</p></section>
    <div class="photos photos--2"><figure><img src="img/the-bank-01-s.jpg" alt=""><figcaption>Rue des Mineurs, la façade</figcaption></figure><figure><img src="img/the-bank-02.jpg" alt=""><figcaption>La vitrine rendue au commerce</figcaption></figure></div>
    <section class="chapter"><div class="chapter__num">02</div><h2 class="chapter__title">Ce que nous y avons vu</h2><p>${bank.saw}</p></section>
    <section class="chapter"><div class="chapter__num">03</div><h2 class="chapter__title">Ce que c’est devenu</h2><p>${bank.became}</p></section>
    <a class="next" href="#"><span class="eyebrow">Projet suivant</span><span class="next__name">Data Box →</span></a>
  </div></div>
</article>`;
}

function galleryBlock(t) {
  return `<section class="section section--gallery"><div class="container">
  <div class="eyebrow">Galerie</div>
  <div class="gallery">${gallery.map((g, i) => `<a class="card${i === 1 ? ' is-hover' : ''}" href="#"><div class="card__img"><img src="img/${g.img}" alt=""><div class="card__overlay">${g.meta}</div></div><div class="card__name">${g.name}</div><div class="card__meta">${g.meta}</div>${i === 1 ? '<div class="card__hint">état survol</div>' : ''}</a>`).join('')}</div>
</div></section>`;
}

function altsBlock(t) {
  if (!t.alts) return '';
  return `<section class="sheet-section"><h2 class="sheet-label">07 · La même mise en page, couleur permutée — or, vert profond, brique</h2>
  <div class="alts">${t.alts.map(([name, c, p]) => `<div class="alt" style="--accent:${c};--accent-deep:${c};--accent-soft:${c};--paper:${p}">
    <div class="alt__name">${name} <code>${c}</code> <span class="muted">bande ${p} · contraste sur blanc ${contrast(c, '#FFFFFF')}:1</span></div>
    <div class="alt__nav"><a href="#" class="is-active">Projets</a><a href="#">Engagements</a><a href="#">Contact</a></div>
    <div class="band band--stats band--mini">${statsBlock('stats--mini')}</div>
    <div class="alt__facts"><div class="facts facts--mini">${[['Localisation', 'Liège'], ['Surface', '1 100 m²'], ['Usage', 'Logements & commerce']].map(([l, v]) => `<div class="fact"><div class="fact__value">${v}</div><div class="fact__label">${l}</div></div>`).join('')}</div></div>
    <p class="alt__text">Une bijouterie de 160 m², un point Bancontact de 60 m², et un projet de logements de standing. <a href="#">Vendu.</a> <span class="signature">Everything is already inside.</span></p>
  </div>`).join('')}</div>
</section>`;
}

function paletteBlock(t) {
  const v = t.vars;
  const sw = (hex, name, note) => `<div class="swatch"><div class="swatch__chip" style="background:${hex}"></div><div class="swatch__name">${name}</div><code>${hex}</code>${note ? `<div class="swatch__note">${note}</div>` : ''}</div>`;
  return `<section class="sheet-section"><h2 class="sheet-label">01 · Palette et typographie</h2>
  <div class="palette">
    ${sw(v.bg, 'Fond', 'blanc pur')}${sw(v.ink, 'Texte', `contraste ${contrast(v.ink, '#FFFFFF')}:1`)}${sw(v.ink2, 'Texte secondaire', `contraste ${contrast(v.ink2, '#FFFFFF')}:1`)}${sw(v.ink3, 'Légendes', `contraste ${contrast(v.ink3, '#FFFFFF')}:1`)}${sw(v.line, 'Filets', '')}${t.key === 'a' ? sw(v.paper, 'Bande sable', 'la seule surface colorée') : sw(v.gold, 'Filet or', 'navigation active, citation')}
  </div>
  <div class="logos"><div class="gamme__title">Le logo</div><div class="logos__row">
    <div class="logos__item"><a class="logo" style="--logo-mark:#684E1E;--logo-word:#222460">${markSvg}<span class="logo__word"></span></a><div class="logos__note">Original (Φ #684E1E, nom #222460)</div></div>
    <div class="logos__item"><a class="logo" style="--logo-mark:${v.logoMark};--logo-word:${v.logoWord}">${markSvg}<span class="logo__word"></span></a><div class="logos__note">Sur le site (Φ ${v.logoMark}, nom ${v.logoWord})</div></div>
    ${t.key === 'b' ? `<div class="logos__item"><a class="logo" style="--logo-mark:#684E1E;--logo-word:#141414">${markSvg}<span class="logo__word"></span></a><div class="logos__note">Variante : Φ d’origine, nom en noir</div></div>` : ''}
  </div><div class="logos__text">${t.logoNote}</div></div>
  <div class="gamme"><div class="gamme__title">${t.key === 'a' ? 'La gamme bronze → or, à trancher' : 'Les valeurs'}</div><div class="gamme__row">${t.gamme.map(([hex, note]) => `<div class="gamme__item"><div class="gamme__chip" style="background:${hex}"></div><code>${hex}</code><div class="gamme__note">${note}<br><span class="muted">sur blanc ${contrast(hex, '#FFFFFF')}:1</span></div></div>`).join('')}</div></div>
  <div class="specimen">
    <div class="specimen__note">${t.typoNote}</div>
    <div class="specimen__h1">${home.h1}</div>
    <div class="specimen__row"><div class="specimen__num">11 150 m²</div><div class="specimen__sig">${home.signature}</div></div>
    <p class="specimen__p">${home.p2}</p>
    <div class="specimen__small">Texte courant 17 px · Étiquettes 13 px · Navigation 15 px · Accroche 52–64 px · Chiffres 56 px</div>
  </div>
</section>`;
}

// ---------- CSS ----------
function css(t) {
  const v = t.vars;
  return `
${t.fontFaces}
:root{--bg:${v.bg};--paper:${v.paper};--logo-mark:${v.logoMark};--logo-word:${v.logoWord};--ink:${v.ink};--ink-2:${v.ink2};--ink-3:${v.ink3};--line:${v.line};--accent:${v.accent};--accent-deep:${v.accentDeep};--accent-soft:${v.accentSoft};--gold:${v.gold};
  --serif:${t.serif};--sans:${t.sans};--max:1200px;--gutter:40px}
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%}
body{background:#ECEAE6;color:var(--ink);font-family:var(--sans);font-size:17px;line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
img{display:block;max-width:100%}
code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;color:var(--ink-2)}
.muted{color:var(--ink-3)}
.container{max-width:var(--max);margin:0 auto;padding:0 var(--gutter)}

/* ----- planche ----- */
.sheet-head{padding:40px 48px 28px;border-bottom:1px solid #D9D5CD;display:flex;justify-content:space-between;align-items:flex-end;gap:32px;flex-wrap:wrap}
.sheet-head h1{font-family:var(--sans);font-weight:600;font-size:22px;letter-spacing:-.01em}
.sheet-head p{max-width:720px;color:#5C5850;font-size:14px;line-height:1.5;margin-top:6px}
.sheet-head .meta{font-size:12px;color:#8A8680;text-align:right;line-height:1.5}
.sheet-section{padding:36px 48px 8px}
.sheet-label{font-family:var(--sans);font-weight:600;font-size:13px;letter-spacing:.02em;color:#5C5850;margin-bottom:14px}
.frame{width:1440px;height:900px;overflow:hidden;background:var(--bg);margin:0 -48px;border-top:1px solid #D9D5CD;border-bottom:1px solid #D9D5CD;position:relative}
.frame::after{content:"1440 × 900";position:absolute;right:12px;bottom:8px;font-size:11px;color:#B0ACA4;font-family:var(--sans)}
.page{background:var(--bg);margin:0 -48px;border-top:1px solid #D9D5CD;border-bottom:1px solid #D9D5CD}

/* palette */
.palette{display:flex;gap:18px;flex-wrap:wrap;margin-bottom:24px}
.swatch{width:150px;font-size:12px;color:#5C5850}
.swatch__chip{height:72px;border:1px solid rgba(0,0,0,.08);margin-bottom:8px}
.swatch__name{font-weight:600;color:#26231F}
.swatch__note{font-size:11px;color:#8A8680;margin-top:2px}
.gamme{background:#fff;padding:20px 24px;margin-bottom:24px;border:1px solid #E3DFD7}
.logos{background:#fff;padding:20px 24px;margin-bottom:24px;border:1px solid #E3DFD7}
.logos__row{display:flex;gap:56px;flex-wrap:wrap;align-items:flex-start;margin-top:8px}
.logos__item .logo{display:inline-flex;gap:22px;margin-bottom:10px}
.logos__item .logo__mark{width:28px}
.logos__item .logo__word{width:237px}
.logos__note{font-size:12px;color:#5C5850;margin-top:6px}
.logos__text{font-size:12px;color:#8A8680;margin-top:12px}
.gamme__title{font-size:13px;font-weight:600;margin-bottom:12px}
.gamme__row{display:flex;gap:14px;flex-wrap:wrap}
.gamme__item{width:168px;font-size:12px}
.gamme__chip{height:56px;margin-bottom:6px;border:1px solid rgba(0,0,0,.06)}
.gamme__note{color:#5C5850;line-height:1.4;margin-top:2px}
.specimen{background:#fff;padding:32px 40px 28px;border:1px solid #E3DFD7}
.specimen__note{font-size:12px;color:#8A8680;margin-bottom:22px}
.specimen__h1{font-family:var(--serif);font-weight:400;font-size:56px;line-height:1.08;letter-spacing:-.01em;max-width:18ch;margin-bottom:22px}
.specimen__row{display:flex;gap:48px;align-items:baseline;margin-bottom:18px}
.specimen__num{font-family:var(--serif);font-size:64px;line-height:1;color:var(--accent);font-variant-numeric:tabular-nums}
.specimen__sig{font-family:var(--serif);font-style:italic;font-size:26px;color:var(--accent-deep)}
.specimen__p{max-width:62ch;margin-bottom:16px}
.specimen__small{font-size:13px;color:var(--ink-3)}

/* ----- site : header ----- */
.site-header{height:76px;display:flex;align-items:center;justify-content:space-between;max-width:var(--max);margin:0 auto;padding:0 var(--gutter)}
.logo{display:inline-flex;align-items:center;gap:15px;color:var(--ink)}
.logo__mark{width:19px;height:auto;color:var(--logo-mark);flex:none;position:relative;top:1px}
.logo__word{display:inline-block;width:158px;aspect-ratio:390/47;background:var(--logo-word);-webkit-mask:url(${maskData}) center/contain no-repeat;mask:url(${maskData}) center/contain no-repeat}
.site-nav{display:flex;gap:36px;font-size:15px;font-weight:500}
.site-nav a{position:relative;padding:6px 0;color:var(--ink)}
.site-nav a::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:var(--gold);transform:scaleX(0);transform-origin:left;transition:transform .25s}
.site-nav a:hover::after,.site-nav a.is-active::after{transform:scaleX(1)}
.site-header--centernav{position:relative}
.site-header--centernav .site-nav{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)}
.site-header--centerall{justify-content:center;gap:64px}
.frame--short{height:440px}
.frame--short::after{content:"1440 × 440 — en-tête et accroche seulement"}

/* ----- hero ----- */
.hero{padding:64px 0 56px}
.hero__title{font-family:var(--serif);font-weight:400;font-size:52px;line-height:1.08;letter-spacing:-.012em;text-wrap:balance}
.hero__grid{display:grid;grid-template-columns:7fr 5fr;gap:72px;align-items:stretch}
.hero__left{display:flex;flex-direction:column;justify-content:space-between;gap:32px}
.hero__text p{margin-bottom:16px;max-width:52ch}
.hero__text p:last-child{margin-bottom:0}
.signature{font-family:var(--serif);font-style:italic;font-size:24px;color:var(--accent-deep);margin-top:22px}
.hero--b{padding:56px 0 0}
.hero--b .hero__title{font-size:66px;max-width:15ch;margin-bottom:36px}
.hero__photo{position:relative;height:560px;overflow:hidden}
.hero__photo img{width:100%;height:100%;object-fit:cover}
.hero__photo::before{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(to right,rgba(0,0,0,.72) 0%,rgba(0,0,0,.55) 28%,rgba(0,0,0,.12) 55%,rgba(0,0,0,0) 75%)}
.hero__stats{position:absolute;left:0;right:0;top:0;bottom:0;z-index:2;max-width:var(--max);margin:0 auto;padding:36px var(--gutter);display:flex;align-items:stretch}
.hero__stats .stats--onphoto{grid-template-columns:1fr;width:300px;align-content:space-between}
.stats--onphoto .stat{border-left:0;padding:14px 0 16px;border-top:1px solid rgba(255,255,255,.35)}
.stats--onphoto .stat:first-child{border-top:0;padding-top:0}
.stats--onphoto .stat__value{font-size:52px}
.stats--onphoto .stat__label{margin-top:4px;max-width:24ch}
.hero__after{padding-top:56px}
.hero--b .hero__text{columns:2;column-gap:56px;max-width:none}
.hero--b .hero__text p{max-width:none;break-inside:avoid}
.hero--b .signature{column-span:all;margin-top:12px}

/* ----- bandes & chiffres ----- */
.band{background:var(--paper)}
.band--stats{padding:44px 0 40px}
.stats{display:grid;grid-template-columns:repeat(4,1fr)}
.stat{padding:4px 32px 4px 0;border-left:1px solid var(--line);padding-left:28px}
.stat:first-child{border-left:0;padding-left:0}
.stat__value{font-family:var(--serif);font-size:58px;line-height:1;color:var(--accent);font-variant-numeric:tabular-nums;letter-spacing:-.01em}
.stat__label{font-size:14px;color:var(--ink-2);margin-top:10px;max-width:18ch;line-height:1.4}
.stats--onphoto .stat{border-left-color:rgba(255,255,255,.35)}
.stats--onphoto .stat__value{color:#fff}
.stats--onphoto .stat__label{color:rgba(255,255,255,.82)}
.band--mini{padding:22px 0 20px}
.stats--mini .stat__value{font-size:36px}
.stats--mini .stat__label{font-size:12px}

/* ----- sections home ----- */
.section{padding:72px 0}
.section + .section{border-top:1px solid var(--line)}
.h2{font-family:var(--serif);font-weight:400;font-size:34px;line-height:1.15;letter-spacing:-.01em;margin-bottom:28px}
.eyebrow{font-size:13px;color:var(--ink-3);margin-bottom:22px;letter-spacing:.01em}
.bars{max-width:760px}
.bar{display:grid;grid-template-columns:120px 1fr 64px;align-items:center;gap:20px;margin-bottom:14px}
.bar__label{font-size:15px}
.bar__track{height:14px;background:var(--paper);position:relative}
.theme-b .bar__track{background:#F1F1F1}
.bar__fill{height:100%;background:var(--accent)}
.bar__value{font-size:15px;color:var(--ink-2);font-variant-numeric:tabular-nums;text-align:right}

.four{display:grid;grid-template-columns:7fr 5fr;gap:64px;align-items:start}
.four__list{list-style:none}
.four__row{border-top:1px solid var(--line)}
.four__row:last-child{border-bottom:1px solid var(--line)}
.four__row a{display:block;padding:22px 0 24px}
.four__name{display:block;font-family:var(--serif);font-size:42px;line-height:1.05;letter-spacing:-.01em;transition:color .2s}
.four__line{display:block;font-size:16px;color:var(--ink-2);margin-top:8px}
.four__row:hover .four__name,.four__row.is-active .four__name{color:var(--accent)}
.theme-b .four__row:hover .four__name,.theme-b .four__row.is-active .four__name{color:var(--ink);text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:6px;text-decoration-color:var(--gold)}
.four__preview{position:sticky;top:24px}
.four__preview img{width:100%;aspect-ratio:4/5;object-fit:cover}
.four__hint{font-size:12px;color:var(--ink-3);margin-top:10px}

.collectif__text{max-width:64ch}
.collectif__text p{margin-bottom:16px}
.chute{font-family:var(--serif);font-style:italic;font-size:26px;line-height:1.3;color:var(--ink);margin-top:24px}
.partners{display:flex;gap:48px;align-items:center;flex-wrap:wrap;margin-top:48px;padding-top:32px;border-top:1px solid var(--line);color:var(--ink-3)}
.partner svg{height:30px;width:auto;display:block}
.theme-a .partners{color:#7A7466}

/* ----- footer ----- */
.site-footer{border-top:1px solid var(--line);padding:56px 0 40px;font-size:15px}
.theme-b .site-footer{border-top-color:var(--gold)}
.footer__grid{display:grid;grid-template-columns:4fr 3fr 5fr;gap:48px;align-items:start}
.footer__name{font-weight:500}
.footer__mail{display:inline-block;color:var(--accent-deep);border-bottom:1px solid var(--accent-soft);margin:4px 0}
.theme-b .footer__mail{color:var(--ink);border-bottom-color:var(--gold)}
.footer__addr{color:var(--ink-2)}
.footer__nav{display:flex;flex-direction:column;gap:6px;color:var(--ink-2)}
.footer__quote p{font-family:var(--serif);font-style:italic;font-size:22px;line-height:1.35;color:var(--ink-2)}
.footer__quote cite{display:block;font-style:normal;font-size:13px;color:var(--ink-3);margin-top:10px}
.footer__legal{grid-column:1/-1;font-size:12px;color:var(--ink-3);margin-top:24px;padding-top:20px;border-top:1px solid var(--line)}

/* ----- fiche ----- */
.fiche__head{padding:40px 0 32px}
.fiche__title{font-family:var(--serif);font-weight:400;font-size:64px;line-height:1;letter-spacing:-.015em}
.fiche__hero{height:520px;overflow:hidden}
.fiche__hero img{width:100%;height:100%;object-fit:cover}
.band--facts{padding:28px 0}
.theme-b .band--facts{background:transparent;border-bottom:1px solid var(--line)}
.facts{display:flex;gap:0}
.fact{padding:0 40px 0 0;margin-right:40px;border-right:1px solid var(--line)}
.fact:last-child{border-right:0}
.fact__value{font-family:var(--serif);font-size:28px;line-height:1.1;color:var(--accent);white-space:nowrap}
.theme-b .fact__value{color:var(--ink)}
.fact__label{font-size:13px;color:var(--ink-2);margin-top:6px}
.facts--mini .fact__value{font-size:20px}
.facts--mini .fact{padding-right:16px;margin-right:16px}
.chapters{padding:64px 0 72px;max-width:760px}
.chapter{margin-bottom:56px}
.chapter__num{font-family:var(--serif);font-size:15px;color:var(--accent);letter-spacing:.06em;margin-bottom:8px}
.theme-b .chapter__num{color:var(--ink-3)}
.chapter__title{font-family:var(--serif);font-weight:400;font-size:32px;line-height:1.15;margin-bottom:16px}
.chapter p{font-size:18px;line-height:1.65;max-width:62ch}
.photos{display:grid;gap:24px;margin:8px 0 64px}
.photos--2{grid-template-columns:5fr 7fr}
.photos img{width:100%;height:440px;object-fit:cover}
.photos figcaption{font-size:13px;color:var(--ink-3);margin-top:10px}
.next{display:block;border-top:1px solid var(--line);padding-top:24px;margin-top:8px}
.next .eyebrow{display:block;margin-bottom:6px}
.next__name{font-family:var(--serif);font-size:30px;color:var(--ink)}

/* ----- galerie ----- */
.gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:32px}
.card{display:block;position:relative}
.card__img{aspect-ratio:3/2;overflow:hidden;position:relative}
.card__img img{width:100%;height:100%;object-fit:cover;transition:transform .5s ease}
.card:hover img,.card.is-hover img{transform:scale(1.035)}
.card__overlay{position:absolute;left:0;right:0;bottom:0;padding:44px 20px 16px;color:#fff;font-size:14px;background:linear-gradient(to top,rgba(0,0,0,.62),rgba(0,0,0,0));opacity:0;transition:opacity .25s}
.card:hover .card__overlay,.card.is-hover .card__overlay{opacity:1}
.card__name{font-size:16px;font-weight:500;margin-top:12px}
.card__meta{display:none;font-size:14px;color:var(--ink-2)}
.card__hint{position:absolute;top:10px;left:10px;font-size:11px;background:#fff;color:var(--ink-2);padding:3px 8px}

/* ----- alternatives (A) ----- */
.alts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin:0 -48px;padding:20px 48px 40px;background:var(--bg);border-top:1px solid #D9D5CD;border-bottom:1px solid #D9D5CD}
.alt{border:1px solid var(--line);padding:20px 22px 22px;min-width:0}
.alt__name{font-size:13px;font-weight:600;margin-bottom:14px}
.alt__name code{margin-left:6px}
.alt__name .muted{font-weight:400;margin-left:6px}
.alt__nav{display:flex;gap:24px;font-size:14px;font-weight:500;margin-bottom:16px}
.alt__nav a{padding:4px 0;border-bottom:1px solid transparent}
.alt__nav a.is-active{border-bottom-color:var(--accent)}
.alt .band--mini{margin:0 -22px;padding:20px 22px}
.alt .stats--mini{grid-template-columns:repeat(2,1fr);gap:14px 0}
.alt .stats--mini .stat{padding:0 0 0 18px}
.alt .stats--mini .stat:nth-child(3){border-left:0;padding-left:0}
.alt__facts{padding:18px 0 6px}
.alt__text{font-size:15px;margin-top:10px;color:var(--ink)}
.alt__text a{color:var(--accent-deep);border-bottom:1px solid var(--accent-soft)}
.alt__text .signature{display:block;font-size:20px;margin-top:8px}

/* ----- mobile ----- */
@media (max-width:640px){
  :root{--gutter:20px}
  body{font-size:16px}
  .sheet-head{padding:24px 20px 18px}
  .sheet-section{padding:24px 20px 4px}
  .frame{width:100%;height:844px;margin:0 -20px;width:calc(100% + 40px)}
  .frame::after{content:"390 × 844"}
  .page,.alts{margin:0 -20px}
  .palette,.gamme__row{gap:10px}.swatch{width:calc(50% - 5px)}.gamme__item{width:calc(50% - 5px)}
  .specimen{padding:20px}.specimen__h1{font-size:34px}.specimen__num{font-size:40px}.specimen__sig{font-size:20px}.specimen__row{gap:20px;flex-wrap:wrap}
  .site-header{height:64px}
  .logo__word{display:none}
  .logo__mark{width:22px}
  .site-nav{gap:20px;font-size:14px}
  .site-header--centernav .site-nav{position:static;transform:none}
  .site-header--centerall{gap:24px}
  .frame--short{height:300px}
  .hero{padding:36px 0 32px}
  .hero__grid{grid-template-columns:1fr;gap:24px}
  .hero__title{font-size:36px}
  .hero--b .hero__title{font-size:40px;margin-bottom:24px}
  .hero__photo{height:520px}
  .hero__stats{padding:20px var(--gutter)}
  .hero__stats .stats--onphoto{width:100%;gap:0}
  .stats--onphoto .stat{padding:10px 0 12px}
  .stats--onphoto .stat__value{font-size:40px}
  .hero--b .hero__text{columns:1}
  .signature{font-size:21px}
  .band--stats{padding:28px 0 24px}
  .stats{grid-template-columns:1fr 1fr;gap:22px 0}
  .stat{padding:0 12px 0 16px}
  .stat:nth-child(3){border-left:0;padding-left:0}
  .stat__value{font-size:40px}
  .stat__label{font-size:13px}
  .section{padding:44px 0}
  .h2{font-size:26px}
  .bar{grid-template-columns:84px 1fr 48px;gap:12px}
  .four{grid-template-columns:1fr}
  .four__preview{display:none}
  .four__name{font-size:30px}
  .four__line{font-size:14px}
  .chute{font-size:22px}
  .partners{gap:22px 28px}.partner svg{height:20px}
  .footer__grid{grid-template-columns:1fr;gap:28px}
  .fiche__title{font-size:44px}
  .fiche__hero{height:300px}
  .facts{flex-wrap:wrap;gap:14px 0}.fact{padding-right:20px;margin-right:20px}
  .chapters{padding:36px 0 40px}
  .photos--2{grid-template-columns:1fr}
  .photos img{height:300px}
  .gallery{grid-template-columns:1fr;gap:28px}
  .card__meta{display:block}
  .alts{grid-template-columns:1fr}
}
`;
}

// ---------- page ----------
function page(t) {
  const today = '18/09/2026';
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Perpetual — ${t.title}</title>
<style>${css(t)}</style>
</head>
<body class="theme-${t.key}">
<div class="sheet-head">
  <div><h1>${t.title}</h1><p>${t.intro} Les cadres 1440 × 900 montrent exactement ce qui tient sur un écran de portable ; le reste des sections déroule à sa hauteur réelle.</p></div>
  <div class="meta">Perpetual · lot 2 · ${today}<br>Textes de Julien tels quels (non réécrits) · photos non recadrées</div>
</div>

${paletteBlock(t)}

<section class="sheet-section"><h2 class="sheet-label">02 · Home — premier écran, logo à gauche et liens à droite</h2>
  <div class="frame">${homeFirstScreen(t, 'right')}</div>
</section>

<section class="sheet-section"><h2 class="sheet-label">03 · En-tête, variante 2 — logo à gauche, les trois liens au centre (à trancher sur maquette)</h2>
  <div class="frame frame--short">${homeFirstScreen(t, 'center-nav')}</div>
</section>

<section class="sheet-section"><h2 class="sheet-label">04 · Home — la suite : graphique, quatre projets, collectif, pied de page</h2>
  <div class="page">${t.key === 'b' ? `<section class="hero hero--b" style="padding-top:8px"><div class="container hero__after"><div class="hero__text"><p>${home.p1}</p><p>${home.p2}</p><p class="signature">${home.signature}</p></div></div></section>` : ''}${chart(t)}${fourProjects(t)}${collectifBlock(t)}${footer(t)}</div>
</section>

<section class="sheet-section"><h2 class="sheet-label">05 · Fiche projet — The Bank (extrait : en-tête, photo, faits, chapitres avec photos intercalées)</h2>
  <div class="page">${fiche(t)}</div>
</section>

<section class="sheet-section"><h2 class="sheet-label">06 · Galerie (extrait) — photo et nom au repos, surface et usage au survol ; sur téléphone, tout est affiché</h2>
  <div class="page">${galleryBlock(t)}</div>
</section>

${altsBlock(t)}

<div class="sheet-section" style="padding-bottom:40px"><p class="muted" style="font-size:12px">Planche générée en HTML/CSS — les styles resserviront au lot 4. Survolez les lignes de la liste des projets et les cartes de la galerie pour voir les états.</p></div>

<script>
document.querySelectorAll('.four').forEach(function(block){
  var img = block.querySelector('.four__preview img');
  block.querySelectorAll('.four__row').forEach(function(row){
    row.addEventListener('mouseenter', function(){
      block.querySelectorAll('.four__row').forEach(function(r){ r.classList.remove('is-active'); });
      row.classList.add('is-active'); if (img) img.src = row.dataset.img;
    });
  });
});
</script>
</body>
</html>`;
}

// B : le texte de la home après la photo est déjà dans heroB (dans le cadre) ; dans la section 04 on le répète pour la lecture complète.
for (const t of Object.values(themes)) {
  fs.writeFileSync(path.join(OUT, `direction-${t.key}.html`), page(t));
  console.log('écrit direction-' + t.key + '.html');
}
