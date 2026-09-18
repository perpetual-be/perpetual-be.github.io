# design/maquette/src — outils de la maquette (lot 2)

Exécuter depuis la racine du dépôt.

- `build.mjs` → génère les pages de `design/maquette/` (`index.html`, puis la fiche et la vue Projets) à partir de `data/*.json`, `content/*.md`, `public/favicon.svg`, `public/partners/encre/*.svg` et du masque du wordmark. Aucune dépendance hors Node : `node design/maquette/src/build.mjs`.
- `check.mjs` → vérifications automatiques (premier écran à 1440 × 900 et 1366 × 703, débordement horizontal, effet de chaque bascule, mouvement réduit, mode présentation, page sans JavaScript, polices, contrastes).
- `export.mjs` → captures PNG, panneau masqué, roue immobile ; par défaut les pages présentes en 1440 pleine page et 390, échelle 2, dans `design/maquette/export/`. Options : `--etat "serif=literata&or=touches"`, `--pages`, `--formats 1440,1366,390`, `--out`, `--echelle`, `--ecran`.

`check.mjs` et `export.mjs` demandent Playwright : `npm install -D playwright` à la racine (puis `npx playwright install chromium`), ou une installation globale avec `NODE_PATH=$(npm root -g) node design/maquette/src/export.mjs`.

Les pages s'ouvrent directement dans le navigateur (`file://`). L'état des bascules est dans la query de l'URL (`index.html?serif=literata&or=touches`), le hash reste aux ancres ; `?panneau=off` masque le panneau, Échap le rappelle. `maquette.css` porte les jetons et les composants, puis une région « bascules » en fin de fichier ; `maquette.js` ne contient que le panneau, la lecture et l'écriture de l'état, et l'aperçu de la liste des projets.
