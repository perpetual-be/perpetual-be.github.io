// Les textes alternatifs des photos : la légende de la photo dans data/projects.json (captions, par fichier : <clé>.jpg ou <clé>.png) quand elle existe ;
// sinon le texte que donne la page — « nom, lieu » pour un projet (« The Bank, Liège »), la ville seule pour un bien de la mosaïque des agences.
// Restent vides (alt="", au choix de la page) : la photo du premier écran de la Home et celles des blocs-liens de la vue Réalisations, dont le lien
// dit déjà tout. L'œuvre d'Engagements a le sien dans content/engagements.md.
import { getCollection } from 'astro:content';

const legendes = new Map<string, string>();
for (const p of await getCollection('projects')) {
  for (const [fichier, texte] of Object.entries(p.data.captions ?? {})) legendes.set(fichier.replace(/\.(?:jpe?g|png)$/i, ''), texte);
}

/** Le texte alternatif d'une photo : sa légende (captions) si elle en a une, sinon `aDefaut`. */
export function texteAlternatif(cle: string, aDefaut: string): string {
  return legendes.get(cle) ?? aDefaut;
}

/** « nom, lieu » (« The Bank, Liège ») ; le nom seul sans lieu. */
export function nomEtLieu(nom: string, lieu?: string): string {
  return lieu ? `${nom}, ${lieu}` : nom;
}
