import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

// Textes des pages : un fichier Markdown par page dans content/ (ex. content/home.md).
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

// Projets : détaillés, programme agences et galerie, tous dans data/projects.json.
const projects = defineCollection({
  loader: file('./data/projects.json'),
  schema: z.object({
    name: z.string(),
    kind: z.enum(['detailed', 'agency', 'gallery']),
    location: z.string().optional(),
    surface: z.string().optional(),
    use: z.string().optional(),
    order: z.number().optional(),
    photos: z.array(z.string()).default([]),
    hero: z.string().optional(),
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
    url: z.string().url().optional(),
  }),
});

export const collections = { pages, projects, partners };
