Gel complet de la Home : les deux dernières bascules (Cowork, 26/09). Indépendant de la fiche P6 : à faire avant ou après elle, jamais pendant. Lire d'abord design/maquette/src/README.md. Ne touche à aucun dossier design/revue-*.

Décisions d'Axel (26/09) : 9c cadrage de Community 05 = **haut, 50% 20%** ; 15a carte = **sable**. Il ne reste alors plus aucune bascule sur la Home.

1. build.mjs
   - photoCandidates : community-05, focal '50% 20%' (au lieu de '50% 50%'). Mettre à jour le commentaire au-dessus (plus de bascule 9c : cadrage figé le 26/09).
   - Ne changent pas : le blocFocal de community-05 dans four (vue Réalisations, 50% 50%) ni son point focal sur la fiche (P6 : 50% 50%). Le cadrage haut ne vaut que pour le premier écran de la Home.
   - Téléphone : pas d'exception à ajouter. Community 05 est en 4:3 ; dans le cadre de 390 × 420 elle est calée sur la hauteur, le point focal vertical n'y change rien.

2. maquette.css
   - Retirer les deux règles de la région « bascules » (9c `html[data-cadrage="haut"] .hero__photo img` et 15a `html[data-carte="papier-contour"] .carte__pays`) et leur commentaire « Home gelée le 23/09 : il ne reste que deux décisions reportées… ».
   - Retirer le jeton --trait-carte (il ne servait qu'à papier-contour).
   - --surface-carte reste sable ; ajuster son commentaire (figé le 26/09, plus « détaché » en attente de décision).

3. maquette.js
   - Retirer les entrées 9c et 15a de BASCULES ; mettre à jour le commentaire d'en-tête (Home entièrement figée le 26/09 : 9c haut, 15a sable) et l'exemple d'URL de la ligne 3 (prendre `?papier=tout&bas=anciens`).
   - Le panneau reste tel quel sur les pages sans bascule active (comme aujourd'hui sur la fiche : 22 et 23 grisées, « sans effet sur cette page »).
   - Un ?cadrage=… ou ?carte=… resté dans une URL n'a plus d'effet (le script d'état de build.mjs est générique : rien à y changer).

4. check.mjs
   - §1 et §2 : retirer les états 'cadrage=haut' et 'carte=papier-contour' (défaut seul).
   - §3 « chaque valeur de chaque bascule » : retirer les deux tests ; s'il ne reste rien pour la Home, retirer la boucle.
   - Test des paramètres des bascules retirées : ajouter cadrage=haut, cadrage=centre et carte=papier-contour à l'URL ; attendus : `.hero__photo img` en objectPosition '50% 20%' (au lieu de '50% 50%'), `.carte__pays` fill SABLE et stroke 'none'.
   - Photo du premier écran : focal === '50% 20%', libellé « cadrage haut, figé le 26/09 ».
   - Carte (deux endroits) : libellé « fond du pays sable (figé le 26/09) » au lieu de « par défaut (bascule 15a) ».
   - Panneau de la Home : clés 'papier bas', inactives 'papier bas' ; retirer le test « bascule 9c : centre / haut seulement ».
   - Panneau de la fiche : 'papier (sans effet) · bas (sans effet)'. Panneau de la vue Réalisations : 'papier [enonce / tout] · bas [rien / anciens]'.
   - Retirer la constante TRAIT_CARTE.

5. export.mjs : l'exemple du commentaire `--etat "cadrage=haut&carte=papier-contour"` devient `--etat "papier=tout&bas=anciens"`.

6. src/README.md
   - « Bascules restantes » : Home — plus aucune (9c figée sur haut, 50% 20% dans photoCandidates ; 15a figée sur sable, le 26/09).
   - Ajouter l'entrée d'historique correspondante ; retirer la mention « 9c cadrage de Community 05, temporaire » là où elle décrit l'état courant ; mettre à jour les exemples d'URL (`index.html?cadrage=haut&carte=papier-contour`) et d'export.

7. Rebâtir (node design/maquette/src/build.mjs), lancer check.mjs : tout vert. Regarder la Home à 1521 × 705 et 1920 × 1080 : même rendu que index.html?cadrage=haut avant le changement, accroche lisible.

Un seul commit : « Home figée : cadrage haut de Community 05 et carte sable, plus aucune bascule sur la Home ».
