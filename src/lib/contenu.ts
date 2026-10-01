// Les textes des pages, lus comme les lit design/maquette/src/build.mjs — une seule convention pour la maquette et le site (lot 4, 01/10/2026) :
// le corps Markdown d'une entrée de la collection pages (content/<page>.md, entry.body), commentaires HTML retirés, découpé en blocs séparés par une
// ligne vide. Les blocs sont rendus tels quels (texte brut, pas de rendu Markdown), comme dans la maquette.
import { getEntry } from 'astro:content';

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
 *  stats, portfolio, hero et description depuis l'en-tête (schéma pages de src/content.config.ts). */
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
    description: data.description as string | undefined,
  };
}

/** Collectif (content/collectif.md) : les paragraphes, puis la chute (le dernier bloc). */
export async function lireCollectif() {
  const { blocs } = await corps('collectif');
  return { paragraphs: blocs.slice(0, -1), chute: blocs[blocs.length - 1] };
}

/** Le paragraphe du programme agences (content/realisations.md, celui qui suit « ## Le programme agences ») : le texte à droite de la carte. */
export async function lireAgences(): Promise<string> {
  const { blocs } = await corps('realisations');
  const agences = blocs[blocs.indexOf('## Le programme agences') + 1];
  if (!agences || agences.startsWith('#')) throw new Error('content/realisations.md : paragraphe du programme agences introuvable');
  return agences;
}
