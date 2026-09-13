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
| Ajouter des photos | déposer les originaux dans le Drive, référencer les fichiers dans `data/projects.json`, puis lancer `npm run photos:ingest` (voir plus bas) |
| Changer la mise en page ou les styles | `src/` (pages, gabarits, `styles/`) |
| Palette, typographies, maquettes | `design/` |

Le contenu est de la donnée, pas du code : ajouter un projet consiste à ajouter une entrée dans `data/projects.json`, sans toucher au HTML.

### Structure

```
content/               textes des pages (Markdown), un fichier par page
data/projects.json     projets détaillés, programme agences, galerie
data/partners.json     logos partenaires
data/site.json         navigation, coordonnées, citation de pied de site
design/                palette, typographies, maquettes exportées
public/                favicon, logo, fichiers statiques servis tels quels
scripts/               scripts d'outillage (ingestion des photos)
src/                   layouts, pages, composants, styles (Astro)
src/photos-source/     photos prêtes pour le site, générées par `npm run photos:ingest` (non versionné)
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
| `address` | adresse complète du bien (tableau de Julien du 13/09) ; donnée de référence, pas nécessairement affichée |
| `was`, `saw`, `became` | les trois champs d'un projet détaillé : ce que c'était, ce que nous y avons vu, ce que c'est devenu |
| `photos` | fichiers du reportage, dans l'ordre |
| `hero` | la photo pleine largeur d'un projet détaillé |
| `heroCandidates` | plusieurs photos pleine largeur à tester tant que le choix n'est pas fait |
| `captions` | légende par fichier photo (sert de texte alternatif) |

### Photos

Les photos originales (haute résolution) ne sont pas dans le dépôt. Elles vivent dans le dossier Google Drive `PERPETUAL / Site 2026 / 02 Photos/<id du projet>/`, nommées `<id>-01.jpg`, `<id>-02.jpg`, … dans l'ordre listé dans `data/projects.json`.

**Pipeline d'ingestion** (`scripts/ingest-photos.mjs`) : lit `data/projects.json`, va chercher chaque photo référencée (`photos`, `hero`, `heroCandidates`) dans le dossier Drive local, et produit une version prête pour le site dans `src/photos-source/<id>/<fichier>` (dossier non versionné — voir `.gitignore` — puisque les originaux restent dans le Drive). Pour chaque photo, mécaniquement et sans aucun recadrage :

- redressement selon l'orientation EXIF ;
- suppression des métadonnées (EXIF, IPTC, XMP) ;
- plus grand côté plafonné à 3000 px (jamais agrandi).

Lancer, depuis la racine du dépôt :

```bash
npm run photos:ingest -- "<chemin vers le dossier Drive '02 Photos'>"
```

Avec la synchronisation Google Drive installée sur le poste, par exemple :

```bash
npm run photos:ingest -- "G:\Mon Drive\PERPETUAL\Site 2026\02 Photos"
```

Le script est incrémental (il ignore les fichiers déjà à jour) et signale en fin d'exécution les photos référencées dans `data/projects.json` mais absentes du Drive, ainsi que les fichiers présents dans le Drive mais non référencés.

**Utilisation dans le site** : le composant `src/components/ProjectPhoto.astro` affiche une photo à partir de son projet et de son nom de fichier ; il génère WebP/AVIF en plusieurs largeurs via `<Picture>` (`astro:assets`), et prend le texte alternatif dans `captions` (repli : « nom du projet, lieu »). Une photo pas encore ingérée s'affiche comme un espace réservé plutôt que de casser la page.

**Page de vérification** (non indexée) : [`/dev/photos`](http://localhost:4321/dev/photos) affiche toutes les photos de tous les projets, avec le compte ingérées / manquantes — sert à contrôler le pipeline avant de s'en servir dans les vraies pages (lot 5).

`src/photos-source/` n'étant pas versionné, le build automatique sur GitHub Actions ne dispose pas des photos : la façon de les lui fournir sera documentée ici quand les pages du site en afficheront. `/dev/photos` ne sert qu'en local.

## Domaine

Le site est servi sur `perpetual.be` via GitHub Pages (fichier `public/CNAME` + enregistrements DNS chez l'hébergeur du domaine). Pour changer d'hébergeur, il suffit de lancer `npm run build` et de servir le contenu de `dist/` : aucune dépendance à GitHub dans le site lui-même.
