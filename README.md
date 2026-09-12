# perpetual.be

Site de Perpetual — promoteur et développeur immobilier, Bruxelles. Site statique construit avec [Astro](https://astro.build), hébergé sur GitHub Pages.

## Lancer en local

Prérequis : Node.js 22 ou plus récent.

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # génère le site dans dist/
npm run preview    # sert dist/ pour vérification
```

## Déployer

Chaque push sur la branche `main` construit le site et le publie sur GitHub Pages (`.github/workflows/deploy.yml`). Aucune étape manuelle.

## Où modifier quoi

| Je veux… | Fichier |
|---|---|
| Changer le texte d'une page | `content/<page>.md` (`home`, `realisations`, `collectif`, `engagements`, `contact`) |
| Chiffres clés et répartition du portefeuille (Home) | en-tête de `content/home.md` (`stats`, `portfolio`) |
| Ajouter ou modifier un projet (détaillé, programme agences, galerie) | `data/projects.json` |
| Navigation, e-mail, ville, TVA, citation de pied de site | `data/site.json` |
| Ajouter un logo partenaire | `data/partners.json` + le fichier dans `public/partners/` |
| Ajouter des photos | déposer les originaux dans le Drive, puis lancer le pipeline photos (voir plus bas) |
| Changer la mise en page ou les styles | `src/` (pages, gabarits, `styles/`) |
| Palette, typographies, maquettes | `design/` |

Le contenu est de la donnée, pas du code : ajouter un projet consiste à ajouter une entrée dans `data/projects.json`, sans toucher au HTML.

### Structure

```
content/             textes des pages (Markdown), un fichier par page
data/projects.json   projets détaillés, programme agences, galerie
data/partners.json   logos partenaires
data/site.json       navigation, coordonnées, citation de pied de site
design/              palette, typographies, maquettes exportées
public/              favicon, logo, fichiers statiques servis tels quels
src/                 layouts, pages, styles (Astro)
```

Dans les fichiers Markdown, les commentaires HTML (`<!-- … -->`) sont des indications de mise en page : ils ne sont pas publiés.

### Projets (`data/projects.json`)

Une entrée par projet. Champs :

| Champ | Rôle |
|---|---|
| `id` | clé du projet ; c'est aussi le nom du dossier de photos et le préfixe des fichiers (`<id>-01.jpg`, `<id>-02.jpg`, …) |
| `name` | nom affiché |
| `kind` | `detailed` (projet détaillé, page Réalisations), `agency` (exemple du programme agences) ou `gallery` (grille photo) |
| `order` | ordre d'affichage au sein de son `kind` |
| `location`, `surface`, `use` | la description standard « Localisation · Surface · Usage » |
| `was`, `saw`, `became` | les trois champs d'un projet détaillé : ce que c'était, ce que nous y avons vu, ce que c'est devenu |
| `photos` | fichiers du reportage, dans l'ordre |
| `hero` | la photo pleine largeur d'un projet détaillé |
| `heroCandidates` | plusieurs photos pleine largeur à tester tant que le choix n'est pas fait |
| `captions` | légende par fichier photo (sert de texte alternatif) |

### Photos

Les photos originales (haute résolution) ne sont pas dans le dépôt. Elles vivent dans le dossier Google Drive, sous `02 Photos/<id du projet>/`, nommées `<id>-01.jpg`, `<id>-02.jpg`, … dans l'ordre listé dans `data/projects.json`. Le pipeline de redimensionnement et de conversion (WebP/AVIF) sera documenté ici quand il existera.

## Domaine

Le site est servi sur `perpetual.be` via GitHub Pages (fichier `public/CNAME` + enregistrements DNS chez l'hébergeur du domaine). Pour changer d'hébergeur, il suffit de lancer `npm run build` et de servir le contenu de `dist/` : aucune dépendance à GitHub dans le site lui-même.
