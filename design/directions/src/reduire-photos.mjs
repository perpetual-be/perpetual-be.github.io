// Réduit des photos originales pour la maquette et le site (design/directions/img/ : la source des photos du site depuis le 01/10/2026, voir README.md).
// Mêmes règles que les photos déjà présentes : redressement EXIF, métadonnées retirées, JPEG qualité 82,
// plus grand côté ≤ 800 px (fichier <nom>-s.jpg), 1800 px (<nom>.jpg) ou 2800 px (<nom>-l.jpg, chiffres sur photo en grand écran).
//
// Usage : node design/directions/src/reduire-photos.mjs [--petit] [--grand] [--tres-grand] <photo.jpg> [<photo2.jpg> …]
//   --petit       écrit la version 800 px « -s » (par défaut si aucune taille n'est demandée)
//   --grand       écrit la version 1800 px
//   --tres-grand  écrit la version 2800 px « -l »
//   Le nom de sortie est le nom du fichier source sans son extension (ex. gilly-01.jpg → gilly-01-s.jpg).
// Recadrage : si le nom figure dans recadrages.json (à côté de ce script), l'original redressé est d'abord recadré (fractions de sa largeur et de sa hauteur),
// puis réduit ; le recadrage suit donc la photo à chaque nouvelle réduction (05/10/2026).
// Dépendance : sharp (devDependency du dépôt, `npm install` à la racine).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '../img');
const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_DIR ? path.join(process.env.SHARP_DIR, 'node_modules/sharp') : 'sharp');

const RECADRAGES = JSON.parse(fs.readFileSync(path.join(HERE, 'recadrages.json'), 'utf8'));
const TAILLES = [['petit', 800, '-s'], ['grand', 1800, ''], ['tres-grand', 2800, '-l']];
const args = process.argv.slice(2);
const files = args.filter(a => !a.startsWith('--'));
const tailles = TAILLES.filter(t => args.includes('--' + t[0]));
if (!tailles.length) tailles.push(TAILLES[0]);
if (!files.length) { console.error('Usage : node design/directions/src/reduire-photos.mjs [--petit] [--grand] [--tres-grand] <photo.jpg> …'); process.exit(1); }

async function reduire(src, largeur, dest, recadrage) {
  let image = sharp(src, { failOn: 'none' }).rotate();
  if (recadrage) {
    // dimensions de l'original redressé (orientations EXIF 5 à 8 : largeur et hauteur échangées)
    const m = await sharp(src).metadata(), tourne = (m.orientation || 1) >= 5, W = tourne ? m.height : m.width, H = tourne ? m.width : m.height;
    image = sharp(await image.toBuffer()).extract({ left: Math.round(recadrage.gauche * W), top: Math.round(recadrage.haut * H), width: Math.round(recadrage.largeur * W), height: Math.round(recadrage.hauteur * H) });
  }
  await image
    .resize({ width: largeur, height: largeur, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(dest);
  const m = await sharp(dest).metadata();
  console.log(path.relative(process.cwd(), dest).padEnd(48), `${m.width}×${m.height}`, Math.round(fs.statSync(dest).size / 1024) + ' Ko' + (recadrage ? '  (recadrée : recadrages.json)' : ''));
}

for (const src of files) {
  const base = path.basename(src).replace(/\.(jpe?g|png)$/i, '').replace(/\.(jpe?g)$/i, '');
  for (const [, largeur, suffixe] of tailles) await reduire(src, largeur, path.join(OUT, base + suffixe + '.jpg'), RECADRAGES[base]);
}
