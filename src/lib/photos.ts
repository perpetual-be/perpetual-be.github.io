// Les photos du site (lot 4, 01/10/2026) : une seule source, les versions réduites déjà versionnées dans le dépôt, celles de la maquette —
// design/directions/img/<clé>.jpg (1 800 px) et, pour quelques-unes, <clé>-l.jpg (2 800 px), produites par design/directions/src/reduire-photos.mjs
// depuis les originaux du Drive (redressées, sans métadonnées). Les originaux ne sont jamais dans le dépôt ; les <clé>-s.jpg (800 px) ne servent
// qu'à la maquette. Le site part de la plus grande version d'une clé ; Astro en tire, au build (sur GitHub aussi), les largeurs et les formats servis
// (AVIF, WebP, JPEG de repli), sans jamais agrandir. Une clé est l'identifiant d'une photo dans les données : <id du projet>-NN (champ selection
// de data/projects.json).
//
// Ne pas lire les propriétés de l'image (width, src…) hors d'Astro : Astro garderait alors le fichier source dans le site publié, en plus des
// versions qu'il produit.
import type { ImageMetadata } from 'astro';

const DOSSIER = '/design/directions/img/';
const fichiers = import.meta.glob<{ default: ImageMetadata }>(['/design/directions/img/*.jpg', '!/design/directions/img/*-s.jpg']);

/** Toutes les clés utilisables par le site (une version de 1 800 ou 2 800 px), dans l'ordre alphabétique. */
export const clesPhotos: string[] = [
  ...new Set(Object.keys(fichiers).map((f) => f.slice(DOSSIER.length).replace(/(-l)?\.jpg$/, ''))),
].sort();

/** Le fichier de la plus grande version d'une clé (2 800, sinon 1 800 px), ou undefined si la clé n'a pas de version utilisable par le site. */
export function fichierSource(cle: string): string | undefined {
  return [`${cle}-l.jpg`, `${cle}.jpg`].map((f) => DOSSIER + f).find((f) => f in fichiers);
}

/** L'image source d'une clé. Une clé inconnue arrête le build, avec la marche à suivre. */
export async function photoSource(cle: string): Promise<ImageMetadata> {
  const f = fichierSource(cle);
  if (!f) {
    throw new Error(
      `Photo « ${cle} » introuvable pour le site : il faut design/directions/img/${cle}.jpg (1 800 px) ou ${cle}-l.jpg (2 800 px) — ` +
        `la version de 800 px (${cle}-s.jpg) ne suffit pas. La produire depuis l'original avec design/directions/src/reduire-photos.mjs ` +
        `(--grand, et --tres-grand pour une photo pleine largeur), puis la committer.`,
    );
  }
  return (await fichiers[f]()).default;
}
