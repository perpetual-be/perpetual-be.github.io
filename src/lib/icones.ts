// Les icônes PNG du site, tirées au build de public/favicon.svg — le Φ du logo, en bronze #684E1E (la teinte claire du mode sombre n'est pas rendue :
// sharp ne lit pas prefers-color-scheme) — pour les navigateurs et appareils qui ne prennent pas le SVG :
//   · favicon-32.png : 32 × 32, fond transparent, le Φ à toute la hauteur ;
//   · apple-touch-icon.png : 180 × 180 (l'icône d'un raccourci sur l'écran d'accueil d'un iPhone ou d'un iPad), fond blanc — iOS remplirait un fond
//     transparent en noir —, le Φ à 70 % de la hauteur, centré.
// Servies par src/pages/favicon-32.png.ts et src/pages/apple-touch-icon.png.ts ; déclarées dans src/layouts/Base.astro. Aucun fichier PNG dans le dépôt.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const svg = () => fs.readFileSync(path.join(process.cwd(), 'public/favicon.svg'));

/** 32 × 32, fond transparent. */
export async function favicon32(): Promise<Buffer> {
  return sharp(svg(), { density: 300 }).resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
}

/** 180 × 180, fond blanc, le Φ à 70 % de la hauteur, centré. */
export async function appleTouchIcon(): Promise<Buffer> {
  const cote = 180, fond = '#ffffff';
  const phi = await sharp(svg(), { density: 600 }).resize(null, Math.round(cote * 0.7)).png().toBuffer();
  const { width = 0, height = 0 } = await sharp(phi).metadata();
  return sharp({ create: { width: cote, height: cote, channels: 4, background: fond } })
    .composite([{ input: phi, left: Math.round((cote - width) / 2), top: Math.round((cote - height) / 2) }])
    .flatten({ background: fond })
    .png()
    .toBuffer();
}
