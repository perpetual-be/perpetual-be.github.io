// L'image de partage, /partage.jpg (le choix de la photo et son point focal : src/lib/partage.ts), écrite au build : la plus grande
// version de la photo, recadrée au format 1 200 × 630 (toute la largeur ou toute la hauteur gardée, la marge répartie selon le point focal), puis réduite,
// en JPEG qualité 82 (mozjpeg). sharp est celui qu'Astro utilise déjà pour les photos du site.
import path from 'node:path';
import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { fichierSource } from '../lib/photos';
import { PARTAGE } from '../lib/partage';

export const GET: APIRoute = async () => {
  const fichier = fichierSource(PARTAGE.photo);
  if (!fichier) throw new Error(`src/lib/partage.ts : la photo « ${PARTAGE.photo} » n'a pas de version de 1 800 ou 2 800 px dans photos/`);
  const source = path.join(process.cwd(), fichier);
  const { width = 0, height = 0 } = await sharp(source).metadata();
  const format = PARTAGE.largeur / PARTAGE.hauteur;
  let l = width, h = Math.round(width / format);
  if (h > height) [l, h] = [Math.round(height * format), height];
  const cadre = { left: Math.round((width - l) * PARTAGE.focal.x), top: Math.round((height - h) * PARTAGE.focal.y), width: l, height: h };
  const jpeg = await sharp(source).extract(cadre).resize(PARTAGE.largeur, PARTAGE.hauteur).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpeg), { headers: { 'Content-Type': 'image/jpeg' } });
};
