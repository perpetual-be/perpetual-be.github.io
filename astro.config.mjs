// @ts-check
import { defineConfig } from 'astro/config';

// Adresse de prévisualisation (GitHub Pages). Au lot 9, `site` devient https://perpetual.be
// et le fichier public/CNAME est ajouté ; rien d'autre ne change.
export default defineConfig({
  site: 'https://perpetual-be.github.io',
  trailingSlash: 'never',
  build: { format: 'file' },
  image: {
    // Service par défaut d'Astro (Sharp) ; explicite ici parce que le pipeline photos
    // (scripts/ingest-photos.mjs) et le composant ProjectPhoto.astro en dépendent tous les deux.
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
});
