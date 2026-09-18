// Réduit des photos originales pour les planches et la maquette (design/directions/img/).
// Mêmes règles que les photos déjà présentes : redressement EXIF, métadonnées retirées,
// plus grand côté ≤ 1800 px (fichier <nom>.jpg) et 800 px (fichier <nom>-s.jpg), JPEG qualité 82.
//
// Usage : node design/directions/src/reduire-photos.mjs [--grand] <photo.jpg> [<photo2.jpg> …]
//   --grand   écrit aussi la version 1800 px (par défaut, seule la version 800 px « -s » est écrite)
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

const args = process.argv.slice(2);
const grand = args.includes('--grand');
const files = args.filter(a => !a.startsWith('--'));
if (!files.length) { console.error('Usage : node design/directions/src/reduire-photos.mjs [--grand] <photo.jpg> …'); process.exit(1); }

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
  await reduire(src, 800, path.join(OUT, base + '-s.jpg'));
  if (grand) await reduire(src, 1800, path.join(OUT, base + '.jpg'));
}
