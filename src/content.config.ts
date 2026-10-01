import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

// Textes des pages : un fichier Markdown par page dans content/ (ex. content/home.md).
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    // Home uniquement : la photo du premier écran (clé <id>-NN, cf. src/lib/photos.ts) et son point focal (object-position), lus par src/pages/index.astro.
    hero: z.object({ photo: z.string(), focal: z.string().optional() }).optional(),
    // Engagements uniquement : l'œuvre sur sa cimaise — la rangée (l'id d'un titre ##, ex. soutenir), la clé de la photo (design/directions/img/<clé>.jpg),
    // la légende et le détail du cartel, le texte alternatif ; lue aussi par design/maquette/src/build.mjs.
    oeuvre: z.object({ rang: z.string(), photo: z.string(), legende: z.string(), detail: z.string(), alt: z.string() }).optional(),
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
    // Les photos montrées, en clés <id>-NN sans extension, dans l'ordre d'affichage : projet détaillé, la photo du projet puis
    // la mosaïque de sa fiche ; programme agences et galerie, la vignette et la visionneuse. Sélection provisoire, revue sans toucher au code.
    selection: z.array(z.string()).optional(),
    // aperçu de la liste des 4 de la Home : photo (par défaut la première de selection) et cadrage dans le cadre 4:5, en fractions de l'image.
    // Projets détaillés ; cadre = [x, y, largeur, hauteur], x et largeur sur la largeur de l'image entière, y et hauteur sur sa hauteur.
    apercu: z
      .object({
        photo: z.string().optional(),
        cadre: z.tuple([z.number(), z.number(), z.number(), z.number()]),
      })
      .optional(),
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
