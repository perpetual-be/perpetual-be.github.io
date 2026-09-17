# design/directions/src — générateurs des planches (lot 2)

- `build-directions.mjs` → `../direction-a.html`, `../direction-b.html` (planches de direction A et B). Lit `data/*.json`, `public/favicon.svg`, `public/partners/encre/*.svg` à la racine du dépôt.
- `build-planches.mjs` → `../planche-typo.html`, `../planche-bande.html` (typo short-list, éléments de la bande).
- `render.mjs` → les PNG à côté des HTML (optionnel, Playwright).
- `wordmark-mask.png` → le tracé du nom PERPETUAL (masque alpha, 782 × 96), embarqué en data URI par les scripts.

Exécuter depuis la racine du dépôt : `node design/directions/src/build-directions.mjs`. Aucune dépendance hors Node (Playwright seulement pour `render.mjs`). Les polices sont dans `../fonts/`, les photos réduites dans `../img/`.

La maquette du lot 2 (`design/maquette/`) part de ces fichiers : voir `design/maquette/BRIEF.md`.
