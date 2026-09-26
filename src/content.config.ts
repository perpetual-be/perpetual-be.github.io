import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

// Textes des pages : un fichier Markdown par page dans content/ (ex. content/home.md).
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    // Home uniquement : chiffres clés et répartition du portefeuille.
    stats: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
    portfolio: z
      .object({
        title: z.string(),
        items: z.array(z.object({ label: z.string(), percent: z.number() })),
      })
      .optional(),
  }),
});

// Projets : détaillés, programme agences et galerie, tous dans data/projects.json.
const projects = defineCollection({
  loader: file('./data/projects.json'),
  schema: z.object({
    name: z.string(),
    kind: z.enum(['detailed', 'agency', 'gallery']),
    location: z.string().optional(),
    // Adresse complète fournie par Julien (tableau du 13/09) ; pas forcément affichée.
    address: z.string().optional(),
    surface: z.string().optional(),
    use: z.string().optional(),
    order: z.number().optional(),
    photos: z.array(z.string()).default([]),
    // Programme agences et galerie : les photos montrées (vignette, visionneuse), en clés <id>-NN sans extension,
    // dans l'ordre d'affichage. Sélection provisoire, revue sans toucher au code.
    selection: z.array(z.string()).optional(),
    hero: z.string().optional(),
    // Plusieurs photos pleine largeur à tester avant de trancher (lot 5).
    heroCandidates: z.array(z.string()).optional(),
    // Légende par fichier, sert de texte alternatif.
    captions: z.record(z.string(), z.string()).optional(),
    was: z.string().optional(),
    saw: z.string().optional(),
    became: z.string().optional(),
  }),
});

// Logos partenaires (page Collectif), dans data/partners.json.
const partners = defineCollection({
  loader: file('./data/partners.json'),
  schema: z.object({
    name: z.string(),
    logo: z.string(),
    // Déclinaison monochrome noire du même logo.
    logoMono: z.string().optional(),
    // Même tracé, mais peint en `currentColor` : la couleur vient du CSS.
    // Exige une insertion en SVG inline (un <img> le rend en noir, cf. README).
    logoInk: z.string().optional(),
    url: z.string().url().optional(),
  }),
});

export const collections = { pages, projects, partners };
