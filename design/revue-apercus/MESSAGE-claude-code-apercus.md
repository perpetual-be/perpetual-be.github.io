Aperçus de la liste des 4 (Home) et ordre des projets (Cowork, 30/09). Lire d'abord design/maquette/src/README.md. Ne touche à aucun dossier design/revue-* ; les images de design/revue-apercus/references/ sont les rendus attendus (880 × 1100, le cadre de l'aperçu en 2×), à ne pas copier dans le site.

Décisions d'Axel (30/09) :
- **Ordre des quatre projets détaillés : The Bank, Data Box, Community, Ateliers 118.** Il vaut pour la liste des 4 de la Home et pour la boucle « Projet précédent / suivant » des fiches. La vue Réalisations garde sa composition (`rangees` : Community + Ateliers 118, puis The Bank + Data Box).
- **Aperçu de la liste des 4 : un cadrage propre à l'aperçu (cadre 4:5), défini en données.** La photo reste la photo n° 1 du projet (`selection[0]`), sauf pour Community : community-15 sur la Home seulement, pour ne pas montrer deux fois community-05 (premier écran) sur la même page. La tête de fiche et le bloc de la vue Réalisations ne changent pas (Community y garde la 05).

| Projet | Photo de l'aperçu | cadre [x, y, largeur, hauteur] | En clair |
|---|---|---|---|
| The Bank | the-bank-01 (selection[0]) | [0, 0, 1, 0.9375] | sans zoom, calée en haut (comme `50% 0%`) |
| Data Box | data-box-03 (selection[0]) | [0.205, 0, 0.45, 1] | sans zoom, glissée pour centrer le bâtiment (comme `37% 50%`) |
| Community | **community-15** | [0.2681, 0, 0.4638, 0.8696] | calée en haut, zoom ×1,15 |
| Ateliers 118 | ateliers-118-01 (selection[0]) | [0.1496, 0, 0.7407, 0.6944] | calée en haut, zoom ×1,35 |

Le cadre est en fractions de l'image entière (x et largeur sur sa largeur, y et hauteur sur sa hauteur) ; en pixels, largeur / hauteur = 4/5.

1. data/projects.json
   - `order` des projets détaillés : the-bank 1, data-box 2, community 3, ateliers-118 4. Agences et galerie : rien ne change.
   - Nouveau champ optionnel `apercu` sur les quatre projets détaillés : `{ "photo"?: "<clé>", "cadre": [x, y, largeur, hauteur] }`, valeurs du tableau. `photo` absent = `selection[0]` ; seul Community le renseigne (`"photo": "community-15"`).

2. src/content.config.ts : `apercu` dans le schéma des projets (`photo` chaîne optionnelle, `cadre` tuple de quatre nombres), avec un commentaire : « aperçu de la liste des 4 de la Home : photo (par défaut la première de selection) et cadrage dans le cadre 4:5, en fractions de l'image ». README.md du dépôt : une ligne `apercu` dans le tableau des champs de projects.json.

3. build.mjs
   - La liste des 4 de la Home suit `order` (DETAILLES), plus d'ordre écrit en dur. `four` garde ses infos par projet (ligne, blocFocal, lieu, surface, usage), lues par id ; `rangees` ne change pas.
   - Photo de l'aperçu : `apercu.photo ?? selection[0]`. Refuser (throw) une clé qui n'est pas du projet ou sans fichiers réduits, comme aujourd'hui ; refuser un `cadre` qui n'a pas quatre nombres, sort de l'image (x, y ≥ 0 ; x + largeur ≤ 1 ; y + hauteur ≤ 1) ou dont le rapport en pixels (largeur × L) / (hauteur × H), mesuré sur `<clé>.jpg`, s'écarte de 4/5 de plus de 1 %.
   - Rendu : le cadre montre exactement le `cadre`. Proposition : l'<img> de `.four__preview`, en absolu, reçoit en style `width: 100/largeur %`, `height: 100/hauteur %`, `left: −100·x/largeur %`, `top: −100·y/hauteur %`, et `transform-origin: 100·(x + largeur/2) % 100·(y + hauteur/2) %`, pour que le zoom 1,035 du survol reste centré sur la partie visible. Sans `apercu` : le comportement actuel (cover, centré).
   - `sizes` : l'<img> est 1/largeur fois plus large que le cadre ; pour un aperçu avec `cadre`, ce facteur remplace le rapport photo ÷ cadre dans `sizesCadre` (Data Box : 2,22 ; Community : 2,16 ; Ateliers 118 : 1,35 ; The Bank : 1).
   - Mettre à jour les commentaires qui disent « centrée, sans point focal » pour l'aperçu, et celui de l'ordre de la liste.

4. maquette.css : rien d'autre que ce que le rendu demande (les transitions de fondu et de zoom de `.four__preview img` restent).

5. check.mjs
   - Aperçu (le bloc « aperçu de la liste des 4 », Home à 1440 × 900) : clés dans l'ordre de `order` : `the-bank-01 data-box-03 community-15 ateliers-118-01`, chacune = `apercu.photo ?? selection[0]` ; pour chaque aperçu, la partie visible de la photo (boîte de l'<img> rapportée à celle de `.four__preview`) = son `cadre` à 0,5 % près ; cadre 440 × 550 (mesurer `.four__preview`, l'<img> est plus grande) ; à 1×, aucune photo agrandie (échelle calculée sur la boîte de l'<img>) ; Data Box 03 servie en 1800 px (la trouver par sa clé, plus par son rang).
   - Nouveau : aucune photo deux fois sur la Home — la clé du premier écran (community-05) n'est pas une clé d'aperçu.
   - Nouveau : au survol d'une ligne, le zoom 1,035 garde le centre de la partie visible (±1 px).
   - Liens de la liste : `projet-the-bank.html projet-data-box.html projet-community.html projet-ateliers-118.html`.
   - Fiches : les tests de la boucle lisent déjà `order` ; vérifier que The Bank a Ateliers 118 en précédent et Data Box en suivant, et Ateliers 118 The Bank en suivant.
   - Ne change pas : la tête de fiche et le bloc de Réalisations de Community restent community-05 ; le test à 1440 × 2 (1800 px servi) reste. Community 15 n'a que 1 536 px (original) : à 2×, l'aperçu en demande ~1 900, c'est connu, pas d'échec.

6. src/README.md : décrire `apercu` et l'ordre (liste des 4 et boucle des fiches par `order`) là où le README décrit `four` et l'aperçu ; entrée d'historique du 30/09.

7. Rebâtir (node design/maquette/src/build.mjs), lancer check.mjs : tout vert. Regarder la Home à 1521 × 705 et 1920 × 1080 : The Bank en tête de liste et dans l'aperçu au repos ; chaque aperçu au survol identique à design/revue-apercus/references/<id>.jpg ; les fiches, dans la boucle : The Bank → Data Box → Community → Ateliers 118 → The Bank.

Un seul commit : « Home : aperçus recadrés de la liste des 4 et nouvel ordre des projets (The Bank, Data Box, Community, Ateliers 118) ».
