// @ts-check
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
  integrations: [pagesTexte],
});
