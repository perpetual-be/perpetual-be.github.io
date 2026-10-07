// robots.txt, écrit au build d'après le réglage `indexation` de data/site.json, celui qui pose aussi le noindex des pages (src/layouts/Base.astro) :
// tant qu'il est faux (prévisualisation sur perpetual-be.github.io), tout est interdit aux robots ; vrai, tout est permis et le fichier renvoie au
// plan du site (dist/sitemap.xml, écrit par astro.config.mjs) à l'adresse de `site` (astro.config.mjs).
import type { APIRoute } from 'astro';
import reglages from '../../data/site.json';

export const GET: APIRoute = ({ site }) => {
  const lignes = reglages.indexation
    ? ['User-agent: *', 'Allow: /', `Sitemap: ${new URL('/sitemap.xml', site)}`]
    : ["# Prévisualisation : pas d'indexation avant la mise en ligne sur perpetual.be (lot 9).", 'User-agent: *', 'Disallow: /'];
  return new Response(lignes.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
