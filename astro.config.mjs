// @ts-check
import { defineConfig } from 'astro/config';

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
});
