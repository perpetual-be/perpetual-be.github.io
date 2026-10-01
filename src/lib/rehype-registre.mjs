// Le plugin « registre » des pages de texte rendues depuis leur Markdown (lot 6, 01/10/2026) — mentions légales, politique de confidentialité —, écrit ici,
// sans dépendance : un plugin hast (l'arbre HTML, celui de rehype) pour Sätteri, le processeur Markdown d'Astro 7 — Astro n'exécute plus les plugins rehype
// « unified » sans installer @astrojs/markdown-remark —, enregistré par astro.config.mjs et appliqué aux seuls fichiers de content/ qu'il nomme (la
// fabrique rend null pour les autres). Ce qu'il fait :
//   · découpage : une section.rang par titre ## (l'id : le slug du titre, sans son numéro), le gabarit d'Engagements — à gauche (.rang__g) le titre en
//     h2.chapitre__titre, comme les chapitres des fiches, précédé de son numéro en p.chapitre__num (« 01 ») quand il commence par un numéro
//     (« 1. Responsable du traitement » ; la section prend alors .rang--numerote et le titre perd son numéro) ; à droite (.rang__d) le reste de la
//     section, tel que rendu par Astro (gras, italique, listes, liens, retours à la ligne forcés), dans .page-texte ; un bloc hors d'une section arrête le
//     build, comme pour Engagements ;
//   · typographie : espaces insécables avant « : ; ? ! » et à l'intérieur des guillemets français (pas dans le code) ; « e-mail » et « e-mails » ne se
//     coupent plus au trait d'union (retouche du 01/10 : un span en white-space: nowrap — Instrument Sans n'a pas le trait d'union insécable U+2011,
//     qui viendrait d'une autre police) ;
//   · liens : .lien-texte, mailto compris ; un autre site (http…) s'ouvre dans un nouvel onglet (target _blank, rel noopener), suivi d'un « (nouvel
//     onglet) » visuellement masqué — comme enLigne() de build.mjs ;
//   · les commentaires HTML de content/ (des notes internes) ne sont pas publiés.
// Le numéro et le titre sont émis en HTML brut (nœud raw) : le plugin d'ids de titres d'Astro, qui passe après celui-ci sur chaque h1–h6, ne donne
// ainsi pas au h2 un id qui doublerait celui de la section.
// Styles : src/styles/page.css (rangées, liens), src/styles/texte.css (numéro, titre, texte).
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Slug d'un titre, comme build.mjs et src/lib/contenu.ts : accents retirés, minuscules, tirets. */
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const SANS_TYPOGRAPHIE = new Set(['code', 'pre', 'script', 'style']);
/** Les espaces insécables : avant « : ; ? ! » (quand une espace les précède), à l'intérieur de « et ». */
export const typographie = s => s.replace(/ ([:;?!])/g, ' $1').replace(/«\s/g, '« ').replace(/\s»/g, ' »');
/** Les mots qui ne se coupent pas au trait d'union (« e-mail », « e-mails »), chacun dans un span en white-space: nowrap (en style : aucune feuille
 *  partagée à toucher) : le texte devient une suite de nœuds hast — tel quel s'il n'en contient aucun. */
const INSECABLE = /\b(e-mails?)\b/gi;
export const insecables = s => {
  if (!s.match(INSECABLE)) return [{ type: 'text', value: s }];
  const noeuds = []; let i = 0;
  for (const m of s.matchAll(INSECABLE)) {
    if (m.index > i) noeuds.push({ type: 'text', value: s.slice(i, m.index) });
    noeuds.push({ type: 'element', tagName: 'span', properties: { style: 'white-space:nowrap' }, children: [{ type: 'text', value: m[0] }] });
    i = m.index + m[0].length;
  }
  if (i < s.length) noeuds.push({ type: 'text', value: s.slice(i) });
  return noeuds;
};
/** Un nœud hast copié en objet simple (les nœuds reçus sont des vues sur l'arbre natif de Sätteri). */
const copier = n => {
  const o = { type: n.type };
  if (n.tagName) o.tagName = n.tagName;
  if (n.properties) o.properties = { ...n.properties };
  if (n.value !== undefined) o.value = n.value;
  if (n.children) o.children = n.children.map(copier);
  return o;
};
const el = (tagName, className, children = []) => ({ type: 'element', tagName, properties: { className }, children });

/** @param {{ fichiers: string[] }} options — les fichiers de content/ (leur nom) auxquels le plugin s'applique. */
export default function registre({ fichiers }) {
  return ctx => {
    const fichier = ctx.fileURL ? path.basename(fileURLToPath(ctx.fileURL)) : '';
    if (!fichiers.includes(fichier)) return null;
    return {
      name: 'registre',
      // les commentaires HTML du Markdown (Sätteri les passe en HTML brut)
      raw(node, c) { if (/^\s*<!--/.test(node.value)) c.removeNode(node); },
      comment(node, c) { c.removeNode(node); },
      text(node, c) {
        const parent = c.parent(node);
        if (parent && parent.type === 'element' && SANS_TYPOGRAPHIE.has(parent.tagName)) return;
        const v = typographie(node.value), noeuds = insecables(v);
        if (noeuds.length > 1) c.replaceNode(node, noeuds);
        else if (v !== node.value) c.replaceNode(node, { type: 'text', value: v });
      },
      element: {
        filter: ['a'],
        visit(node, c) {
          const classes = node.properties.className ?? [];
          c.setProperty(node, 'className', [...(Array.isArray(classes) ? classes : [classes]), 'lien-texte']);
          if (/^https?:\/\//.test(String(node.properties.href ?? ''))) {
            c.setProperty(node, 'target', '_blank');
            c.setProperty(node, 'rel', 'noopener');
            c.appendChild(node, el('span', ['visuellement-masque'], [{ type: 'text', value: ' (nouvel onglet)' }]));
          }
        },
      },
      // le découpage, une fois les visiteurs passés : l'arbre est reconstruit, une section par titre ##
      after(root, c) {
        const sections = [];
        let texte = null;
        for (const n of root.children) {
          if (n.type === 'element' && n.tagName === 'h2') {
            const t = c.textContent(n).trim(), m = t.match(/^(\d+)\.\s+(.+)$/), titre = m ? m[2] : t, num = m ? m[1].padStart(2, '0') : null;
            const gauche = el('div', ['rang__g'], [{ type: 'raw', value: (num ? `<p class="chapitre__num">${num}</p>` : '') + `<h2 class="chapitre__titre">${esc(titre)}</h2>` }]);
            texte = el('div', ['page-texte']);
            sections.push({ type: 'element', tagName: 'section', properties: { className: num ? ['rang', 'rang--numerote'] : ['rang'], id: slug(titre) }, children: [gauche, el('div', ['rang__d'], [texte])] });
          } else if (n.type === 'text' && !n.value.trim()) continue;   // les sauts de ligne entre les blocs
          else if (texte) texte.children.push(copier(n));
          else throw new Error(`content/${fichier} : bloc hors d’une section ## — ${(n.value ?? c.textContent(n)).trim().slice(0, 60)}`);
        }
        if (!sections.length) throw new Error(`content/${fichier} : aucun titre ##`);
        c.replaceNode(root, { type: 'root', children: sections });
      },
    };
  };
}
