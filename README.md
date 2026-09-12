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
| Changer le texte d'une page | `content/<page>.md` |
| Ajouter ou modifier un projet (détaillé, programme agences, galerie) | `data/projects.json` |
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
design/              palette, typographies, maquettes exportées
public/              favicon, logo, fichiers statiques servis tels quels
src/                 layouts, pages, styles (Astro)
```

### Photos

Les photos originales (haute résolution) ne sont pas dans le dépôt. Elles vivent dans le dossier Google Drive partagé, sous `02 Photos/<clé du projet>/`. Le pipeline de redimensionnement et de conversion (WebP/AVIF) sera documenté ici quand il existera.

## Domaine

Le site est servi sur `perpetual.be` via GitHub Pages (fichier `public/CNAME` + enregistrements DNS chez l'hébergeur du domaine). Pour changer d'hébergeur, il suffit de lancer `npm run build` et de servir le contenu de `dist/` : aucune dépendance à GitHub dans le site lui-même.
