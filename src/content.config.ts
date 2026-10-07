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
    // la légende et le détail du cartel, le texte alternatif.
    oeuvre: z.object({ rang: z.string(), photo: z.string(), legende: z.string(), detail: z.string(), alt: z.string() }).optional(),
    // Politique de confidentialité : la date de dernière mise à jour, ISO (2026-10-01, lue en date par le YAML ; une chaîne « 2026-10-01 » convient aussi) ;
    // vide (updated:), la ligne n'est pas affichée et le build écrit un avertissement (src/pages/confidentialite.astro).
    updated: z.preprocess((v) => (v === null || v === '' ? undefined : v), z.coerce.date().optional()),
    // Home uniquement : chiffres clés et répartition du portefeuille.
    stats: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
    portfolio: z
      .object({
        title: z.string(),
        items: z.array(z.object({ label: z.string(), percent: z.number() })),
      })
      .optional(),
    // Home uniquement : le titre et le paragraphe de la carte des réalisations.
    carte: z.object({ title: z.string(), text: z.string() }).optional(),
  }),
});

// Projets : détaillés, programme agences et galerie, tous dans data/projects.json. kind project : un projet montré parmi les projets de la vue
// Réalisations, sans fiche (Brosse : son bloc ouvre la visionneuse sur ses photos) ; il passe en detailed le jour où il a sa fiche.
const projects = defineCollection({
  loader: file('./data/projects.json'),
  schema: z.object({
    name: z.string(),
    kind: z.enum(['detailed', 'project', 'agency', 'gallery']),
    // Projet détaillé : la région, l'eyebrow au-dessus du titre de sa fiche.
    region: z.string().optional(),
    location: z.string().optional(),
    // Projet détaillé, facultatif : la « Localisation » de sa fiche quand elle n'est pas location (The Bank : Centre-ville).
    quartier: z.string().optional(),
    // Adresse complète du bien ; donnée de référence, pas forcément affichée.
    address: z.string().optional(),
    surface: z.string().optional(),
    use: z.string().optional(),
    // Projet sans fiche dont l'usage n'est pas encore connu (Brosse) : le troisième fait de son bloc de la vue Réalisations, « Projet », montré tant
    // que use manque.
    projet: z.string().optional(),
    order: z.number().optional(),
    photos: z.array(z.string()).default([]),
    // Les photos montrées, en clés <id>-NN sans extension, dans l'ordre d'affichage : projet détaillé, la photo du projet puis
    // la mosaïque de sa fiche ; programme agences et galerie, la vignette et la visionneuse. Se change ici, sans toucher au code.
    selection: z.array(z.string()).optional(),
    // Projet détaillé : la photo de tête de sa fiche (la première clé de selection), son cadre — paysage, 50 % de la page au format 2100 / 1694 ;
    // carre, 40 %, 1:1 — et son point focal (object-position, ex. « 50% 0% »).
    tete: z.object({ cadre: z.enum(['paysage', 'carre']), focal: z.string() }).optional(),
    // Projet détaillé ou sans fiche : le bloc de la vue Réalisations — sa photo est la première clé de selection —, son point focal
    // (object-position, ex. « 50% 30% »).
    bloc: z.object({ focal: z.string() }).optional(),
    // aperçu de la liste des 4 de la Home : photo (par défaut la première de selection) et cadrage dans le cadre 4:5, en fractions de l'image.
    // Projets détaillés ; cadre = [x, y, largeur, hauteur], x et largeur sur la largeur de l'image entière, y et hauteur sur sa hauteur.
    apercu: z
      .object({
        photo: z.string().optional(),
        cadre: z.tuple([z.number(), z.number(), z.number(), z.number()]),
      })
      .optional(),
    hero: z.string().optional(),
    // Plusieurs photos pleine largeur à tester avant de trancher.
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
