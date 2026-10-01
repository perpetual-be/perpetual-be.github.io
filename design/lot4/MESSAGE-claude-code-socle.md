Lot 4, message 1/2 : le socle du site (Cowork, 01/10/2026). Le message 2/2 (la Home) viendra après la relecture de celui-ci.

À lire d'abord : README.md (section Photos, à jour du 01/10), design/maquette/src/README.md, design/maquette/maquette.css et design/maquette/src/build.mjs (fonctions head, header, footer). **La maquette est la référence et reste intacte** : ne rien modifier sous design/ (lecture seule), ni dans content/ (les textes sont un autre chantier). Pas de framework CSS, pas de nouvelle dépendance dans package.json.

But : le site Astro reçoit le système de la maquette — polices, jetons, base, en-tête, pied de page — et une mise en page commune à toutes les pages. Aucune section de page ici (la Home viendra au message 2). Critère de fin : **en-tête et pied de page du site identiques au pixel près à ceux de la maquette**, à 1521 × 705, 1920 × 1080 et 390 × 844.

Déjà fait par Cowork, à garder tel quel : src/lib/photos.ts, src/components/ProjectPhoto.astro, src/pages/dev/photos.astro (photos), `cacheDir: './.astro-cache'` dans astro.config.mjs, .gitignore.

1. Polices. Copier design/maquette/fonts/*.woff2 dans public/fonts/ (la maquette garde les siennes). Mêmes @font-face que la section 1 de maquette.css, url(/fonts/…), avec font-display: swap. Précharger (link rel=preload, crossorigin) Instrument Sans, Newsreader normal et Jost. Aucune requête vers un tiers (la politique de confidentialité l'exclut) : pas de Google Fonts.

2. Styles, dans src/styles/, importés par la mise en page dans cet ordre — polices.css, jetons.css, base.css, entete.css, pied.css — en **reprenant les règles de maquette.css telles quelles** (mêmes noms de classes, mêmes valeurs ; les pages des messages suivants s'y brancheront de la même façon) :
   - jetons.css : tout le :root de la section 2 (palette, rôles, typographie, mise en page, --c-part-*, --remplissage…), avec les surcharges de jetons des @media (max-width:640px) et (max-height:720px) and (min-width:641px). C'est le système de styles du site : la couche de rôles, que les composants lisent.
   - base.css : la section 3 (reset, html, body, a, img, listes, .container, .large, .eyebrow, .h2, .h2--sans, .h2--serif, .section, .section+.section, .trait et son survol), plus .trait::after sans transition sous prefers-reduced-motion.
   - entete.css et pied.css : .site-header, .logo, .logo__mark, .logo__texte, .site-nav ; .site-footer, .footer__* ; et leurs règles téléphone (section 5).
   - Ne rien reprendre de ce qui n'existe que pour la maquette : les bascules (html[data-…]), le panneau (maquette.js), le script d'état.
   - src/styles/global.css (valeurs neutres du lot 0) disparaît. src/pages/index.astro et src/pages/dev/photos.astro utilisent .wrap, --measure, --color-muted : les passer sur .container et les jetons de la maquette (--c-meta…), sans autre changement de contenu.

3. data/site.json, source unique de l'en-tête et du pied de page :
   - nav (en-tête) : Réalisations → /realisations, Engagements → /engagements, Contact → #contact (le bloc contact du pied de page, sur toutes les pages). Retirer Home, Collectif → /collectif et Contact → /contact. **Garder l'entrée /realisations** : build.mjs et check.mjs de la maquette y lisent le libellé « Réalisations ».
   - ajouter le plan du pied de page : Réalisations → /realisations, Collectif → /#collectif, Engagements → /engagements, Mentions légales → /mentions-legales, Confidentialité → /confidentialite (ces pages arrivent aux lots 5 et 6 : liens vides en attendant, c'est accepté).
   - ajouter le nom du contact, « Julien De Dobbeleer » (écrit en dur dans footer() de build.mjs).
   - ajouter un réglage d'indexation, faux jusqu'à la mise en ligne (lot 9) — voir 5.

4. Composants : src/components/SiteHeader.astro et SiteFooter.astro, mêmes balises et classes que header() et footer() de build.mjs.
   - En-tête : le logo (lien vers /, aria-label « Perpetual — accueil ») = le Φ en SVG inline, tiré de public/favicon.svg comme le fait build.mjs (markPath ; fill currentColor, couleur --c-phi), puis « Perpetual » en texte (.logo__texte, Jost en capitales par le CSS) ; la navigation depuis site.json. Page active : prop de la mise en page ; trait sous le lien actif (.is-active), et aria-current="page" sur la page elle-même (Réalisations sera active aussi sur les fiches).
   - **En-tête collant** (décision d'Axel du 19/09, absent de la maquette) : il disparaît quand on fait défiler vers le bas et revient dès qu'on remonte, sans flèche « retour en haut ». Un conteneur pleine largeur, position: sticky; top: 0, fond blanc, au-dessus du contenu ; .site-header dedans, inchangé (1 600 px au plus, centré). Toujours visible en haut de page (tant que le défilement est inférieur à sa hauteur). Seuil de quelques pixels pour ne pas trembler. Transition transform d'environ 0,3 s, coupée sous prefers-reduced-motion (il se cache et revient alors sans glisser). Il revient aussi quand le focus clavier entre dedans. Aucun filet ni ombre (garde-fous de la maquette : ni ombre, ni arrondi) — Axel jugera à la relecture. Un petit script en ligne dans le composant, sans dépendance.
   - Pied de page : id="contact" ; le nom, le mail (site.email, lien mailto), « Perpetual, 1030 Bruxelles » (site.name, site.city) ; le plan ; la citation (site.quote, guillemets français et espaces insécables comme build.mjs) ; « © <année du build> Perpetual ».

5. Mise en page src/layouts/Base.astro (remplace l'actuelle) : <html lang="fr">, charset, viewport, <title> (« <titre> — Perpetual », ou le titre complet passé par la page), meta description, favicon, préchargement des polices, styles (2), SiteHeader, <main> (slot), SiteFooter. **noindex sur toutes les pages** tant que le réglage d'indexation de site.json est faux (la prop noindex par page disparaît) ; public/robots.txt ne change pas. Au lot 9, passer ce seul réglage à vrai suffira (avec robots.txt).

6. Page d'accueil : src/pages/index.astro garde son contenu « bientôt » jusqu'au message 2, dans la nouvelle mise en page ; l'adresse affichée devient site.email (plus julien@ en dur).

7. Déploiement : le cache des photos produites par Astro d'un déploiement à l'autre (Cowork ne peut pas modifier .github/workflows/). Dans deploy.yml, entre « Checkout » et « Install, build, and upload » ; dans auto-merge.yml, entre « Setup Node » et « Vérifier que le site se construit » :

   ```yaml
         # Les photos déjà produites par Astro (.astro-cache, cf. astro.config.mjs) d'un déploiement à l'autre : seules les nouvelles sont refaites.
         - name: Cache des photos
           uses: actions/cache@v4
           with:
             path: .astro-cache
             key: astro-${{ hashFiles('design/directions/img/**', 'src/components/ProjectPhoto.astro', 'package-lock.json') }}
             restore-keys: astro-
   ```

   Si ton accès GitHub refuse les fichiers de .github/workflows/, le dire dans la PR et laisser ce point : Axel les modifiera à la main.

8. Vérification, scripts/comparer-maquette.mjs (Playwright comme design/maquette/src/check.mjs : NODE_PATH=$(npm root -g), Chromium de /opt/pw-browsers/chromium s'il existe ; aucune dépendance ajoutée ; sharp, déjà là, pour décoder les PNG). Après `npm run build`, servir dist/ (astro preview) et ouvrir aussi design/maquette/index.html?panneau=off en file://. À 1521 × 705, 1920 × 1080 et 390 × 844, polices chargées (document.fonts.ready), défilement à 0 :
   - .site-header et .site-footer : captures des deux côtés, **identiques au pixel près** ; sinon, le nombre de pixels différents et une image des écarts dans un dossier ignoré par Git.
   - mêmes positions : logo, liens de la navigation, colonnes du pied de page, mail, citation (getBoundingClientRect, au pixel).
   - en-tête collant : après un défilement vers le bas de 600 px il est hors de l'écran ; après une remontée de 100 px il est revenu, en haut de la fenêtre ; avec prefers-reduced-motion, pas de transition.
   - les polices viennent de /fonts/ (aucune requête hors du site) ; meta robots noindex sur / et /dev/photos ; aucune erreur dans la console.
   Ajouter `"comparer": "node scripts/comparer-maquette.mjs"` aux scripts de package.json. Le script doit afficher « Tout est identique » quand tout passe. Joindre sa sortie à la PR.

9. README.md : section Structure à jour (src/styles/*, src/components/SiteHeader.astro et SiteFooter.astro, réglage d'indexation dans data/site.json, scripts/comparer-maquette.mjs) ; une ligne « Où modifier quoi » pour la navigation et le pied de page (data/site.json).

Une seule pull request, un seul commit : « Socle du site : polices, styles de la maquette, en-tête collant, pied de page ». Ne pas commencer la Home.
