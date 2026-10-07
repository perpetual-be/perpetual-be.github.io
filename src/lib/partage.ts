// L'image de partage (Open Graph et carte de partage des réseaux et messageries) : la photo du premier écran de la Home, Community 05, recadrée en
// 1 200 × 630 avec le même point focal vertical (20 % : le haut du bâtiment), sans texte ni logo. Produite au build par src/pages/partage.jpg.ts depuis
// la plus grande version de la photo, servie à /partage.jpg (JPEG, ~155 Ko : sous les 300 Ko au-delà desquels WhatsApp n'affiche pas d'aperçu). Les
// balises sont posées par src/layouts/Base.astro sur toutes les pages, l'adresse absolue tirée de `site` (astro.config.mjs). Pour en changer : la clé
// et le point focal ici (x et y : la part de la marge laissée à gauche et en haut, 0,5 = centré).
import { getCollection } from 'astro:content';
import { nomEtLieu, texteAlternatif } from './alt';

export const PARTAGE = { photo: 'community-05', focal: { x: 0.5, y: 0.2 }, largeur: 1200, hauteur: 630, chemin: '/partage.jpg' } as const;

/** Le texte alternatif de l'image de partage, par la règle des photos (src/lib/alt.ts) : « Community, Uccle ». */
export async function altPartage(): Promise<string> {
  const id = PARTAGE.photo.replace(/-\d+$/, '');
  const projet = (await getCollection('projects')).find((p) => p.id === id);
  return texteAlternatif(PARTAGE.photo, projet ? nomEtLieu(projet.data.name, projet.data.location) : '');
}
