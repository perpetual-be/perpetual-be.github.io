# perpetual.be

Site de Perpetual — promoteur et développeur immobilier, Bruxelles. Site statique construit avec [Astro](https://astro.build), hébergé sur GitHub Pages.

Le contenu est de la donnée, pas du code : les textes sont dans `content/`, les projets, les photos citées, les partenaires et la navigation dans `data/`. Ajouter un projet ou changer un texte ne demande pas de toucher au HTML.

## Lancer en local

Prérequis : Node.js 22 ou plus récent.

```bash
npm install
npm run dev        # http://localhost:4321, rechargé à chaque modification
npm run build      # génère le site dans dist/
npm run preview    # sert dist/ pour vérification
```

Le premier `npm run build` produit toutes les versions des photos et prend plusieurs minutes ; les suivants repartent du cache `.astro-cache/` et ne prennent que quelques secondes.

Le build s'arrête avec un message qui dit quoi corriger quand une donnée manque ou ne colle pas (une photo citée mais absente, un projet oublié dans la vue Réalisations, un champ obligatoire vide…).

## Déployer

Chaque push sur la branche `main` construit le site et le publie sur GitHub Pages (`.github/workflows/deploy.yml`). Aucune étape manuelle.

Les pull requests ouvertes depuis une branche de ce dépôt sont fusionnées automatiquement dans `main` dès que le site se construit sans erreur (`.github/workflows/auto-merge.yml`), puis le site est déployé. Une PR dont le build échoue reste ouverte. Pour garder une PR ouverte (relecture, travail en cours), lui ajouter l'étiquette `no-auto-merge` ; la retirer relance la fusion.

Les deux workflows gardent les photos déjà produites d'un build à l'autre (cache `.astro-cache`) : un build ne produit que les versions nouvelles. Le cache d'une PR ne sert qu'à cette PR : le déploiement qui suit la fusion refait donc les versions nouvelles qu'elle a introduites. Les workflows retirent `.astro-cache/data-store.json` avant chaque build, pour que les pages légales soient toujours rendues à neuf ; en local, après une modification de `src/lib/rehype-registre.mjs`, faire de même :

```bash
rm .astro-cache/data-store.json
```

## Où modifier quoi

| Je veux… | Fichier |
|---|---|
| Changer le texte d'une page | `content/<page>.md` — voir [Les textes des pages](#les-textes-des-pages) |
| Changer le titre ou la description d'une page (onglet, moteurs de recherche, partage) | l'en-tête (`title`, `description`) de `content/<page>.md` ; une fiche projet : sa description est calculée depuis `data/projects.json` (« `name`, `location` · `surface` · `use`. » puis la phrase de la Home) |
| Les chiffres clés et le graphique de la Home | l'en-tête de `content/home.md` (`stats`, `portfolio`) |
| La photo du premier écran de la Home et son cadrage | l'en-tête de `content/home.md` (`hero` : `photo`, la clé de la photo ; `focal`, son point focal, ex. `"50% 20%"`) |
| Le titre et le paragraphe à côté de la carte (Home) | l'en-tête de `content/home.md` (`carte` : `title`, `text`) |
| La carte des réalisations (contour, points, étiquettes, villes) | `data/carte/belgique.svg` et `data/carte/belgique.json` |
| Ajouter ou modifier un projet | `data/projects.json`, puis `data/realisations.json` — voir [Ajouter un projet](#ajouter-un-projet) |
| L'ordre des projets et la mosaïque des agences (vue Réalisations) | `data/realisations.json` — voir [La vue Réalisations](#la-vue-réalisations) |
| Ajouter une photo, en changer, la recadrer | `design/directions/img/` et `data/projects.json` — voir [Ajouter une photo](#ajouter-une-photo) |
| Le texte alternatif d'une photo | sa légende dans `data/projects.json` (`captions`, par fichier) ; à défaut « nom, lieu » pour un projet (« The Bank, Liège »), la ville pour un bien de la mosaïque (`src/lib/alt.ts`) |
| Ajouter ou retirer un logo partenaire (page Collectif) | `data/partners.json` et `public/partners/` — voir [Partenaires](#partenaires) |
| La navigation de l'en-tête et du menu du téléphone | `data/site.json`, `nav` — voir [Navigation, pied de page et menu du téléphone](#navigation-pied-de-page-et-menu-du-téléphone) |
| Le pied de page : plan du site, contact, e-mail, ville, citation | `data/site.json` (`plan`, `contact`, `email`, `name`, `city`, `quote`) |
| L'image de partage (réseaux, messageries : `/partage.jpg`, 1 200 × 630) | `src/lib/partage.ts` : la clé de la photo et son point focal ; l'image est produite au build (`src/pages/partage.jpg.ts`) |
| Les icônes (`/favicon.svg`, `/favicon-32.png`, `/apple-touch-icon.png`) | `public/favicon.svg` ; les PNG en sont tirés au build (`src/lib/icones.ts`) |
| Renvoyer une ancienne adresse du site de 2020 vers la nouvelle | `src/pages/[ancienne].astro`, la liste `ANCIENNES` (aujourd'hui `/projets` → `/realisations`, `/contact` → `/#contact`) |
| Une couleur, une taille, une police | `src/styles/jetons.css` (les composants ne lisent que ses rôles `--c-*`, `--surface-*`, `--fs-*`…) |
| La mise en page d'une page | `src/pages/` (une page par fichier), `src/components/` et `src/styles/` (une feuille par page) — voir [Structure](#structure) |
| L'indexation par les moteurs de recherche | `data/site.json`, `indexation` — voir [Mise en ligne sur perpetual.be](#mise-en-ligne-sur-perpetualbe) |

Rien à tenir à jour pour `sitemap.xml` (écrit après chaque build avec toutes les pages, sauf la 404, `/dev/` et les redirections : `astro.config.mjs`) ni pour `robots.txt` (écrit d'après `indexation` : `src/pages/robots.txt.ts`).

### Les textes des pages

Un fichier Markdown par page dans `content/`. L'en-tête (entre les `---`) porte le titre, la description et les réglages de la page ; le corps, les textes. Les commentaires HTML (`<!-- … -->`) sont des notes internes : ils ne sont jamais publiés.

| Page | Fichier | Comment le corps est lu |
|---|---|---|
| Home (`/`) | `content/home.md` | des blocs séparés par une ligne vide : l'accroche (le bloc qui commence par `# `), les paragraphes, puis la signature (le dernier bloc) ; texte brut, sans mise en forme Markdown |
| Collectif (`/collectif`) | `content/collectif.md` | des blocs séparés par une ligne vide : les paragraphes, puis la phrase de fin en grand (le dernier bloc) ; texte brut. Les logos viennent de `data/partners.json` |
| Engagements (`/engagements`) | `content/engagements.md` | une rangée par titre `##` (le verbe), puis ses paragraphes ; seuls les liens `[texte](adresse)` sont rendus. L'œuvre sur sa cimaise est dans l'en-tête (`oeuvre` : `rang`, l'id de la rangée qui la porte, ex. `soutenir` ; `photo`, sa clé ; `legende` et `detail` du cartel, le détail avec ses espaces insécables ; `alt`) |
| Réalisations (`/realisations`) | `content/realisations.md` | le titre et la description de l'en-tête ; le paragraphe qui suit « ## Le programme agences » remplit les deux cases de texte de la mosaïque, coupé à la première phrase (deux phrases au moins, sinon le build s'arrête) |
| Mentions légales, confidentialité | `content/mentions-legales.md`, `content/politique-confidentialite.md` | une rangée par titre `##` (« 1. Titre » : le numéro devient « 01 » au-dessus du titre), le Markdown de la section à droite (gras, italique, listes, liens, retours à la ligne forcés). La confidentialité affiche sa date de mise à jour dès que l'en-tête la donne (`updated`, date ISO) ; vide, la ligne n'apparaît pas et le build l'écrit en avertissement |
| Page 404 (adresse inconnue) | `content/404.md` | des paragraphes, sans titre (le titre est dans l'en-tête) ; seuls les liens sont rendus |

Les textes en blocs sont insérés tels quels : les espaces insécables du fichier sont gardés, et une espace insécable est ajoutée avant « : » dans les paragraphes d'Engagements et de la 404 et dans les pages légales. `content/contact.md` n'est pas affiché : le bloc contact est le pied de page, lu dans `data/site.json`.

### Navigation, pied de page et menu du téléphone

- **Les entrées de l'en-tête** : `nav` dans `data/site.json`, un libellé et une adresse par entrée. Les mêmes entrées forment le menu du téléphone. L'entrée de la page en cours est soulignée (prop `active` de chaque page, ex. `active="/realisations"` dans `src/pages/realisations.astro`).
- **Le pied de page** : `plan` (les liens), `contact`, `email`, `name` et `city`, `quote` dans `data/site.json` ; balisage dans `src/components/SiteFooter.astro`, styles dans `src/styles/pied.css`. Il porte `id="contact"`, la cible de l'entrée « Contact ».
- **Le menu du téléphone** (jusqu'à 640 px) : le bouton à trois traits et le panneau sont dans `src/components/SiteHeader.astro` (balisage et script), leurs styles dans `src/styles/entete.css`. Le menu ne s'active qu'avec la classe `menu-js`, posée sur `<html>` dès le `<head>` par `src/layouts/Base.astro`, avant le premier rendu : sans elle (sans JavaScript), pas de bouton et les entrées restent visibles sur une seconde ligne. Une entrée de plus : vérifier qu'elle tient dans le panneau et, au-dessus de 640 px, sur la ligne de l'en-tête.
- **L'en-tête collant** (il se cache quand on descend, revient quand on remonte) : le premier script de `src/components/SiteHeader.astro`.

## Ajouter un projet

1. **Les photos** : les réduire et les déposer dans `design/directions/img/`, nommées `<id>-01`, `<id>-02`… (voir [Ajouter une photo](#ajouter-une-photo)).
2. **Le projet** : une entrée dans `data/projects.json` (champs [ci-dessous](#projets-dataprojectsjson)). Son `kind` décide où il apparaît :
   - `detailed` : un projet avec sa fiche (`/realisations/<id>`) et son bloc sur la vue Réalisations ;
   - `project` : un projet sans fiche, son bloc sur la vue Réalisations ouvre ses photos ;
   - `agency` ou `gallery` : un bien du programme agences, une tuile de la mosaïque.
3. **Sa place sur la vue Réalisations** : `data/realisations.json` — un `detailed` ou un `project` dans `rangees`, un `agency` ou un `gallery` dans `mosaique` (voir [La vue Réalisations](#la-vue-réalisations)). Le build s'arrête si un projet y manque ou y figure deux fois.
4. **La carte de la Home**, pour une ville nouvelle : son point et son étiquette dans `data/carte/belgique.svg`, sa longitude dans `data/carte/belgique.json`. Le titre de la carte (`carte.title`, `content/home.md`) est à retoucher si le projet est plus à l'ouest ou plus à l'est que ceux qu'il nomme.
5. `npm run build`, puis vérifier la page (`npm run preview`) et `/dev/photos`.

### Projets (`data/projects.json`)

Une entrée par projet.

| Champ | Rôle |
|---|---|
| `id` | clé du projet, dans l'adresse de sa fiche ; c'est aussi le préfixe de ses photos (`<id>-01`, `<id>-02`…) |
| `name` | nom affiché |
| `kind` | `detailed`, `project`, `agency` ou `gallery` (voir plus haut) |
| `order` | ordre au sein de son `kind` ; projets détaillés : l'ordre des fiches et de leur boucle « Projet précédent / suivant » |
| `location`, `surface`, `use` | lieu, surface et usage : les trois infos d'une fiche, les faits Lieu, Surface, Usage d'un bloc ; pour un bien de la mosaïque, la surface et l'usage de sa tuile. La ville d'une tuile est le `name` d'un `agency`, le `location` d'un `gallery` |
| `projet` | projet sans fiche dont l'usage n'est pas connu : le troisième fait de son bloc (« Projet »), montré tant que `use` manque |
| `region` | projet détaillé : la région, au-dessus du titre de sa fiche |
| `quartier` | projet détaillé, facultatif : la « Localisation » de sa fiche quand elle n'est pas `location` |
| `tete` | projet détaillé : la photo de tête de sa fiche (la première de `selection`), `{ "cadre": "paysage" \| "carre", "focal": "50% 0%" }` — `paysage`, 50 % de la page au format 2100 / 1694 ; `carre`, 40 %, 1:1 ; `focal`, son point focal |
| `bloc` | projet détaillé ou sans fiche : `{ "focal": "50% 30%" }`, le point focal de sa photo sur la vue Réalisations |
| `was`, `saw`, `became` | projet détaillé : les trois chapitres de sa fiche (« Le lieu », « Notre idée », « Aujourd'hui ») |
| `selection` | les photos montrées, en clés sans extension (`<id>-03`), dans l'ordre. Projet détaillé : la première est la tête de sa fiche et la photo de son bloc, les suivantes la mosaïque de sa fiche. Projet sans fiche, bien de la mosaïque : la première est sur le bloc ou la tuile (elle donne son format à la tuile, montrée entière), toutes se parcourent sur place et dans la visionneuse. Se change ici, sans toucher au code |
| `captions` | légende par fichier photo (`"<clé>.jpg": "…"`), qui sert de texte alternatif |
| `photos` | les fichiers du reportage, pour mémoire |
| `address`, `hero`, `heroCandidates`, `apercu` | données de référence, pas utilisées par le site aujourd'hui |

Un champ obligatoire manquant (pour une fiche : `order`, `region`, `location` ou `quartier`, `surface`, `use`, `tete`, `was`, `saw`, `became`, `selection` ; pour un bloc : `selection`, `bloc.focal`, `location`, `surface`, `use` ou `projet` ; pour une tuile : la ville, `surface`, `use`) arrête le build, comme une clé de `selection` qui n'est pas une photo du projet.

### La vue Réalisations

`data/realisations.json` compose la page :

- `rangees` : les rangées de projets, de haut en bas. Chacune a sa `classe` — `a` (7/12 puis 5/12), `b` (5/12 puis 7/12) ou `seul` (toute la largeur) — et ses `projets`, chacun son `id` et sa `part` de la rangée en douzièmes (7 et 5, 5 et 7, ou 12). Chaque projet `detailed` ou `project` y figure une fois.
- `mosaique` : les rangées de la mosaïque des agences, 3 ou 4 cases chacune. Une case est l'id d'un bien (`agency` ou `gallery`) ou l'une des deux cases de texte, `cas:debut` et `cas:fin`. Chaque bien y figure une fois ; sa tuile prend le format de sa première photo.

## Ajouter une photo

Le dépôt ne contient que des versions réduites des photos, dans `design/directions/img/` ; c'est la seule source des photos du site. Les originaux restent dans le Drive (`PERPETUAL / Site 2026 / 02 Photos/<id du projet>/`, nommés `<id>-01.jpg`, `<id>-02.jpg`…) et n'entrent jamais dans le dépôt.

Chaque photo a une **clé**, `<id>-NN` (ex. `community-05`). Le site a besoin de sa version de 1 800 px, `<clé>.jpg` ; une photo montrée en grand (premier écran, tête de fiche, bloc pleine largeur) a aussi sa version de 2 800 px, `<clé>-l.jpg`.

1. Réduire l'original (redressement, métadonnées retirées, JPEG qualité 82) :

   ```bash
   node design/directions/src/reduire-photos.mjs --grand "G:\Mon Drive\PERPETUAL\Site 2026\02 Photos\brosse\brosse-01.jpg"
   ```

   Ajouter `--tres-grand` pour la version de 2 800 px.
2. Committer les fichiers produits dans `design/directions/img/`.
3. Citer la clé dans `data/projects.json` (`selection`, à sa place dans l'ordre d'affichage) et, si elle a une légende, l'ajouter dans `captions`.
4. `npm run build` : une clé citée sans version de 1 800 ou 2 800 px arrête le build, avec la marche à suivre.

**Recadrer une photo** : ajouter sa clé dans `design/directions/src/recadrages.json` (gauche, haut, largeur, hauteur, en fractions de l'original redressé, et la raison), puis la réduire de nouveau. Le recadrage est appliqué à chaque réduction ; l'original du Drive reste entier.

**Changer le cadrage sans recadrer** : le point focal (`focal` de `tete`, `bloc` ou `hero`), une position CSS (`"50% 20%"` : centré en largeur, 20 % depuis le haut).

**Page de contrôle** : `/dev/photos` (non indexée, aucun lien vers elle) montre chaque photo citée par `data/projects.json`, projet par projet, et signale en rouge une clé citée mais absente du dépôt.

**Ce que fait le build** : `src/lib/photos.ts` trouve la plus grande version d'une clé ; `src/components/ProjectPhoto.astro` l'affiche en plusieurs largeurs (800, 1 200, 1 800, 2 800 px, jamais au-delà de la source), en AVIF et WebP avec un JPEG de repli. La visionneuse charge une version WebP de 1 800 px au plus, seulement à son ouverture. Le site publié ne contient que les versions servies : l'intégration `images-orphelines` (`astro.config.mjs`) retire de `dist/` toute image qu'aucune page ne cite, et le build en écrit la liste.

## Partenaires

Les logos de la page Collectif, dans l'ordre de `data/partners.json`. Une entrée par partenaire :

| Champ | Rôle |
|---|---|
| `id` | clé du partenaire ; c'est aussi le nom de ses fichiers (`<id>.svg`) dans `public/partners/couleur/`, `mono/` et `encre/` |
| `name` | nom affiché au survol, et texte alternatif |
| `logo` | le logo en couleurs, celui que montre le site (`/partners/couleur/<id>.svg`) |
| `logoMono` | la déclinaison noire (`/partners/mono/<id>.svg`) |
| `logoInk` | la déclinaison à encre variable (`/partners/encre/<id>.svg`) ; obligatoire : son `viewBox` donne la hauteur du logo |
| `url` | site du partenaire, facultatif |

Ajouter un logo : ses trois fichiers SVG dans `public/partners/couleur/`, `mono/` et `encre/`, puis une entrée dans `data/partners.json`.

Les trois jeux de SVG sont **normalisés optiquement** : chaque fichier a un canevas de 100 unités de haut (`viewBox="0 0 <largeur> 100"`), le logo centré dedans à une taille qui égalise son poids visuel. La page calcule la hauteur de chaque logo depuis la largeur de ce canevas (`src/components/collectif/Partenaires.astro`) : il ne faut **pas** régler la taille logo par logo.

| Jeu | Ce que c'est | Comment l'insérer |
|---|---|---|
| `couleur/` | couleurs d'origine de chaque partenaire | `<img src="…">` |
| `mono/` | noir pur `#000000`, figé dans le fichier | `<img src="…">` |
| `encre/` | même tracé, peint en `currentColor` | **SVG inline obligatoire** |

**Piège à connaître sur `encre/`** : `currentColor` ne traverse pas la frontière d'un `<img>`. Inséré avec `<img src="/partners/encre/asap.svg">`, le logo s'affiche en noir, exactement comme `mono/`. Pour que la couleur suive le CSS, le SVG doit être inséré dans le HTML (lu au build), et sa couleur se règle alors par la propriété `color` du conteneur.

## Structure

```
content/                 textes des pages (Markdown), un fichier par page
data/projects.json       projets détaillés, projets sans fiche, programme agences, galerie
data/realisations.json   la composition de la vue Réalisations : rangées des projets, mosaïque des agences
data/partners.json       logos partenaires
data/site.json           navigation, pied de page, coordonnées, citation, réglage d'indexation
data/carte/              la carte des réalisations de la Home : belgique.svg et belgique.json
design/directions/img/   les photos réduites, source des photos du site
design/directions/src/   reduire-photos.mjs et recadrages.json
public/                  fichiers servis tels quels : favicon.svg, fonts/ (les quatre polices du site), partners/
src/layouts/Base.astro   mise en page commune : <head> (titre, description, noindex, lien canonique, partage, icônes, polices), en-tête, <main>, pied de page
src/pages/               une page par fichier : index (Home), collectif, engagements, realisations, realisations/[id] (les fiches),
                         mentions-legales, confidentialite, 404, dev/photos, [ancienne] (redirections), robots.txt, partage.jpg, icônes PNG
src/components/          en-tête, pied de page, ProjectPhoto, Visionneuse ; puis un dossier par page : home/, collectif/, engagements/
                         (aussi le gabarit des pages de texte), fiche/, realisations/
src/lib/                 la lecture des données : contenu.ts (textes), photos.ts, alt.ts (textes alternatifs), carte.ts, partage.ts,
                         icones.ts, rehype-registre.mjs (la mise en forme des pages légales)
src/scripts/boucle.js    la piste en boucle de la visionneuse et des photos parcourables
src/styles/              polices, jetons, base, entete, pied (communes, importées par Base.astro) ; puis une feuille par page
astro.config.mjs         adresse du site, cache, et les intégrations : pages de texte, images orphelines, sitemap.xml
```

## Domaine

Le site est servi sur `perpetual.be` via GitHub Pages (fichier `public/CNAME` + enregistrements DNS chez l'hébergeur du domaine).

### Mise en ligne sur perpetual.be

Côté dépôt : `site: 'https://perpetual.be'` dans `astro.config.mjs`, le fichier `public/CNAME` (`perpetual.be`) et `"indexation": true` dans `data/site.json`. Rien d'autre : le `noindex` des pages part (sauf la 404 et `/dev/photos`), `robots.txt` s'ouvre et renvoie au plan du site, et `sitemap.xml` passe aux adresses de `perpetual.be`. Pour changer d'hébergeur, il suffit de lancer `npm run build` et de servir le contenu de `dist/` : aucune dépendance à GitHub dans le site lui-même.
