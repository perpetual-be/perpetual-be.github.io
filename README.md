# perpetual.be

Site de Perpetual — promoteur et développeur immobilier, Bruxelles. Site statique construit avec [Astro](https://astro.build), hébergé sur GitHub Pages.

## Lancer en local

Prérequis : Node.js 22 ou plus récent.

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # génère le site dans dist/
npm run preview    # sert dist/ pour vérification
npm run comparer   # après npm run build : les pages du site identiques au pixel près à la maquette — Home, Engagements, fiches projet, en-tête et pied de page (Playwright global : NODE_PATH=$(npm root -g))
```

## Déployer

Chaque push sur la branche `main` construit le site et le publie sur GitHub Pages (`.github/workflows/deploy.yml`). Aucune étape manuelle.

Les pull requests ouvertes depuis une branche de ce dépôt sont fusionnées automatiquement dans `main` dès que le site se construit sans erreur (`.github/workflows/auto-merge.yml`), puis le site est déployé. Pour garder une PR ouverte (relecture, travail en cours), lui ajouter l'étiquette `no-auto-merge` ; la retirer relance la fusion.

## Où modifier quoi

| Je veux… | Fichier |
|---|---|
| Changer le texte d'une page | `content/<page>.md` (`home`, `realisations`, `collectif`, `engagements`, `contact`) |
| Engagements : les rangées (un titre `##` par verbe, puis ses paragraphes ; seuls les liens sont rendus) et l'œuvre sur sa cimaise | `content/engagements.md` ; l'œuvre dans son en-tête (`oeuvre` : `rang`, la rangée qui la porte ; `photo`, la clé du fichier `design/directions/img/<clé>.jpg` ; `legende` et `detail` du cartel, le détail avec ses espaces insécables ; `alt`), lue aussi par la maquette |
| Mentions légales et politique de confidentialité : une rangée par titre `##` (le numéro « 1. » devient « 01 » au-dessus du titre), le Markdown de la section à droite (gras, italique, listes, liens, retours à la ligne forcés) | `content/mentions-legales.md` et `content/politique-confidentialite.md` ; la date de dernière mise à jour de la confidentialité dans son en-tête (`updated`, date ISO, vide jusqu'au lot 9 : la ligne n'est pas affichée et le build l'écrit en avertissement) |
| Texte de la page 404 (adresse inconnue) | `content/404.md` (texte provisoire, lot 3) |
| Chiffres clés et répartition du portefeuille (Home) | en-tête de `content/home.md` (`stats`, `portfolio`) |
| Textes de la Home : accroche, paragraphes et signature ; Collectif et sa chute | `content/home.md`, `content/collectif.md`, lus comme par la maquette : blocs séparés par une ligne vide, commentaires HTML ignorés, texte brut |
| Titre et paragraphe à côté de la carte (Home) | en-tête de `content/home.md` (`carte` : `title`, `text`) ; le programme agences (`content/realisations.md`, le paragraphe qui suit « ## Le programme agences ») sert à la vue Réalisations |
| Photo du premier écran de la Home et son cadrage | en-tête de `content/home.md` (`hero` : `photo`, la clé de la photo ; `focal`, le point focal, ex. `"50% 20%"`) |
| Carte des réalisations (contour, points, étiquettes, villes et groupes) | `data/carte/belgique.svg` et `belgique.json`, partagés par le site et la maquette (`src/lib/carte.ts`) |
| Ajouter ou modifier un projet (détaillé, programme agences, galerie) | `data/projects.json` |
| Une fiche projet (`/realisations/<id>`, une par projet `detailed`, dans l'ordre du champ `order` ; projet précédent et suivant en boucle dans ce même ordre) : ses infos, ses photos, ses chapitres | `data/projects.json` — ses infos : `region` (l'eyebrow au-dessus du titre), `quartier` (la « Localisation » quand elle n'est pas `location`, facultatif : The Bank seulement), `location`, `surface`, `use`, `tete` (la photo de tête : `cadre`, `paysage` ou `carre` ; `focal`, son point focal, ex. `"50% 0%"`) ; ses photos : `selection` (la première en tête, les suivantes en mosaïque, dans l'ordre) ; ses chapitres : `was`, `saw`, `became` (« Ce que c’était », « Ce que nous y avons vu », « Ce que c’est devenu ») |
| Navigation de l'en-tête (`nav`), plan et nom du contact du pied de page (`plan`, `contact`), e-mail, ville, TVA, citation, indexation (`indexation` : faux jusqu'à la mise en ligne, toutes les pages sont en `noindex`) | `data/site.json` |
| Ajouter un logo partenaire | `data/partners.json` + les fichiers dans `public/partners/couleur/`, `mono/` et `encre/` |
| Ajouter des photos | réduire les originaux du Drive avec `design/directions/src/reduire-photos.mjs`, committer les fichiers produits dans `design/directions/img/`, puis citer leurs clés dans `data/projects.json` (`selection`) — voir plus bas |
| Changer la mise en page ou les styles | `src/` (pages, gabarits, composants, `styles/`) — une couleur ou une taille se change dans `src/styles/jetons.css`, en reprenant la valeur de `design/maquette/maquette.css` |
| Vérifier qu'une page est identique à sa maquette | `npm run build`, puis `NODE_PATH=$(npm root -g) npm run comparer` (`scripts/comparer-maquette.mjs` : Home, Engagements et les quatre fiches projet au pixel près, les pages légales et la 404 alignées sur Engagements, tout `dist/` ; les écarts en images dans `scripts/ecarts/`) |
| Palette, typographies, maquettes | `design/` — la maquette (`design/maquette/`) est la référence du site |

Le contenu est de la donnée, pas du code : ajouter un projet consiste à ajouter une entrée dans `data/projects.json`, sans toucher au HTML.

### Structure

```
content/               textes des pages (Markdown), un fichier par page
data/projects.json     projets détaillés, programme agences, galerie
data/partners.json     logos partenaires
public/partners/       logos partenaires en SVG : couleur/, mono/ et encre/ (currentColor)
data/site.json         navigation de l'en-tête (nav), plan et contact du pied de page (plan, contact), coordonnées, citation, réglage d'indexation (indexation : faux jusqu'au lot 9, toutes les pages en noindex)
data/carte/            la carte des réalisations de la Home : belgique.svg (contour, points, étiquettes), belgique.json (villes, longitudes, groupes), partagée par le site et la maquette
design/                palette, typographies, maquettes exportées ; design/maquette/ est la référence du site (en-tête, pied de page, jetons)
public/                favicon, logo, fichiers statiques servis tels quels
public/fonts/          les quatre polices du site (woff2), copiées de design/maquette/fonts/ : aucune police chargée chez un tiers
src/                   layouts, pages, composants, styles (Astro)
src/layouts/Base.astro mise en page commune à toutes les pages : head (titre, description, noindex, favicon, préchargement des polices), styles, en-tête, <main>, pied de page ; la prop page est posée en data-page sur <html>, comme dans la maquette
src/pages/             index.astro (la Home), engagements.astro (Engagements, identique à la maquette), realisations/[id].astro (les quatre fiches projet, /realisations/<id>, une par projet detailed de data/projects.json, identiques à la maquette), mentions-legales.astro et confidentialite.astro (pages légales, le Markdown rendu par Astro sur le gabarit d'Engagements), 404.astro (adresse inconnue, servie par GitHub Pages ; au-dessus de 640 px, tout dans la colonne de gauche), dev/photos.astro (contrôle des photos)
src/components/        SiteHeader.astro (en-tête collant : logo, navigation ; trait et aria-current sur l'entrée active), SiteFooter.astro (pied de page, id="contact"), ProjectPhoto.astro (photos ; ratioSource : la boîte garde le format de la source), Visionneuse.astro (la visionneuse des photos, modale : fond blanc, la photo entière dans un cadre 4:3, flèches, clavier, compteur ; les fiches, et au message 2 du lot 5 la vue Réalisations)
src/components/home/   les sections de la Home, une par composant : PremierEcran (photo, accroche, bande des chiffres, paragraphes), Graphique (l'anneau qui se remplit), Carte, Collectif (textes et logos partenaires)
src/components/engagements/  le gabarit des pages de texte : PageHead (le titre seul, .page-head), Registre (.registre), Rang (une rangée d'Engagements : le verbe, les paragraphes, l'œuvre sur sa cimaise avec son cartel)
src/components/fiche/  une fiche projet : Corps (la région, le titre, les trois infos et les trois chapitres à gauche, la photo de tête qui suit à droite), Mosaique (« Photos » : les photos en rangées justifiées, chacune un bouton qui ouvre la visionneuse ; le script qui place les rangées), Voisins (projet précédent et suivant, en boucle)
src/scripts/boucle.js  la piste en boucle de la visionneuse (Boucle, reprise de design/maquette/maquette.js), un module partagé : la vue Réalisations s'en servira aussi
src/lib/               contenu.ts (les textes de content/ lus comme par la maquette : blocs ; Engagements : rangées, œuvre, liens en ligne ; pages de texte rendues par Astro, 404, date en français), rehype-registre.mjs (le plugin du gabarit registre pour le Markdown des pages légales — découpage par ##, numéros, typographie dont « e-mail » insécable, liens, commentaires retirés —, enregistré dans astro.config.mjs), carte.ts (la carte), photos.ts (photos : la source d'une clé, ses dimensions, son format, la version en grand de la visionneuse)
src/styles/            le système de la maquette, importé dans cet ordre : polices.css, jetons.css (le :root de maquette.css, la couche de rôles que lisent les composants), base.css (avec le défilement fluide vers les ancres, propre au site), entete.css, pied.css ; puis, importés par la page : home.css (la Home) ; page.css (ce que partagent les pages de texte : titre, registre, rangées, liens), engagements.css (verbe, texte, cimaise, œuvre, cartel) et texte.css (pages légales et 404 : numéro et titre de chapitre, texte, date de mise à jour) ; introuvable.css (la 404 seule : tout dans la colonne de gauche au-dessus de 640 px) ; fiche.css (les fiches : titre en serif, corps, infos, chapitres, photo qui suit, mosaïque, voisins) et visionneuse.css (la visionneuse ; une règle de plus que la maquette, qui garde son cadre en 4:3 avec une photo en hauteur)
scripts/comparer-maquette.mjs  vérification : Home, Engagements et les quatre fiches projet identiques au pixel près à la maquette (en-tête et pied de page compris ; photos avec tolérance ; mosaïque des fiches au pixel, aussi après un changement de largeur ; visionneuse), pages légales et 404 alignées sur Engagements, tout dist/ (adresse de contact, commentaires, espaces insécables, liens internes, aucun lien vers les fiches de la maquette, 404), en-tête collant, défilement fluide vers #contact, remplissage de l'anneau, polices locales, noindex (npm run comparer)
design/directions/img/ photos réduites (1 800 et 2 800 px pour le site, 800 px pour la maquette), versionnées : la source des photos du site
```

Dans les fichiers Markdown, les commentaires HTML (`<!-- … -->`) sont des indications de mise en page : ils ne sont pas publiés.

### Projets (`data/projects.json`)

Une entrée par projet. Champs :

| Champ | Rôle |
|---|---|
| `id` | clé du projet ; c'est aussi le nom du dossier de photos et le préfixe des fichiers (`<id>-01.jpg`, `<id>-02.jpg`, …) |
| `name` | nom affiché |
| `kind` | `detailed` (projet détaillé, avec sa fiche, `/realisations/<id>`), `project` (projet montré parmi les projets de la vue Réalisations, sans fiche pour l'instant : Brosse ; son bloc ouvre la visionneuse), `agency` (exemple du programme agences) ou `gallery` (bien du programme agences) — sur la vue Réalisations, agences et galerie forment ensemble la mosaïque du programme agences |
| `order` | ordre d'affichage au sein de son `kind` ; projets détaillés : l'ordre des fiches et de leur boucle « Projet précédent / suivant » |
| `location`, `surface`, `use` | la description standard « Localisation · Surface · Usage » ; projet détaillé : les trois infos de sa fiche (lot 5, 05/10 : la surface de Data Box est « 4 200 m² », l'hectare est dans son texte) |
| `region` | projet détaillé : la région, l'eyebrow au-dessus du titre de sa fiche (Bruxelles, Liège, Rochefort) |
| `quartier` | projet détaillé, facultatif : la « Localisation » de sa fiche quand elle n'est pas `location` (The Bank : Centre-ville) |
| `tete` | projet détaillé : la photo de tête de sa fiche (la première clé de `selection`), `{ "cadre": "paysage" \| "carre", "focal": "50% 0%" }` — `paysage`, 50 % de la page au format 2100 / 1694 ; `carre`, 40 %, 1:1 ; `focal`, son point focal (object-position) |
| `address` | adresse complète du bien (tableau de Julien du 13/09) ; donnée de référence, pas nécessairement affichée |
| `was`, `saw`, `became` | les trois champs d'un projet détaillé, les trois chapitres de sa fiche : ce que c'était, ce que nous y avons vu, ce que c'est devenu |
| `photos` | fichiers du reportage, dans l'ordre |
| `selection` | les photos montrées (facultatif), en clés sans extension (`<id>-03`), dans l'ordre d'affichage. Projet détaillé : la première est la photo du projet — tête de sa fiche, aperçu de la liste des 4 (Home, sauf si `apercu.photo` en choisit une autre), bloc de la vue Réalisations —, les suivantes la mosaïque de sa fiche ; les clés `data-box-03` à `-07` sont des vues drone (correspondance avec les fichiers dans `design/maquette/src/README.md`). Programme agences et galerie : la première est la photo de la tuile dans la mosaïque de la vue Réalisations (montrée entière : la largeur de la tuile suit son format), toutes passent dans la visionneuse ; Belgrade et Bois-de-Villers commencent par l'intérieur (choix du 04/10). Projet sans fiche (`project`) : la première est la photo de son bloc, toutes passent dans la visionneuse. Sélection provisoire : elle se change ici, sans toucher au code |
| `apercu` | projet détaillé, facultatif : l'aperçu de la liste des 4 de la Home, `{ "photo"?: "<clé>", "cadre": [x, y, largeur, hauteur] }`. `photo` : la clé de la photo montrée (par défaut la première de `selection`) ; `cadre` : le cadrage dans le cadre 4:5 de l'aperçu, en fractions de l'image entière (x et largeur sur sa largeur, y et hauteur sur sa hauteur ; en pixels, largeur / hauteur = 4/5 à 1 % près, la construction refuse le reste). Sans `apercu`, la photo est centrée dans le cadre. La tête de fiche et le bloc de la vue Réalisations gardent la première photo de `selection` |
| `hero` | la photo pleine largeur d'un projet détaillé |
| `heroCandidates` | plusieurs photos pleine largeur à tester tant que le choix n'est pas fait |
| `captions` | légende par fichier photo (sert de texte alternatif) |

### Partenaires (`data/partners.json`)

Une entrée par partenaire. Champs :

| Champ | Rôle |
|---|---|
| `id` | clé du partenaire ; c'est aussi le nom des fichiers SVG (`<id>.svg`) dans `public/partners/couleur/` et `public/partners/mono/` |
| `name` | nom affiché (sert de texte alternatif) |
| `logo` | chemin du logo en couleurs d'origine, servi depuis `public/` (`/partners/couleur/<id>.svg`) |
| `logoMono` | chemin de la déclinaison monochrome noire (`/partners/mono/<id>.svg`) |
| `logoInk` | chemin de la déclinaison à encre variable (`/partners/encre/<id>.svg`) — même tracé que `mono`, peint en `currentColor` |
| `url` | site du partenaire ; absent tant que l'adresse n'est pas connue |

Les trois jeux de SVG sont **normalisés optiquement** : chaque fichier a un canevas de 100 unités de haut, le logo étant centré dedans à une taille qui égalise son poids visuel (un bloc plein comme Synopsis occupe moins de hauteur qu'un logotype linéaire comme CN Architecture). Une seule règle CSS — même hauteur pour tous — suffit donc à obtenir une bande équilibrée ; il ne faut **pas** régler la taille logo par logo.

Les trois traitements sont en concurrence, le choix n'est pas fait :

| Jeu | Ce que c'est | Comment l'insérer |
|---|---|---|
| `couleur/` | couleurs d'origine de chaque partenaire | `<img src="…">` |
| `mono/` | noir pur `#000000`, figé dans le fichier | `<img src="…">` |
| `encre/` | même tracé, couleur pilotée par le CSS | **SVG inline obligatoire** |

**Piège à connaître sur `encre/`** : `currentColor` ne traverse pas la frontière d'un `<img>`. Inséré avec `<img src="/partners/encre/asap.svg">`, le logo s'affiche en noir — c'est-à-dire exactement comme `mono/`. Pour que la couleur suive le CSS, le SVG doit être injecté dans le HTML (lecture du fichier au build et insertion du balisage), et la couleur se règle alors par la propriété `color` du conteneur. Le repli est donc sans danger : au pire on retombe sur le monochrome noir.

La planche de comparaison des traitements est dans `design/partenaires-comparaison.svg` (les bandes « encre » y sont montrées dans les couleurs du logo Perpetual, à titre d'essai seulement — la palette du site n'est pas arrêtée).

### Photos

**Une seule source, dans le dépôt : les versions réduites de `design/directions/img/`** (décision du 01/10/2026). Les originaux (haute résolution) n'entrent jamais dans le dépôt : ils vivent dans le Drive (`PERPETUAL / Site 2026 / 02 Photos/<id du projet>/`, nommés `<id>-01.jpg`, `<id>-02.jpg`, …).

Chaque photo a une **clé**, `<id>-NN` (ex. `community-05`), et jusqu'à trois versions, produites depuis l'original par `design/directions/src/reduire-photos.mjs` (redressement EXIF, métadonnées retirées, JPEG qualité 82) :

| Fichier | Plus grand côté | Sert à |
|---|---|---|
| `<clé>-s.jpg` | 800 px | la maquette seulement |
| `<clé>.jpg` | 1 800 px | le site et la maquette — **obligatoire pour le site** |
| `<clé>-l.jpg` | 2 800 px | les photos montrées en grand (premier écran, tête de fiche) |

Ajouter une photo :

```bash
node design/directions/src/reduire-photos.mjs --petit --grand "G:\Mon Drive\PERPETUAL\Site 2026\02 Photos\brosse\brosse-01.jpg"
# --tres-grand en plus pour une photo pleine largeur
```

puis committer les fichiers produits dans `design/directions/img/` et citer la clé dans `data/projects.json` (champ `selection`, dans l'ordre d'affichage).

**Recadrer une photo** : ajouter sa clé dans `design/directions/src/recadrages.json` (gauche, haut, largeur, hauteur, en fractions de l'original redressé, et la raison), puis la réduire de nouveau : le script applique le recadrage avant la réduction, à chaque fois ; l'original du Drive reste entier (05/10/2026 : `bnp-braine-le-comte-02`, `gilly-02`, `ing-tervuren-01`).

**Dans le site** : `src/lib/photos.ts` trouve la plus grande version d'une clé ; le composant `src/components/ProjectPhoto.astro` l'affiche (`<ProjectPhoto cle="community-05" sizes="100vw" focal="50% 20%" />`) : Astro en tire, au build, plusieurs largeurs (800, 1 200, 1 800, 2 800 px, jamais au-delà de la source) en AVIF et WebP, avec un JPEG de repli. Texte alternatif : `alt` (vide pour une photo décorative). Une clé citée sans version de 1 800 ou 2 800 px arrête le build avec un message qui dit quoi faire. La visionneuse des fiches montre une version WebP de 1 800 px au plus, jamais au-delà de la source (`photoGrande`, `src/lib/photos.ts`), chargée seulement quand on l'ouvre. Le site publié ne contient que les versions servies : au build, Vite copie dans `dist/_astro/` toutes les photos du dossier (le glob de `photos.ts`) ; Astro en retire les originaux dont il a produit les versions, puis l'intégration `images-orphelines` (`astro.config.mjs`) toute image qu'aucun fichier de `dist/` ne cite — le `<clé>.jpg` d'une photo qui a aussi un `<clé>-l.jpg`, les photos citées par aucun projet (05/10/2026 : 11 fichiers, 6 Mo) ; le build en écrit la liste.

**Sur GitHub** : tout est dans le dépôt, le build automatique a donc toutes les photos. Les versions produites par Astro sont gardées d'un déploiement à l'autre (cache `.astro-cache`, cf. `astro.config.mjs` et `.github/workflows/deploy.yml`) : seules les nouvelles photos sont refaites (un build complet à froid prend ~3 minutes, page de contrôle et fiches comprises). Le même dossier contient `data-store.json`, le Markdown des pages de texte rendu par Astro, qui ne se renouvelle que si le fichier Markdown change : les workflows le retirent avant chaque construction, pour qu'un changement du plugin (`src/lib/rehype-registre.mjs`) soit toujours appliqué (en local : `rm .astro-cache/data-store.json` avant `npm run build`).

**Page de contrôle** (non indexée, aucun lien vers elle) : `/dev/photos` montre chaque photo citée par `data/projects.json`, projet par projet, par le même composant que le site, et signale en rouge une clé citée mais absente du dépôt.

## Domaine

Le site est servi sur `perpetual.be` via GitHub Pages (fichier `public/CNAME` + enregistrements DNS chez l'hébergeur du domaine). Pour changer d'hébergeur, il suffit de lancer `npm run build` et de servir le contenu de `dist/` : aucune dépendance à GitHub dans le site lui-même.
