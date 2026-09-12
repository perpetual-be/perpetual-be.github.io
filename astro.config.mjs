// @ts-check
import { defineConfig } from 'astro/config';

// Adresse de prévisualisation (GitHub Pages). Au lot 9, `site` devient https://perpetual.be
// et le fichier public/CNAME est ajouté ; rien d'autre ne change.
export default defineConfig({
  site: 'https://perpetual-be.github.io',
  trailingSlash: 'never',
  build: { format: 'file' },
});
