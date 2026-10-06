// Les `sizes` des photos de la vue Réalisations (lot 5, 05/10/2026), calculés comme design/maquette/src/build.mjs (sizesBloc, et le sizes des tuiles dans
// realisationsPage) : la largeur à laquelle chaque photo est affichée, pour que le navigateur choisisse la plus petite version suffisante. Le format d'une
// photo est lu par formatPhoto (src/lib/photos.ts), sur son <clé>.jpg comme la maquette.

import { formatPhoto } from '../../lib/photos';

/** Le bloc d'un projet (sizesBloc de build.mjs) : sa largeur suit la fenêtre (part / 12 de la rangée moins l'écart de 14 px, 879 et 628 px à partir de
 *  1 600 px) et sa hauteur aussi (clamp(340px, 100vh − 262px, 540px)) : son cadre change de forme, un facteur fixe ne suffit pas. En object-fit: cover, la
 *  photo a besoin de la plus grande des deux largeurs, celle du cadre ou la hauteur × son propre format ; au téléphone, un cadre 4:3 pleine largeur.
 *  part : la part du bloc dans sa rangée, en douzièmes (data/realisations.json). */
export async function sizesBloc(cle: string, part: number): Promise<string> {
  const ratio = await formatPhoto(cle), telephone = Math.max(1, ratio / (4 / 3));
  return `(max-width:640px) calc(${telephone === 1 ? '100vw - 40px' : `(100vw - 40px) * ${telephone.toFixed(3)}`}), `
    + `calc(max((min(100vw, 1600px) - 94px) * ${part} / 12, clamp(340px, 100vh - 262px, 540px) * ${ratio.toFixed(3)}))`;
}

/** Une photo d'une tuile de la mosaïque : la largeur de la case — sa part de la rangée (part, son format ÷ la somme des formats de la rangée, à quatre
 *  décimales), la grille large moins ses gouttières (80 px) et les écarts de la rangée (ecarts, 14 px par écart) ; au téléphone, une colonne sur deux —,
 *  multipliée par le recadrage de la photo dans la case : max(1, son format ÷ celui de la case, rCase), aucun pour la photo n° 1, qui donne son format à
 *  la case ; au téléphone, case 4:5. De 641 à 880 px (lot 7, 06/10/2026, t171006a), la mosaïque du téléphone dans les gouttières de 40 px : une colonne
 *  sur deux, (100vw − 90 px) / 2, case 4:5. */
export async function sizesTuile(cle: string, rCase: number, part: string, ecarts: number): Promise<string> {
  const pr = await formatPhoto(cle), kTel = Math.max(1, pr / 0.8), kCase = Math.max(1, pr / rCase);
  return `(max-width:640px) calc((100vw - 50px) / 2 * ${kTel.toFixed(3)}), (max-width:880px) calc((100vw - 90px) / 2 * ${kTel.toFixed(3)}), `
    + `calc((min(100vw, 1600px) - ${80 + ecarts}px) * ${part} * ${kCase.toFixed(3)})`;
}
