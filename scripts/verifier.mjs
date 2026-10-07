// Vérifie le site construit (dist/, après npm run build), sans navigateur ni dépendance : npm run verifier.
//   · chaque lien (href) et chaque src / srcset internes mènent à un fichier de dist/, chaque ancre (#id) à un id de la page visée ;
//   · chaque <img> a un attribut alt (vide permis) ;
//   · chaque page de sitemap.xml a un <title>, une meta description et un lien canonique ;
//   · chaque page HTML, sauf la 404 et les redirections (meta refresh), figure dans sitemap.xml, et inversement ;
//   · aucune trace de l'ancienne adresse (« Vanderkindere ») ni d'un numéro de téléphone belge.
// Les pages sont construites en build.format: 'file' (astro.config.mjs) : /collectif est dist/collectif.html, / est dist/index.html.
// Sortie : « Tout est vérifié », sinon la liste des problèmes et le code de sortie 1.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('dist/index.html introuvable : lancer npm run build avant npm run verifier.');
  process.exit(1);
}

const fichiers = fs.readdirSync(DIST, { recursive: true, withFileTypes: true })
  .filter((f) => f.isFile())
  .map((f) => path.relative(DIST, path.join(f.parentPath, f.name)).split(path.sep).join('/'));
const existe = new Set(fichiers);
const pages = fichiers.filter((f) => f.endsWith('.html'));
const lire = (f) => fs.readFileSync(path.join(DIST, f), 'utf8');
const problemes = [];

// Le HTML sans le contenu des <script> et des <style> (leurs balises ouvrantes restent : un <script src> est vérifié).
const sansScripts = (h) => h.replace(/(<(script|style)\b[^>]*>)[\s\S]*?<\/\2>/gi, '$1');
const balises = (h, nom) => [...h.matchAll(new RegExp(`<${nom}\\b[^>]*>`, 'gi'))].map((m) => m[0]);
const attribut = (balise, nom) => {
  const m = balise.match(new RegExp(`\\s${nom}=(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return m ? (m[1] ?? m[2] ?? m[3]) : null;
};
const decoder = (v) => v.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

// Le fichier de dist/ que sert une adresse interne, ou null : /collectif → collectif.html, / → index.html, /favicon.svg → favicon.svg.
function fichierDe(chemin) {
  let c;
  try { c = decodeURIComponent(chemin); } catch { return null; }
  c = c.replace(/^\/+/, '');
  const candidats = c === '' ? ['index.html'] : c.endsWith('/') ? [c + 'index.html'] : [c, c + '.html', c + '/index.html'];
  return candidats.find((x) => existe.has(x)) ?? null;
}

// Les ids d'une page, lus une fois.
const idsDe = new Map();
const ids = (f) => {
  if (!idsDe.has(f)) idsDe.set(f, new Set([...sansScripts(lire(f)).matchAll(/\sid=(?:"([^"]*)"|'([^']*)')/gi)].map((m) => m[1] ?? m[2])));
  return idsDe.get(f);
};

// 1. Liens, src et srcset internes ; ancres ; alt des <img>.
let nLiens = 0, nImages = 0;
for (const page of pages) {
  const h = sansScripts(lire(page));
  const adresses = [];
  for (const b of h.match(/<[a-z][^>]*>/gi) ?? []) {
    for (const nom of ['href', 'src']) { const v = attribut(b, nom); if (v !== null) adresses.push(decoder(v)); }
    const srcset = attribut(b, 'srcset');
    if (srcset !== null) for (const part of decoder(srcset).split(',')) { const u = part.trim().split(/\s+/)[0]; if (u) adresses.push(u); }
  }
  for (const a of adresses) {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(a)) continue;   // http:, https:, mailto:, tel:, data:… : hors du site
    nLiens++;
    const [avant, ancre] = a.split('#');
    const chemin = avant.split('?')[0];
    let cible = page;
    if (chemin !== '') {
      const absolu = chemin.startsWith('/') ? chemin : '/' + path.posix.join(path.posix.dirname(page), chemin);
      cible = fichierDe(absolu);
      if (!cible) { problemes.push(`${page} : « ${a} » ne mène à aucun fichier de dist/`); continue; }
    }
    if (ancre) {
      if (!cible.endsWith('.html')) problemes.push(`${page} : « ${a} » — une ancre vers un fichier qui n'est pas une page`);
      else if (!ids(cible).has(ancre)) problemes.push(`${page} : « ${a} » — pas d'id="${ancre}" dans ${cible}`);
    }
  }
  for (const img of balises(h, 'img')) {
    nImages++;
    if (attribut(img, 'alt') === null && !/\salt(?=[\s>/])/i.test(img)) problemes.push(`${page} : <img> sans attribut alt — ${img.slice(0, 120)}`);
  }
}

// 2. Le plan du site : ses pages, et toutes les pages publiques.
const redirection = (f) => /<meta http-equiv="refresh"/i.test(lire(f));
const plan = existe.has('sitemap.xml') ? lire('sitemap.xml') : '';
if (!plan) problemes.push('sitemap.xml absent de dist/');
const dansPlan = new Set();
for (const [, loc] of plan.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  let chemin;
  try { chemin = new URL(loc).pathname; } catch { problemes.push(`sitemap.xml : adresse illisible « ${loc} »`); continue; }
  const f = fichierDe(chemin);
  if (!f || !f.endsWith('.html')) { problemes.push(`sitemap.xml : « ${loc} » ne mène à aucune page de dist/`); continue; }
  dansPlan.add(f);
  const tete = (lire(f).match(/<head>([\s\S]*?)<\/head>/i) ?? ['', ''])[1];
  if (!/<title>[^<\s][^<]*<\/title>/i.test(tete)) problemes.push(`${f} (sitemap.xml) : pas de <title>`);
  if (!balises(tete, 'meta').some((m) => attribut(m, 'name') === 'description' && attribut(m, 'content'))) problemes.push(`${f} (sitemap.xml) : pas de meta description`);
  if (!balises(tete, 'link').some((l) => attribut(l, 'rel') === 'canonical' && attribut(l, 'href'))) problemes.push(`${f} (sitemap.xml) : pas de lien canonique`);
}
for (const f of pages) {
  if (f === '404.html' || redirection(f)) continue;
  if (!dansPlan.has(f)) problemes.push(`${f} : absente de sitemap.xml`);
}
for (const f of dansPlan) if (f === '404.html' || redirection(f)) problemes.push(`${f} : dans sitemap.xml, alors que c'est la 404 ou une redirection`);

// 3. Ni l'ancienne adresse ni un numéro de téléphone belge, dans aucun fichier texte de dist/.
//    +32…, 02 xxx xx xx (fixe : 0 + indicatif + 7 chiffres), 04xx xx xx xx (mobile) ; espaces, points, barres ou tirets entre les groupes.
//    Le numéro BCE « BE 0812.325.906 » (4 + 3 + 3 chiffres) n'en est pas un.
const TEXTES = /\.(?:html|xml|txt|js|css|json|svg|webmanifest)$/i;
const sep = '[\\s\\u00A0./-]?';
const TELEPHONES = [
  new RegExp(`\\+${sep}32(?:${sep}\\(0\\))?${sep}\\d`, 'g'),
  new RegExp(`(?<![\\d.,])0\\d${sep}\\d{3}${sep}\\d{2}${sep}\\d{2}(?![\\d.,])`, 'g'),
  new RegExp(`(?<![\\d.,])04\\d{2}${sep}\\d{2}${sep}\\d{2}${sep}\\d{2}(?![\\d.,])`, 'g'),
];
for (const f of fichiers.filter((x) => TEXTES.test(x))) {
  const t = lire(f);
  if (/vanderkindere/i.test(t)) problemes.push(`${f} : « Vanderkindere » (l'ancienne adresse)`);
  // les numéros : dans le texte visible et les attributs des pages, ou dans tout le fichier pour le reste (le code minifié est hors champ)
  const lu = f.endsWith('.html') ? decoder(sansScripts(t).replace(/<style\b[^>]*>/gi, '').replace(/\s(?:d|viewBox|points|transform|sizes|srcset|style|data-[\w-]+)="[^"]*"/gi, ' ')) : /\.(?:js|css)$/i.test(f) ? '' : t;
  for (const re of TELEPHONES) for (const m of lu.matchAll(re)) problemes.push(`${f} : un numéro de téléphone belge ? « ${m[0]} »`);
}

if (problemes.length) {
  console.log(`${problemes.length} problème${problemes.length > 1 ? 's' : ''} :`);
  for (const p of problemes) console.log('  ✗ ' + p);
  process.exit(1);
}
console.log(`${pages.length} pages, ${nLiens} adresses internes, ${nImages} images, ${dansPlan.size} pages dans sitemap.xml.`);
console.log('Tout est vérifié');
