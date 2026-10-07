// Les photos du site : une seule source, les versions réduites versionnées dans le dépôt — design/directions/img/<clé>.jpg (1 800 px) et, pour
// quelques-unes, <clé>-l.jpg (2 800 px), produites par design/directions/src/reduire-photos.mjs depuis les originaux du Drive (redressées, sans
// métadonnées). Les originaux ne sont jamais dans le dépôt ; le site n'utilise pas les <clé>-s.jpg (800 px). Il part de la plus grande version d'une
// clé ; Astro en tire, au build, les largeurs et les formats servis (AVIF, WebP, JPEG de repli), sans jamais agrandir. Une clé est l'identifiant
// d'une photo dans les données : <id du projet>-NN (champ selection de data/projects.json).
//
// Ne pas lire les propriétés de l'image (width, src…) hors d'Astro : Astro garderait alors le fichier source dans le site publié, en plus des
// versions qu'il produit. Ses dimensions se lisent sur sa copie (dimensions(), plus bas).
//
// Au build, Vite copie dans dist/_astro/ chaque fichier de ce glob, servi ou non : le <clé>.jpg d'une photo qui a aussi un <clé>-l.jpg, une photo
// qu'aucune donnée ne cite. Une fois le site écrit, l'intégration images-orphelines (astro.config.mjs) en retire toute image qu'aucune page ne cite.
import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';

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

/** Largeur et hauteur d'une image importée, lues sur sa copie (`clone`, la propriété cachée dont se sert getImage() d'Astro) : l'image elle-même est un
 *  Proxy qui, à la première propriété lue, garde le fichier original dans le site publié (500 Ko pour l'œuvre d'Engagements) ; sa copie ne le fait pas. */
export function dimensions(image: ImageMetadata): { width: number; height: number } {
  const copie = (image as ImageMetadata & { clone?: ImageMetadata }).clone ?? image;
  return { width: copie.width, height: copie.height };
}

/** Le format d'une photo (largeur / hauteur), lu sur son <clé>.jpg (1 800 px) — il donne le --r des tuiles de la mosaïque des fiches et le sizes de
 *  leur photo de tête —, à défaut sur sa source. La version de 2 800 px a parfois un format arrondi autrement (data-box-02 : 1,7787 en 1 800 px,
 *  1,7778 en 2 800) : lu sur elle, il décalerait les tuiles d'une rangée. */
export async function formatPhoto(cle: string): Promise<number> {
  const f = `${DOSSIER}${cle}.jpg`;
  const { width, height } = dimensions(f in fichiers ? (await fichiers[f]()).default : await photoSource(cle));
  return width / height;
}

/** La photo en grand de la visionneuse : l'adresse d'une version WebP produite au build depuis la source, 1 800 px au plus sur son grand côté, jamais
 *  au-delà de la source. Une seule adresse, sans <picture> ni repli : WebP, lu par tous les navigateurs actuels. La page ne la charge qu'à l'ouverture
 *  de la visionneuse (src/components/Visionneuse.astro). */
export async function photoGrande(cle: string): Promise<string> {
  const source = await photoSource(cle);
  const { width, height } = dimensions(source);
  const echelle = Math.min(1, 1800 / Math.max(width, height));
  return (await getImage({ src: source, width: Math.round(width * echelle), format: 'webp' })).src;
}
