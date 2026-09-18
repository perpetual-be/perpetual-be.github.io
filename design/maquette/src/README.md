# design/maquette/src — outils de la maquette (lot 2)

Exécuter depuis la racine du dépôt.

- `build.mjs` → génère les pages de `design/maquette/` (`index.html`, puis la fiche et la vue Projets) à partir de `data/*.json`, `content/*.md`, `public/favicon.svg`, `public/partners/encre/*.svg`, `carte/belgique.svg` et du masque du wordmark. Aucune dépendance hors Node : `node design/maquette/src/build.mjs`.
- `carte/belgique.svg` → la carte de la section Réalisations (contour, 20 points, 17 étiquettes placées à la main ; `belgique.json` porte les coordonnées et le groupe « Bruxelles »). `build.mjs` l'inline en regroupant chaque étiquette avec son ou ses points (`<g class="carte__lieu">`) : le survol d'un point colore ou révèle l'étiquette en CSS seul. `data-rang="1"` sur une étiquette du SVG la garde visible en mode « quelques-unes » (bascule 15b) et sur mobile ; pour changer la sélection, ajouter ou retirer l'attribut dans le SVG, puis rebâtir.
- `check.mjs` → vérifications automatiques (premier écran à 1440 × 900 et 1366 × 703, débordement horizontal, effet de chaque bascule, Φ de l'en-tête, logos partenaires, photo 2800 px, carte et bande des réalisations, mode présentation, page sans JavaScript, polices, contrastes).
- `export.mjs` → captures PNG, panneau masqué ; par défaut les pages présentes en 1440 pleine page et 390, échelle 2, dans `design/maquette/export/`. Options : `--etat "serif=literata&or=touches"`, `--pages`, `--formats 1440,1366,390`, `--out`, `--echelle`, `--ecran`.

`check.mjs` et `export.mjs` demandent Playwright : `npm install -D playwright` à la racine (puis `npx playwright install chromium`), ou une installation globale avec `NODE_PATH=$(npm root -g) node design/maquette/src/export.mjs`.

Photos : la bande des réalisations lit `design/directions/img/<id>-01-s.jpg` (800 px) pour chaque entrée `agency` et `gallery` de `data/projects.json` ; les chiffres sur photo lisent `<nom>.jpg` (1800 px) et `<nom>-l.jpg` (2800 px), avec repli sur `<nom>-s.jpg` tant qu'ils manquent (`build.mjs` le signale). Les versions se génèrent depuis les originaux avec `design/directions/src/reduire-photos.mjs --petit | --grand | --tres-grand`.

Les pages s'ouvrent directement dans le navigateur (`file://`). L'état des bascules est dans la query de l'URL (`index.html?serif=literata&or=touches`), le hash reste aux ancres ; `?panneau=off` masque le panneau, Échap le rappelle. `maquette.css` porte les jetons et les composants, puis une région « bascules » en fin de fichier ; `maquette.js` ne contient que le panneau, la lecture et l'écriture de l'état, et l'aperçu de la liste des projets.
