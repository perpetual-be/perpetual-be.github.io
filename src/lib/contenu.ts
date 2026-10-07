// Les textes des pages, lus comme les lit design/maquette/src/build.mjs — une seule convention pour la maquette et le site (lot 4, 01/10/2026) :
// le corps Markdown d'une entrée de la collection pages (content/<page>.md, entry.body), commentaires HTML retirés, découpé en blocs séparés par une
// ligne vide. Les blocs sont rendus tels quels (texte brut, pas de rendu Markdown), comme dans la maquette.
import { getEntry, render } from 'astro:content';

/** Les blocs d'un corps Markdown : commentaires HTML retirés, séparés par une ligne vide, sans les vides (blocks() de build.mjs). */
export function blocks(body: string): string[] {
  return body.replace(/\r\n?/g, '\n').replace(/<!--[\s\S]*?-->/g, '').split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
}

async function corps(page: string): Promise<{ data: Record<string, any>; blocs: string[] }> {
  const e = await getEntry('pages', page);
  if (!e) throw new Error(`content/${page}.md introuvable`);
  return { data: e.data, blocs: blocks(e.body ?? '') };
}

/** La Home (content/home.md) : l'accroche (le bloc « # »), les paragraphes (les blocs suivants sauf le dernier), la signature (le dernier) ;
 *  stats, portfolio, hero, carte (le titre et le paragraphe de la carte des réalisations, lot 2b) et description depuis l'en-tête
 *  (schéma pages de src/content.config.ts). */
export async function lireHome() {
  const { data, blocs } = await corps('home');
  const h1 = blocs.find((b) => b.startsWith('# '));
  if (!h1) throw new Error('content/home.md : accroche introuvable (un bloc « # … »)');
  return {
    h1: h1.slice(2).trim(),
    paragraphs: blocs.filter((b) => !b.startsWith('# ')).slice(0, -1),
    signature: blocs[blocs.length - 1],
    stats: (data.stats ?? []) as { value: string; label: string }[],
    portfolio: data.portfolio as { title: string; items: { label: string; percent: number }[] } | undefined,
    hero: data.hero as { photo: string; focal?: string } | undefined,
    carte: data.carte as { title: string; text: string } | undefined,
    description: data.description as string | undefined,
  };
}

/** Collectif (content/collectif.md) : les paragraphes, puis la chute (le dernier bloc) ; le titre et la description de l'en-tête (la page Collectif,
 *  07/10/2026). */
export async function lireCollectif() {
  const { data, blocs } = await corps('collectif');
  return { titre: data.title as string, description: data.description as string | undefined, paragraphs: blocs.slice(0, -1), chute: blocs[blocs.length - 1] };
}

/** Le paragraphe du programme agences (content/realisations.md, celui qui suit « ## Le programme agences ») : l'énoncé de la vue Réalisations (lot 5).
 *  Jusqu'au 04/10/2026, c'était aussi le texte à droite de la carte de la Home ; celle-ci a le sien depuis (en-tête carte de content/home.md). */
export async function lireAgences(): Promise<string> {
  const { blocs } = await corps('realisations');
  const agences = blocs[blocs.indexOf('## Le programme agences') + 1];
  if (!agences || agences.startsWith('#')) throw new Error('content/realisations.md : paragraphe du programme agences introuvable');
  return agences;
}

/** Slug d'un titre, comme build.mjs : accents retirés, minuscules, tirets (« Soutenir » → soutenir, « 1. Responsable du traitement » → 1-responsable-du-traitement). */
export const slug = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Le Markdown en ligne d'un paragraphe, comme enLigne() de build.mjs : les liens seuls sont rendus, en .lien-texte — une ancre ou une page telle quelle
 *  ([Écrivez-nous](#contact)), un autre site dans un nouvel onglet (target _blank, rel noopener, « (nouvel onglet) » visuellement masqué) ; puis l'espace
 *  insécable avant « : ». Le reste du texte est inséré tel quel. */
export const enLigne = (md: string): string =>
  md.replace(/ :/g, ' :').replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, texte, href) =>
    /^https?:\/\//.test(href)
      ? `<a class="lien-texte" href="${esc(href)}" target="_blank" rel="noopener">${texte}<span class="visuellement-masque"> (nouvel onglet)</span></a>`
      : `<a class="lien-texte" href="${esc(href)}">${texte}</a>`,
  );

/** L'œuvre de la page Engagements (en-tête de content/engagements.md, oeuvre) : la rangée qui la porte, la clé de la photo, la légende et le détail du
 *  cartel, le texte alternatif. */
export interface Oeuvre {
  rang: string;
  photo: string;
  legende: string;
  detail: string;
  alt: string;
}
/** Une rangée du registre d'Engagements : le verbe (un titre ##), son id (slug), ses paragraphes (les blocs jusqu'au titre suivant). */
export interface RangEngagement {
  verbe: string;
  id: string;
  paragraphes: string[];
}

/** Engagements (content/engagements.md), lu comme par build.mjs : le titre et la description de l'en-tête, puis une rangée par titre ## — le verbe,
 *  l'id tiré du verbe, les paragraphes qui le suivent jusqu'au titre suivant (un bloc hors d'une rangée arrête le build) — et l'œuvre de l'en-tête,
 *  dont la rangée doit exister. */
export async function lireEngagements() {
  const { data, blocs } = await corps('engagements');
  const rangs: RangEngagement[] = [];
  for (const b of blocs) {
    if (b.startsWith('## ')) rangs.push({ verbe: b.slice(3).trim(), id: slug(b.slice(3)), paragraphes: [] });
    else if (rangs.length && !b.startsWith('#')) rangs[rangs.length - 1].paragraphes.push(b);
    else throw new Error('content/engagements.md : bloc hors d’une rangée ## — ' + b.slice(0, 60));
  }
  const oeuvre = data.oeuvre as Oeuvre | undefined;
  if (!oeuvre) throw new Error('content/engagements.md : oeuvre (rang, photo, legende, detail, alt) manquante dans l’en-tête');
  if (!rangs.some((r) => r.id === oeuvre.rang)) throw new Error(`content/engagements.md : pas de rangée #${oeuvre.rang} pour l’œuvre`);
  return { titre: data.title as string, description: data.description as string | undefined, rangs, oeuvre };
}

/** Une page de texte rendue par Astro depuis son Markdown (lot 6, 01/10/2026) — les mentions légales, la politique de confidentialité — : le titre et la
 *  description de l'en-tête, la date de mise à jour (updated) si elle est remplie, et le composant Content (le Markdown rendu par Astro, découpé en
 *  rangées et mis en forme par le plugin src/lib/rehype-registre.mjs, enregistré dans astro.config.mjs). */
export async function lirePageTexte(page: string) {
  const e = await getEntry('pages', page);
  if (!e) throw new Error(`content/${page}.md introuvable`);
  const { Content } = await render(e);
  return { titre: e.data.title, description: e.data.description, updated: e.data.updated as Date | undefined, Content };
}

/** La page 404 (content/404.md, texte provisoire, lot 3) : le titre de l'en-tête et les paragraphes du corps, rendus par enLigne. */
export async function lire404() {
  const { data, blocs } = await corps('404');
  const titre = blocs.find((b) => b.startsWith('#'));
  if (titre) throw new Error('content/404.md : des paragraphes seulement, le titre est dans l’en-tête — ' + titre.slice(0, 60));
  return { titre: data.title as string, description: data.description as string | undefined, paragraphes: blocs };
}

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
/** Une date en français, « 1er octobre 2026 » (en UTC : une date ISO sans heure est à minuit UTC, quel que soit le fuseau de la machine qui construit). */
export function dateFrancaise(d: Date): string {
  const jour = d.getUTCDate();
  return `${jour === 1 ? '1er' : jour} ${MOIS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
