// Réduit des photos originales pour les planches et la maquette (design/directions/img/).
// Mêmes règles que les photos déjà présentes : redressement EXIF, métadonnées retirées, JPEG qualité 82,
// plus grand côté ≤ 800 px (fichier <nom>-s.jpg), 1800 px (<nom>.jpg) ou 2800 px (<nom>-l.jpg, chiffres sur photo en grand écran).
//
// Usage : node design/directions/src/reduire-photos.mjs [--petit] [--grand] [--tres-grand] <photo.jpg> [<photo2.jpg> …]
//   --petit       écrit la version 800 px « -s » (par défaut si aucune taille n'est demandée)
//   --grand       écrit la version 1800 px
//   --tres-grand  écrit la version 2800 px « -l »
//   Le nom de sortie est le nom du fichier source sans son extension (ex. gilly-01.jpg → gilly-01-s.jpg).
// Dépendance : sharp (devDependency du dépôt, `npm install` à la racine).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '../img');
const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_DIR ? path.join(process.env.SHARP_DIR, 'node_modules/sharp') : 'sharp');

const TAILLES = [['petit', 800, '-s'], ['grand', 1800, ''], ['tres-grand', 2800, '-l']];
const args = process.argv.slice(2);
const files = args.filter(a => !a.startsWith('--'));
const tailles = TAILLES.filter(t => args.includes('--' + t[0]));
if (!tailles.length) tailles.push(TAILLES[0]);
if (!files.length) { console.error('Usage : node design/directions/src/reduire-photos.mjs [--petit] [--grand] [--tres-grand] <photo.jpg> …'); process.exit(1); }

async function reduire(src, largeur, dest) {
  await sharp(src, { failOn: 'none' })
    .rotate()
    .resize({ width: largeur, height: largeur, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(dest);
  const m = await sharp(dest).metadata();
  console.log(path.relative(process.cwd(), dest).padEnd(48), `${m.width}×${m.height}`, Math.round(fs.statSync(dest).size / 1024) + ' Ko');
}

for (const src of files) {
  const base = path.basename(src).replace(/\.(jpe?g|png)$/i, '').replace(/\.(jpe?g)$/i, '');
  for (const [, largeur, suffixe] of tailles) await reduire(src, largeur, path.join(OUT, base + suffixe + '.jpg'));
}
