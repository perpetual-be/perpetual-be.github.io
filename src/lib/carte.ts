// La carte des réalisations de la Home (lot 4, 01/10/2026), depuis data/carte/ — de la donnée, partagée avec la maquette : belgique.svg (contour,
// 17 points, 17 étiquettes placées à la main ; les quatre adresses bruxelloises, groupe « Bruxelles » de belgique.json, sont un seul point plus gros)
// et belgique.json (villes, longitudes, groupes). Reprise de carteSvg() et titreCarte() de design/maquette/src/build.mjs.
import { getCollection } from 'astro:content';
import { enLettres, capitale } from './nombres';
import belgiqueJson from '../../data/carte/belgique.json';
import svgBrut from '../../data/carte/belgique.svg?raw';

interface Belgique {
  groupes: { nom: string; membres: string[] }[];
  villes: { ville: string; lon: number; groupe?: string }[];
}
const belgique = belgiqueJson as unknown as Belgique;
const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Le SVG de la carte, chaque étiquette regroupée avec son point (même nom, ou membre de son groupe) dans un <g class="carte__lieu"> :
 *  le survol d'un point colore l'étiquette en CSS seul. data-rang="1" sur une étiquette du SVG la garde visible sur mobile. */
export function carteSvg(): string {
  const svg = svgBrut.replace(/<!--[\s\S]*?-->\s*/g, '');
  const groupes = belgique.groupes;
  const ouverture = svg.match(/<svg[^>]*>/)?.[0];
  const pays = svg.match(/<path class="carte__pays"[^>]*\/>/)?.[0];
  if (!ouverture || !pays) throw new Error('data/carte/belgique.svg : balise <svg> ou contour .carte__pays introuvable');
  const points = [...svg.matchAll(/<circle[^>]*>\s*<title>([^<]*)<\/title>\s*<\/circle>/g)].map((m) => ({ nom: m[1], html: m[0] }));
  const etiquettes = [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => ({ nom: m[1], html: m[0] }));
  const membres = (nom: string) => (groupes.find((g) => g.nom === nom) || { membres: [nom] }).membres;
  const lieux = etiquettes.map((e) => {
    const pts = points.filter((p) => p.nom === e.nom || membres(e.nom).includes(p.nom));
    if (!pts.length) throw new Error('carte : aucun point pour l’étiquette ' + e.nom);
    return `<g class="carte__lieu" data-lieu="${esc(e.nom)}">${pts.map((p) => p.html).join('')}${e.html}</g>`;
  });
  const orphelins = points.filter((p) => !etiquettes.some((e) => e.nom === p.nom || membres(e.nom).includes(p.nom)));
  if (orphelins.length) throw new Error('carte : points sans étiquette : ' + orphelins.map((p) => p.nom).join(', '));
  return `${ouverture}\n${pays}\n${lieux.join('\n')}\n</svg>`;
}

/** Le titre de la carte, calculé : le nombre de biens de data/projects.json qui ont une adresse, en toutes lettres, puis les villes la plus à l'ouest
 *  et la plus à l'est (belgique.json, longitudes ; le nom du groupe pour une commune bruxelloise) ; « de » s'élide devant une voyelle.
 *  Le titre changera (Julien le veut sans nombre ; Axel décide de la formulation) : toute la logique est ici, à remplacer d'un bloc. */
export async function titreCarte(): Promise<string> {
  const n = (await getCollection('projects')).filter((p) => p.data.address).length;
  const villes = belgique.villes;
  const nom = (v: Belgique['villes'][number]) => v.groupe || v.ville;
  const ouest = nom(villes.reduce((a, v) => (v.lon < a.lon ? v : a))), est = nom(villes.reduce((a, v) => (v.lon > a.lon ? v : a)));
  const de = /^[aeiouyàâéèêîôûh]/i.test(ouest) && !/^h/i.test(ouest) ? 'd’' : 'de ';
  return `${capitale(enLettres(n, true))} adresse${n > 1 ? 's' : ''}, ${de}${ouest} à ${est}.`;
}
