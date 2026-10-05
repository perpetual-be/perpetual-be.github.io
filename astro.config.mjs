// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import registre from './src/lib/rehype-registre.mjs';

// Les pages de texte rendues par Astro depuis leur Markdown (content/mentions-legales.md, content/politique-confidentialite.md ; lot 6, 01/10/2026) : le
// plugin registre (découpage par ##, typographie, liens — src/lib/rehype-registre.mjs) est donné au processeur Markdown d'Astro — Sätteri, celui
// d'Astro 7 — par cette intégration, sans dépendance ni import du processeur : ses options sont faites pour être complétées par une intégration
// (options.hastPlugins, options.features). Sur ces pages, GFM est coupé (sinon « contact@apd-gba.be » et « www… » deviendraient des liens automatiques)
// et la ponctuation « intelligente » aussi : le texte publié est celui du fichier (apostrophes typographiques comprises), la typographie est l'affaire
// du plugin. Les autres pages ne rendent pas leur Markdown (src/lib/contenu.ts : texte brut, comme la maquette).
const pagesTexte = {
  name: 'pages-texte',
  hooks: {
    'astro:config:setup': ({ config }) => {
      const { processor } = config.markdown;
      if (processor.name !== 'satteri') throw new Error(`astro.config.mjs : le plugin registre est écrit pour Sätteri, le processeur Markdown d'Astro (ici : ${processor.name})`);
      processor.options.hastPlugins.push(registre({ fichiers: ['mentions-legales.md', 'politique-confidentialite.md'] }));
      Object.assign(processor.options.features, { gfm: false, smartPunctuation: false });
    },
  },
};

// Les images que rien ne cite, retirées du site publié (05/10/2026). src/lib/photos.ts importe paresseusement toutes les photos de
// design/directions/img/ (import.meta.glob) : au build, Vite copie chacune dans dist/_astro/ (<nom>.<empreinte>.jpg). Astro supprime l'original d'une
// photo après en avoir produit les versions (sauf si le code a lu l'une de ses propriétés : src/lib/photos.ts), mais pas celui d'une photo dont il
// n'a produit aucune version — le <clé>.jpg d'une photo qui a aussi un <clé>-l.jpg (le site part de la plus grande ; formatPhoto() n'en lit que les
// dimensions, sur sa copie) et les photos qu'aucune donnée ne cite : 11 fichiers, 6 Mo publiés pour rien (relevé du 05/10). Une fois le site écrit,
// cette intégration supprime de dist/_astro/ toute image dont aucun fichier de dist/ ne cite le nom : aucune page ne peut la charger. Seuls sont
// examinés les noms faits de lettres sans accent, de chiffres, de « - », « _ » et « . » : une page les cite tels quels, sans encodage. Plutôt qu'un
// glob restreint aux fichiers servis : il faudrait y tenir à la main la liste des <clé>.jpg doublés d'un <clé>-l.jpg et celle des photos non citées ;
// ici, rien à tenir à jour, et le format des tuiles reste lu sur le <clé>.jpg, comme la maquette.
function imagesOrphelines() {
  let config;
  return {
    name: 'images-orphelines',
    hooks: {
      'astro:config:done': (options) => {
        config = options.config;
      },
      'astro:build:done': ({ dir, logger }) => {
        const dossier = path.join(fileURLToPath(dir), config.build.assets);
        // Tout ce qui peut citer une image : les fichiers de dist/ (le code du serveur compris, s'il y en a un) hors images et polices, mis bout à bout.
        const textes = fs
          .readdirSync(fileURLToPath(config.outDir), { recursive: true, withFileTypes: true })
          .filter((f) => f.isFile() && !/\.(?:jpe?g|png|webp|avif|gif|tiff?|ico|woff2?|ttf|otf)$/i.test(f.name))
          .map((f) => fs.readFileSync(path.join(f.parentPath, f.name), 'utf8'))
          .join('\n');
        const orphelines = fs.existsSync(dossier)
          ? fs.readdirSync(dossier).filter((nom) => /^[\w.-]+\.(?:jpe?g|png|webp|avif|gif|tiff?)$/i.test(nom) && !textes.includes(nom))
          : [];
        if (!orphelines.length) return;
        let octets = 0;
        for (const nom of orphelines) {
          octets += fs.statSync(path.join(dossier, nom)).size;
          fs.unlinkSync(path.join(dossier, nom));
        }
        const s = orphelines.length > 1 ? 's' : '';
        logger.info(`${orphelines.length} image${s} de ${config.build.assets}/ citée${s} par aucun fichier du site, supprimée${s} (${(octets / 1e6).toFixed(1).replace('.', ',')} Mo) : ${orphelines.join(', ')}`);
      },
    },
  };
}

// Adresse de prévisualisation (GitHub Pages). Au lot 9, `site` devient https://perpetual.be
// et le fichier public/CNAME est ajouté ; rien d'autre ne change.
export default defineConfig({
  site: 'https://perpetual-be.github.io',
  trailingSlash: 'never',
  build: { format: 'file' },
  // Cache d'Astro (dont les photos déjà produites) hors de node_modules/ : le déploiement GitHub le garde d'une fois sur l'autre
  // (.github/workflows/deploy.yml), sinon `npm ci` l'effacerait et chaque déploiement referait toutes les photos.
  cacheDir: './.astro-cache',
  image: {
    // Service par défaut d'Astro (Sharp), explicite : le composant ProjectPhoto.astro en dépend (photos : src/lib/photos.ts).
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
  integrations: [pagesTexte, imagesOrphelines()],
});
