# Perpetual — Brief de maquette (lot 2, direction visuelle)

_Écrit le 18/09/2026 pour la session Claude Code qui construit la maquette. Ce fichier est autonome : tout ce qu'il faut savoir est ici ou dans les fichiers qu'il cite. Le suivi vivant (décisions, TODO, heures) est dans l'artefact « Cockpit Perpetual » d'Axel ; les décisions citées ici en sont extraites._

## 0. En deux minutes

- **Le site** : refonte de perpetual.be, promoteur-développeur immobilier bruxellois (Julien De Dobbeleer). Public : banques, investisseurs, partenaires. Ton : sobre, preuves, chiffres, photos. Site statique Astro 7 dans ce dépôt, hébergé sur GitHub Pages ; FR seul.
- **Où on en est** : lots 0 et 1 finis (squelette, contenu structuré, photos, logos). Lot 2 = direction visuelle. Deux planches (A et B) et deux planches complémentaires (typo, bande) ont été produites dans `design/directions/` ; Axel a tranché la direction **A — blanc et or** et a établi des short-lists. **La maquette sert à prendre les derniers choix en voyant**, puis à montrer la direction à Julien.
- **Dates** : mail à Julien **lundi 21 ou mardi 22/09** avec des PNG ; présentation **mercredi 23/09** (porte 1). Rien d'autre n'a de date.
- **Qui décide** : les choix créatifs sont ceux d'Axel. Claude propose des options contrastées avec une recommandation, ne tranche jamais un choix visuel à sa place. Axel est visuel : il décide en voyant, d'où les bascules.
- **Périmètre de cette session** : trois pages HTML/CSS de maquette dans `design/maquette/`, avec un panneau de bascules. **Ne pas toucher** à `content/`, `data/`, `src/`, `public/` : ça, c'est le lot 4.

## 1. Livrables

Dans `design/maquette/` :

| Fichier | Contenu |
|---|---|
| `index.html` | **Home** — complète, la page qui porte le plus de bascules |
| `projet-the-bank.html` | **Fiche projet** — The Bank, complète |
| `projets.html` | **Vue Projets** — 4 projets → programme agences → galerie ; plus légère, réutilise le système |
| `maquette.css` | Les jetons (`:root`) et les styles, écrits pour être déplacés tels quels dans `src/styles/` au lot 4 |
| `maquette.js` | Le panneau de bascules et les comportements (survols, roue) |
| `export/` | PNG 1440 × 900 (pleine page) et 390 (mobile) de la combinaison retenue, pour Julien |

Chaque page est lisible **en ouvrant le fichier directement dans le navigateur** (`file://`) : pas de framework, pas d'étape de build obligatoire, polices en `@font-face` locales, images en chemins relatifs. Un petit serveur local (`npx serve design/maquette` ou équivalent) est un confort, pas une nécessité. Si tu préfères générer les pages à partir des données (`data/projects.json`, `content/*.md`) plutôt que de les écrire à la main, `design/directions/src/build-directions.mjs` montre la méthode utilisée pour les planches ; c'est optionnel.

## 2. Ce qui est tranché (ne pas rouvrir)

- **Architecture « C' »** : Home = accroche + 2 § + signature → 4 chiffres → graphique 11 150 m² → section projets (liste des 4 et/ou roue) → Collectif (texte + logos partenaires) → pied de page avec le bloc contact. Projets = vue d'ensemble. Une **fiche par projet détaillé**. Engagements = page à part (pas dans cette maquette). **Contact = bloc en pied de page + ancre `#contact`**, pas de page.
- **Header** : logo (Φ + nom) **à gauche** ; Projets · Engagements · Contact ; pas d'entrée Accueil (le logo y renvoie) ; sur mobile, **Φ seul + les trois mots, pas de burger**. Page active : trait fin dessous. Survol : le trait glisse (c'est l'effet retenu pour tous les liens).
- **Direction A** : fond blanc pur ; texte **anthracite `#26231F`** (jamais de gris pour un paragraphe — le gris `#6B655C` / `#9A948A` sert aux étiquettes, légendes, métadonnées) ; **une seule couleur, l'or**, pour les éléments de design (chiffres, filets, signature, lien actif, survol), jamais pour un paragraphe. **Jamais de bleu.** Vert profond et brique : écartés.
- **Or** : or mat `#9A7A3B` (chiffres, filets épais), `#8A6B2F` (liens, texte accent), `#B8975A` (filets fins, survol). Le **Φ du logo reste au bronze d'origine `#684E1E`** (c'est la couleur de la marque, utilisée aussi en signature d'e-mail) ; le nom du logo en anthracite (le bleu nuit `#222460` d'origine n'a plus d'usage).
- **Serif pour les titres, sans pour le texte** ; les candidates sont en bascule (§3).
- **Le « non » ferme d'Axel : rien de démesuré.** Sur un portable (1440 × 900, et vérifier 1366 × 768), ce qui va ensemble tient dans un écran : **l'accroche et les quatre chiffres sont visibles sans scroller**. Accroche 52 px, chiffres 58 px, titres 32–34 px, texte 17 px. **Élégant et raffiné sans tomber dans le luxe** — si l'or y tombe, on en met moins.
- **Aucun arrondi, aucune ombre, aucun bouton** (ni pilule, ni rectangle plein). Les actions sont des liens texte soulignés d'un trait fin qui glisse.
- **Photos** : zoom léger (×1,035, 500 ms) sur toute photo cliquable ; dans la galerie, **surface · usage au survol** en surimpression, nom sous la photo au repos ; sur téléphone tout est affiché (pas de survol). **Pas** de seconde photo au survol.
- **Fiche projet** : lieu en petit → titre → photo hero à hauteur raisonnable (≈ 520 px, pas plein écran) → bande de 3 faits (Localisation · Surface · Usage) → trois chapitres « Ce que c'était / Ce que nous y avons vu / Ce que c'est devenu » en colonne de 760 px alignée à gauche, **avec des photos intercalées** entre les chapitres → projet suivant. Pas « une image énorme puis que du texte ».
- **Pas d'étiquettes à gauche** façon Snøhetta (sauf éventuellement la liste des 4 projets).
- **Logos partenaires** : fond blanc, **encre noire (anthracite)** par défaut ; fichiers `public/partners/encre/*.svg` peints en `currentColor` — **à injecter inline** (currentColor ne traverse pas un `<img>`), en retirant le bloc `<metadata>` C2PA que certains fichiers contiennent.
- **Graphique 11 150 m²** : trois barres horizontales d'une seule couleur (or), étiquette à gauche, pourcentage à droite, pas de légende. Anneau en bascule.
- **Texte** : les textes de Julien tels quels, non réécrits (la réécriture est le lot 3). Libellés du menu « Projets » / « Réalisations » : provisoirement **« Projets »** ; ce sera tranché au lot 3, ne pas y passer de temps.

## 3. Les bascules (le panneau)

Un panneau discret en bas à droite, repliable, qui écrit des `data-*` sur `<html>` ; **tout le style dépend de variables CSS et de ces attributs**, aucune bascule ne duplique du HTML sauf quand la structure change vraiment (chiffres sur photo, roue). L'état est **sérialisé dans le hash de l'URL** (`#serif=literata&or=touches…`) pour qu'une combinaison se copie et se partage ; un bouton « copier la combinaison » ; un bouton « présentation » qui cache le panneau (pour les captures). Valeurs par défaut = la planche A telle qu'Axel l'a préférée.

| # | Bascule | Valeurs (défaut en gras) | Note |
|---|---|---|---|
| 1 | Liens du header | **droite** / centre | logo toujours à gauche |
| 2 | Serif | **Newsreader** / Source Serif 4 / Literata / Playfair Display | fichiers dans `design/directions/fonts/` |
| 3 | Portée de la serif | **partout** (accroche, titres de section et de chapitre, chiffres, noms des projets, citation, signature) / rationnée (accroche, chiffres, noms des projets, citation, signature seulement — titres de section et de chapitre en sans medium) | idée venue de jackandjill.ai |
| 4 | Sans | **Inter** / Instrument Sans | texte, navigation, étiquettes |
| 5 | Wordmark | **tracé actuel** / Jost 400 interlettrage 0,18 em / Source Serif 4 / Literata / Playfair — capitales, interlettrage 0,26 em pour les serifs | tracé actuel = masque PNG recolorable, voir `design/directions/src/wordmark-mask.png` ; Φ toujours en SVG (`public/favicon.svg`, en `currentColor`) |
| 6 | Couleur du Φ | **bronze `#684E1E`** / or mat `#9A7A3B` | |
| 7 | Dosage de l'or | **partout** (chiffres, filets, signature, bande sable) / touches (chiffres et signature en anthracite, bande blanche ou papier, or réservé au Φ et au trait de survol) | « touches » = l'esprit noir et blanc de la planche B |
| 8 | Surface de la bande | **sable `#F6F1E6`** / papier `#F9F9F6` | filets `#E6E1D6` |
| 9 | Chiffres clés | **4 colonnes** dans une bande / liste (étiquette à gauche, chiffre à droite, un filet entre les lignes) / sur photo (pile à gauche façon Sofina, voile sombre) | sur photo : sous-choix photo **community-05** / data-box-02 / the-bank-01, et position **gauche** / droite |
| 10 | Élément de la bande | **0** rien / 1a deux arcs en miroir / 4 Φ en filigrane / 6 anneaux | géométrie et couleurs dans `design/directions/planche-bande.html` (SVG ancrés aux bords gauche et droit, hauteur 100 %) |
| 11 | Section projets de la Home | **liste des 4** (nom en serif 42 px + une ligne en gris, aperçu photo au survol) / roue / les deux / aucune | |
| 12 | Roue | centre : **Φ** / mot « Projets » / phrase courte ; 8 photos (les 4 agences du programme + 4 de la galerie), rotation continue ≈ 90 s par tour, chaque photo = lien ; **immobile si `prefers-reduced-motion`** ; bande horizontale sur téléphone | inspirée de la section mission de jackandjill.ai ; « perpétuel » sans l'écrire |
| 13 | Graphique | **barres** / anneau | |
| 14 | Logos partenaires | **noir** / gris chaud `#7A7466` / couleur (`public/partners/couleur/`) | |

La combinaison retenue par Axel devient les valeurs par défaut, puis les exports PNG.

## 4. Contenu et sources

- **Textes** : `content/home.md` (accroche, deux paragraphes, signature « Everything is already inside. », chiffres et répartition dans le frontmatter), `content/collectif.md`, `content/realisations.md` ; `data/site.json` (e-mail, ville, citation de Proust) ; `data/projects.json` (les 20 biens : `was` / `saw` / `became`, `surface`, `location`, `address`, `hero`, `heroCandidates`, `captions`, `photos`) ; `data/partners.json`.
- **Chiffres clés** : 2002 Actifs depuis · 30+ Agences bancaires transformées en quatre ans · 19 Jours entre chaque bien livré · 24 Projets en cours. **Graphique** : 11 150 m² — Industrial 41 % · Residential 34 % · Retail 25 %.
- **Photos réduites, prêtes** : `design/directions/img/` (1800 px et 800 px `-s`). Pour d'autres vues, les originaux sont dans le Drive local d'Axel, `G:\Mon Drive\PERPETUAL\Site 2026\02 Photos\<id>\<id>-01.jpg…` (2–4 Mo pièce, 2 500–3 300 px ; Data Box en 8064 px) — les réduire avant usage (≤ 1800 px, JPEG 82). Photo pleine largeur choisie : **The Bank → `the-bank-03.jpg`**. Candidates à tester : Ateliers 118 01 ou 05, Community 05/06/07/09/10/14/15, Data Box 01 ou 02. ⚠ Community 01–04, 11–13 sont en basse définition.
- **Bloc contact (pied de page)** : Julien De Dobbeleer · julien@perpetual.be · Perpetual, 1030 Bruxelles · Mentions légales · Confidentialité · citation de Proust · © 2026. Le plan du site en pied de page : Projets · Collectif (ancre `#collectif`) · Engagements · Mentions légales · Confidentialité. Pas de téléphone, pas d'adresse complète, pas de formulaire.
- **Logos** : Φ = `public/favicon.svg` (retirer le `<style>` interne, peindre en `currentColor`) ; wordmark = masque PNG `design/directions/src/wordmark-mask.png` (tracé du PNG d'origine, à embarquer en data URI et à appliquer en `mask-image` — un fichier externe en `file://` est bloqué par CORS) ; partenaires `public/partners/encre|mono|couleur/`.
- **Références visuelles** (pour comprendre le goût, pas pour copier) : Redevco (préféré d'Axel — chiffres en bande pâle, galerie avec infos au survol, son « pli » = inspiration seulement), Snøhetta (accroche en grand, liste typographique des projets, pas ses étiquettes à gauche ni son blanc « trop grand »), Sofina (chiffres sur photo), jackandjill.ai (trois neutres, serif rationnée, la roue ; pas ses pilules ni ses arrondis).

## 5. Les pages, écran par écran

**Home (`index.html`)**
1. Header.
2. Hero en deux colonnes (7/5) : accroche à gauche avec la signature en bas de colonne (italique, or), les deux paragraphes à droite. Padding 64 px haut, 56 px bas.
3. Bande des chiffres (ou liste, ou sur photo selon la bascule 9) — **visible dans les 900 px**.
4. Graphique 11 150 m².
5. Section projets (bascule 11) : liste des 4 projets, une ligne chacun (nom serif 42 px, ligne grise 16 px : « Molenbeek-Saint-Jean · 1 200 m² · Treize ateliers dans une ancienne usine de colle »), aperçu photo à droite qui suit la ligne survolée ; et/ou la roue.
6. Collectif : eyebrow « Collectif », deux paragraphes, la chute « Personne n'est tenu de revenir. Tous reviennent. » en serif italique 26 px, puis la bande des 8 logos (hauteur 30 px, gap 48 px, filet au-dessus).
7. Pied de page : contact / plan / citation, `id="contact"`.

**Fiche (`projet-the-bank.html`)** : header (Projets actif) → « Liège, rue des Mineurs » en eyebrow → « The Bank » 64 px → photo `the-bank-03` 520 px → bande de faits (Liège · 1 100 m² · Logements & commerce) → chapitre 01 « Ce que c'était » → deux photos (`the-bank-01` portrait 5 col, `the-bank-02` paysage 7 col, 440 px, légendes) → chapitre 02 → chapitre 03 → « Projet suivant — Data Box → » → pied de page.

**Projets (`projets.html`)** : header (Projets actif) → titre → les 4 projets (même liste que la Home, ou 4 grandes cartes photo — au choix, une seule proposition suffit) → programme agences (intro + les 4 exemples en liste typographique : Braine-le-Comte, Pont-à-Celles, Jambes, Mettet) → galerie en grille 3 colonnes 3:2 (12 biens, nom sous la photo, surface · usage au survol) → pied de page.

**Mobile (390 px)** : une colonne ; Φ seul dans le header ; accroche 36 px ; chiffres en 2 × 2 ; liste des projets sans aperçu ; galerie en une colonne avec les infos affichées ; roue → bande horizontale défilante.

## 6. Méthode et garde-fous

- **Commence en mode plan** : lis ce brief, `design/directions/direction-a.html` (la référence visuelle, ouvre-la dans le navigateur), `planche-typo.html`, `planche-bande.html`, et `design/directions/src/build-directions.mjs` (la source des planches : jetons, structure, CSS). Propose la structure des fichiers et l'ordre, puis construis **la Home d'abord** ; montre-la à Axel avant les deux autres pages.
- **Vérifie toi-même** avant de montrer : à 1440 × 900 l'accroche et les quatre chiffres tiennent dans le premier écran ; aucun débordement horizontal ; toutes les bascules changent bien quelque chose ; `prefers-reduced-motion` immobilise la roue ; contrastes : anthracite 15,6:1, or mat 4,0:1 (grands chiffres seulement, jamais du texte courant), `#8A6B2F` 5,0:1 (liens OK). Si Playwright est disponible (`npx playwright screenshot` ou un script), fais les captures ; sinon, Axel regarde dans son navigateur.
- **Un commit par page**, messages en français. Le dépôt est public : pas de note interne dans les fichiers (le pilotage vit dans le Cockpit).
- **Ne pas** : charger Google Fonts ou un CDN (tout est local), introduire du bleu, des dégradés (sauf le voile sur les photos), des arrondis, des ombres, des boutons, des animations autres que le trait des liens, le zoom des photos et la roue. Ne pas réécrire les textes. Ne pas toucher au favicon.
- **Quand Axel a tranché ses bascules** : figer les valeurs par défaut, exporter les PNG (Home, fiche, Projets ; 1440 pleine page et 390), les déposer dans `design/maquette/export/`. Le mail à Julien et le compte rendu se font dans Cowork, pas ici.

## 7. Ce que Julien verra le 23/09

Des PNG de la combinaison retenue, pas le panneau. Deux choses à lui **dire** (pas demander) : la proposition parlait de « 5 pages », tout le contenu y est mais réparti autrement (contact en pied de page, une fiche par projet) ; la Home ne s'arrête plus au graphique. Une chose à lui **montrer comme option** : la roue. Le wordmark recomposé ne lui est montré que si Axel le décide — « logo conservé » est dans la proposition acceptée, en changer est une question de périmètre à poser, pas un réglage. Trois questions maximum dans le mail.
