// Les textes alternatifs des photos (lot 7, 06/10/2026 ; règle validée par Axel, D5) : la légende de la photo dans data/projects.json (champ captions,
// par fichier : <clé>.jpg ou <clé>.png) quand elle existe ; sinon le texte que donne la page — « nom, lieu » pour un projet (« The Bank, Liège »), la ville
// seule pour un bien de la mosaïque des agences (comme sur sa tuile). Restent vides, au choix de la page (alt="") : la photo du premier écran de la Home,
// sous l'accroche, et les photos des blocs-liens de la vue Réalisations, dont le lien dit déjà le nom, le lieu, la surface et l'usage. Aucun texte nouveau :
// tout vient des données. Plusieurs photos d'un même projet peuvent avoir le même texte. L'œuvre d'Engagements garde le sien (content/engagements.md).
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
