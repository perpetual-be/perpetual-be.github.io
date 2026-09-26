# Message à coller dans Claude Code — page Engagements (Cowork, 26/09)

À envoyer **après** les messages « pied de page », « fiche P6 » et « gel de la Home » (`claude/perpetual-maquette.md` §6), un à la fois. Espace sous l'œuvre : 72 px par défaut — si Axel choisit 48 ou 32 dans le bandeau de `p1.html`, remplacer la valeur au point 1 (et 44 → 32 ou 24 au téléphone).

```
Page Engagements (Cowork, 26/09). Lire d'abord design/maquette/BRIEF.md et design/maquette/src/README.md.
Référence validée par Axel : design/revue-engagements/propositions/p1.html — page statique (système de maquette.css + CSS propre dans son <style>, un bandeau de réglage à ignorer). La reprendre dans build.mjs. Ne touche pas au contenu des autres pages, sauf les liens « Engagements » (point 4).

1. Nouvelle page design/maquette/engagements.html (engagementsPage() dans build.mjs), html data-page="engagements", générée depuis content/engagements.md :
   - Page de texte : contenu sur le container de 1 200 px (.container), comme la Home ; en-tête et pied de page communs. « Engagements » actif dans la navigation (classe is-active, aria-current="page").
   - Ouverture : h1.page__titre « Engagements » seul, sans sous-titre. Titre en sans léger, comme Réalisations : html[data-page="engagements"] .page__titre{font-family:var(--sans);font-weight:400;letter-spacing:-.028em;line-height:1.02} ; padding 32 / 30 px (téléphone : celui de .page-head).
   - Trois rangées, une par titre ## du Markdown : .registre (padding-top 12 px) > section.rang#aider | #transmettre | #soutenir. Grille 5fr / 7fr, écart 64 px, filet (1px var(--filet)) en haut, padding 30 / 52 px. À gauche le verbe en h2, serif 400, var(--fs-nom) (42 px ; 30 au téléphone), interligne 1,05, interlettrage −0,01 em. À droite les paragraphes : 17 px, max-width 62ch, 16 px entre paragraphes, text-wrap:pretty ; padding-top 9 px (la première ligne à hauteur de l'œil du verbe).
   - Dernière rangée : 72 px de padding bas (44 au téléphone) — c'est l'espace entre le bas de l'œuvre et le pied de page.
   - Liens dans le texte, classe .lien-texte : texte anthracite, border-bottom 1px var(--c-trait-fin), var(--c-trait) au survol et au focus. [Écrivez-nous] → #contact (le bloc du pied de page). [Créahmbxl] → https://creahmbxl.be, target="_blank" rel="noopener", suivi d'un span visuellement masqué « (nouvel onglet) ».
   - Typographie : espace insécable avant « : ».
   - Téléphone : une colonne par rangée — le verbe, le texte (padding-top 14 px), puis l'œuvre (28 px au-dessus).

2. L'œuvre, dans la colonne de gauche de la rangée Soutenir, 32 px sous le verbe :
   - .cimaise : fond var(--surface), padding 44 / 48 / 36 px (téléphone : 28 / 24 / 22), dans la colonne (jamais en pleine largeur, pas au-delà des gouttières au téléphone).
   - figure.oeuvre dans la cimaise : max-width 340 px, centrée (pleine largeur du panneau au téléphone) ; l'image entière, width 100 %, height auto — jamais d'object-fit, pas de lien, pas de zoom.
   - figcaption.cartel, 16 px sous l'image : « Ines Reddah, 2024 » (bloc, 14 px, 500, anthracite), puis « Feutres et acrylique, 65 × 82 cm » (bloc, 13 px, var(--c-meta), espaces insécables autour de × et avant cm).
   - Fichier : copier design/revue-engagements/propositions/img/ines-reddah-2024-recadree.jpg (870 × 1132, recadré sur la feuille ; ne pas le recompresser) dans design/directions/img/. width/height sur l'<img>. alt : « Peinture d’Ines Reddah, 2024 : deux grands visages ronds cernés de bleu et de rose, entourés de traits verticaux de couleur. » (provisoire, lot 3).
   - Les données de l'œuvre (fichier, légende, détail, alt) dans un objet oeuvre de build.mjs, comme fiche.

3. content/engagements.md :
   - retirer le champ subtitle du frontmatter (décision d'Axel du 26/09 : pas de sous-titre) ;
   - [Écrivez-nous](/contact) → [Écrivez-nous](#contact) ;
   - remplacer le commentaire « Œuvre — Créahmbxl : une image sera ajoutée… » par : l'œuvre (Ines Reddah, 2024, recadrée) est sur une cimaise sous « Soutenir » ; ses données sont dans build.mjs.
   Le reste du texte ne change pas.

4. Les trois autres pages : les liens « Engagements » de la navigation et du plan du pied de page (aujourd'hui href="#") pointent vers engagements.html. Panneau (maquette.js) : ajouter l'onglet Engagements ; aucune bascule sur cette page (les autres y sont grisées, « sans effet sur cette page »). export.mjs : ajouter engagements aux pages par défaut.

5. check.mjs, page Engagements :
   - aucune erreur ni débordement horizontal à 1521×705, 1440×900, 1920×1080 et 390×844 ; polices chargées ;
   - .page__titre en Instrument Sans 400, au même x que le texte de la Home (container de 1 200 px) ; pas de sous-titre (.ouv__texte absent) ; le contact du pied de page au même x que sur les autres pages ;
   - trois .rang (aider, transmettre, soutenir), verbes en Newsreader ;
   - l'œuvre dans .cimaise de #soutenir : 340 px de large au plus sur ordinateur, image entière (naturalWidth ≥ 2 × largeur affichée), jamais d'object-fit ; cartel « Ines Reddah, 2024 » ;
   - bas de la cimaise → haut du pied de page : 72 px (44 à 390) ;
   - « Écrivez-nous » → #contact ; Créahmbxl en target _blank avec rel noopener ; « Engagements » actif dans la navigation ; sur les quatre pages, les liens « Engagements » pointent vers engagements.html.
   Mettre à jour le README de src.

Un seul commit : « Engagements : registre et œuvre sur cimaise (26/09) ».
```
