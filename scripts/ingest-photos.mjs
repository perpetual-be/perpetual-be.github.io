#!/usr/bin/env node
// Pipeline d'ingestion des photos : Drive (originaux) -> src/photos-source/ (source du site, hors Git).
//
// Ne fait que trois choses, mécaniquement, sans aucun recadrage ni décision visuelle
// (le cadrage se fera en CSS aux lots 4-5) :
//   1. redressement selon l'orientation EXIF ;
//   2. suppression des métadonnées (EXIF, IPTC, XMP) ;
//   3. plus grand côté plafonné à 3000 px (jamais agrandi).
//
// Usage : npm run photos:ingest -- "<chemin vers le dossier Drive '02 Photos'>"

import { readFile, writeFile, mkdir, stat, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PROJECTS_JSON = path.join(ROOT, 'data', 'projects.json');
const DEST_ROOT = path.join(ROOT, 'src', 'photos-source');
const MANIFEST_PATH = path.join(DEST_ROOT, '.manifest.json');
const MAX_SIDE = 3000;
const PHOTO_EXT_RE = /\.(jpe?g|png)$/i;

function usageAndExit() {
  console.error(
    "Usage : node scripts/ingest-photos.mjs \"<chemin vers le dossier Drive '02 Photos'>\"\n" +
      '  (ou : npm run photos:ingest -- "<chemin>")\n\n' +
      "Ce dossier doit contenir un sous-dossier par id de projet, ex. :\n" +
      "  02 Photos/ateliers-118/ateliers-118-01.jpg"
  );
  process.exit(1);
}

const driveDir = process.argv[2] ?? process.env.PERPETUAL_DRIVE_PHOTOS;
if (!driveDir) usageAndExit();
if (!existsSync(driveDir)) {
  console.error(`Dossier introuvable : ${driveDir}`);
  process.exit(1);
}

async function loadManifest() {
  try {
    return JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  } catch {
    return {};
  }
}

async function saveManifest(manifest) {
  await mkdir(DEST_ROOT, { recursive: true });
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
}

// Tous les fichiers qu'un projet référence : le reportage complet, plus la ou les
// photos pleine largeur si jamais elles n'étaient pas déjà dans `photos`.
function referencedFiles(project) {
  const files = new Set(project.photos ?? []);
  if (project.hero) files.add(project.hero);
  for (const f of project.heroCandidates ?? []) files.add(f);
  return [...files];
}

async function processOne(id, filename, manifest, stats) {
  const srcPath = path.join(driveDir, id, filename);
  const destDir = path.join(DEST_ROOT, id);
  const destPath = path.join(destDir, filename);
  const manifestKey = `${id}/${filename}`;

  let srcStat;
  try {
    srcStat = await stat(srcPath);
  } catch {
    stats.missing.push(manifestKey);
    return;
  }

  const cached = manifest[manifestKey];
  if (
    cached &&
    cached.mtimeMs === srcStat.mtimeMs &&
    cached.size === srcStat.size &&
    existsSync(destPath)
  ) {
    stats.skipped.push(manifestKey);
    return;
  }

  await mkdir(destDir, { recursive: true });
  const ext = path.extname(filename).toLowerCase();

  let pipeline = sharp(srcPath, { failOn: 'none' })
    .rotate() // redresse selon l'EXIF, puis efface le tag d'orientation
    .resize({
      width: MAX_SIDE,
      height: MAX_SIDE,
      fit: 'inside',
      withoutEnlargement: true,
    });

  if (ext === '.png') {
    pipeline = pipeline.png({ compressionLevel: 9 });
  } else if (ext === '.webp') {
    pipeline = pipeline.webp({ quality: 92 });
  } else {
    pipeline = pipeline.jpeg({ quality: 92, mozjpeg: true });
  }
  // Pas de .withMetadata() : sharp n'écrit alors ni EXIF, ni IPTC, ni XMP dans le fichier de sortie.

  const buffer = await pipeline.toBuffer();
  await writeFile(destPath, buffer);

  manifest[manifestKey] = { mtimeMs: srcStat.mtimeMs, size: srcStat.size };
  stats.processed.push(manifestKey);
}

async function findOrphans(projects) {
  const referenced = new Set();
  for (const project of projects) {
    for (const filename of referencedFiles(project)) {
      referenced.add(`${project.id}/${filename}`);
    }
  }

  const orphans = [];
  for (const project of projects) {
    const projectDriveDir = path.join(driveDir, project.id);
    if (!existsSync(projectDriveDir)) continue;
    const entries = await readdir(projectDriveDir);
    for (const entry of entries) {
      const key = `${project.id}/${entry}`;
      if (PHOTO_EXT_RE.test(entry) && !referenced.has(key)) orphans.push(key);
    }
  }
  return orphans;
}

async function main() {
  const projects = JSON.parse(await readFile(PROJECTS_JSON, 'utf8'));
  const manifest = await loadManifest();
  const stats = { processed: [], skipped: [], missing: [] };

  for (const project of projects) {
    for (const filename of referencedFiles(project)) {
      await processOne(project.id, filename, manifest, stats);
    }
  }

  await saveManifest(manifest);
  const orphans = await findOrphans(projects);

  console.log('');
  console.log(`Traitées   : ${stats.processed.length}`);
  console.log(`Inchangées : ${stats.skipped.length}`);
  if (stats.missing.length) {
    console.log(`Manquantes (référencées, absentes du Drive) : ${stats.missing.length}`);
    for (const m of stats.missing) console.log(`  - ${m}`);
  }
  if (orphans.length) {
    console.log(`Présentes dans le Drive, non référencées dans data/projects.json : ${orphans.length}`);
    for (const o of orphans) console.log(`  - ${o}`);
  }
  console.log('');
  console.log(`Sortie : ${path.relative(ROOT, DEST_ROOT)}${path.sep}`);

  if (stats.missing.length) process.exitCode = 1;
}

main();
