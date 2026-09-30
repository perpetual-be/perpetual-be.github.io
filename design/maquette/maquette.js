/* Perpetual — maquette du lot 2 : le panneau de bascules, l'état dans l'URL, l'aperçu de la liste des projets (Home), sur les fiches la mosaïque des
   photos (P6, 26/09), et sur la vue Réalisations la rangée des agences en boucle, les photos de chaque bien et la visionneuse (revue du 26/09, repris de
   la proposition P2) — la même visionneuse s'ouvre sur les photos de la mosaïque d'une fiche.
   L'état (une valeur par bascule) vit dans la query de l'URL (?papier=tout&bas=anciens) ; le hash reste aux ancres.
   Un script en tête de page pose déjà les attributs data-* avant le premier rendu ; ici on dessine le panneau et on tient l'URL à jour. */
(function () {
  'use strict';
  var html = document.documentElement;
  var PAGE = html.getAttribute('data-page') || 'home';

  // La table des bascules : numéro du brief, clé (= attribut data-<clé> et paramètre d'URL), valeurs [valeur, libellé] ; la première valeur est le défaut.
  // Figées le 22/09, valeur écrite dans :root de maquette.css et retirées d'ici : 1 liens du header (droite), 4 sans (Instrument Sans),
  // 5 wordmark (Jost 400, 0,18 em), 6 Φ (bronze), 7 dosage de l'or et 8 surface de la bande (remplacées par le dosage fixe), 11 section projets (liste des 4),
  // 12 roue et 13 anneau (abandonnées), 19 étiquettes des chiffres (gris chaud), 16a position de la signature (malentendu, retiré) ;
  // 15b villes et 15c contour de la carte pleine sont retirés (villes figées sur « toutes », 15c absorbé par 15a) ; 14 logos partenaires (couleur).
  // Figées le 23/09 : 9 premier écran (structure F), 9b photo (Community 05), 9d accroche (gauche), 10 élément de la bande (anneaux), 16 signature (or),
  // 18 fond du pied de page (papier, sans filet), 15 réalisations (carte) ; 3 portée de la serif retirée (classes .h2--sans / .h2--serif).
  // Gel de la Home (23/09) : 2 serif (Newsreader) et 17 graisse (400) figées ; 9c réduite à centre / haut (« bas » retiré).
  // Home entièrement figée le 26/09 : 9c cadrage sur « haut » (50% 20%, le point focal de community-05 dans photoCandidates, build.mjs) et 15a carte
  // sur « sable » ; plus aucune bascule sur la Home. La 20 (fiche, titres de chapitre) est figée sur « sans »
  // (revue de la fiche, 23/09). Vue Réalisations (revue du 26/09, la proposition P2 remplace les cartes et la bascule 21) : 22 fond papier du programme
  // agences et 23 bas de page, la V1 en défaut, la V2 en réserve. Page Engagements (26/09) : aucune bascule, 22 et 23 y sont grisées.
  // Lot 2b (30/09, retours de Julien) : 13 graphique reprise, temporaire — barres / trois variantes en anneau qui se remplissent (A, B, C), le temps du choix d'Axel.
  var BASCULES = [
    { n: '13', cle: 'graphique', titre: 'Graphique 11 150 m²', groupe: 'Home', valeurs: [['barres', 'barres'], ['anneau', 'A · un anneau, trois parts'], ['anneaux', 'B · un anneau par usage'], ['sobre', 'C · anneau sobre, étiquettes']], note: 'lot 2b, item 1 : cercle qui se remplit à l’arrivée à l’écran (rejoué au changement)', pages: ['home'] },
    { n: '22', cle: 'papier', titre: 'Programme agences, fond papier', groupe: 'Réalisations', valeurs: [['enonce', 'énoncé seul'], ['tout', 'toute la section']], note: 'toute la section : puis 32 px de blanc avant le pied de page', pages: ['realisations'] },
    { n: '23', cle: 'bas', titre: 'Bas de page', groupe: 'Réalisations', valeurs: [['rien', 'rien'], ['anciens', 'anciens projets']], note: 'en réserve : les projets de l’ancien site, à confirmer avec Julien', pages: ['realisations'] }
  ];
  var defauts = {};
  BASCULES.forEach(function (b) { defauts[b.cle] = b.valeurs[0][0]; });

  // ---- état ----
  function lire() {
    var p = new URLSearchParams(location.search), etat = {};
    BASCULES.forEach(function (b) {
      var v = p.get(b.cle);
      etat[b.cle] = (v && b.valeurs.some(function (x) { return x[0] === v; })) ? v : defauts[b.cle];
    });
    return etat;
  }
  function actif(b, etat) { return !b.parent || b.parent.vals.indexOf(etat[b.parent.cle]) !== -1; }
  function query(etat, tout) {
    var p = new URLSearchParams();
    BASCULES.forEach(function (b) {
      if (!actif(b, etat)) return;
      if (tout || etat[b.cle] !== defauts[b.cle]) p.set(b.cle, etat[b.cle]);
    });
    return p.toString();
  }
  function presentation() { return html.getAttribute('data-panneau') === 'off'; }
  function appliquer(etat) {
    BASCULES.forEach(function (b) {
      if (etat[b.cle] !== defauts[b.cle] && actif(b, etat)) html.setAttribute('data-' + b.cle, etat[b.cle]);
      else html.removeAttribute('data-' + b.cle);
    });
    var q = query(etat, false);
    // les liens internes portent l'état : la combinaison suit d'une page à l'autre
    Array.prototype.forEach.call(document.querySelectorAll('a[href]'), function (a) {
      var m = a.getAttribute('href').match(/^([a-z0-9-]+\.html)(\?[^#]*)?(#.*)?$/i);
      if (m) a.setAttribute('href', m[1] + (q ? '?' + q : '') + (m[3] || ''));
    });
    var qs = q + (presentation() ? (q ? '&' : '') + 'panneau=off' : '');
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
  }

  // ---- panneau ----
  var CSS = '.mq{position:fixed;right:16px;bottom:16px;z-index:1000;width:324px;max-height:min(80vh,calc(100vh - 32px));display:flex;flex-direction:column;background:#fff;color:#26231F;border:1px solid #26231F;font:12px/1.45 system-ui,sans-serif}' +
    'html[data-panneau="off"] .mq{display:none}' +
    'body.visio-ouverte .mq{display:none}' +   // le panneau s'efface devant la visionneuse (vue Réalisations) : il recouvrait sa flèche droite et son compteur
    '.mq__tete{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;border-bottom:1px solid #E6E1D6}' +
    '.mq__plier{font:600 12px/1.4 system-ui,sans-serif;background:none;border:0;cursor:pointer;color:inherit;padding:0;text-align:left}' +
    '.mq__compte{font-weight:400;color:#6B655C}' +
    '.mq__pages{display:flex;gap:10px;color:#6B655C}.mq__pages a{color:inherit;text-decoration:none;border-bottom:1px solid transparent}.mq__pages a.is-active{color:#26231F;border-bottom-color:#9A7A3B}' +
    '.mq__corps{overflow:auto;padding:0 12px 8px}' +
    '.mq.is-plie .mq__corps,.mq.is-plie .mq__pied{display:none}' +
    '.mq__gtitre{font-weight:600;margin:12px 0 2px;color:#6B655C;text-transform:uppercase;letter-spacing:.06em;font-size:10px}' +
    '.mq__b{border:0;padding:6px 0 4px;border-top:1px solid #F0EDE6;min-width:0}' +
    '.mq__b legend{font-weight:600;padding:0}' +
    '.mq__n{display:inline-block;min-width:20px;color:#9A7A3B;font-weight:600}' +
    '.mq__vals{display:flex;flex-wrap:wrap;gap:1px 12px;margin-top:2px}' +
    '.mq__vals label{display:inline-flex;align-items:center;gap:5px;cursor:pointer}' +
    '.mq__vals input{margin:0;accent-color:#9A7A3B}' +
    '.mq__defaut{font-style:normal;color:#9A948A;margin-left:4px;font-size:10px}' +
    '.mq__b[hidden]{display:none}' +
    '.mq__b.is-inactif{opacity:.45}' +
    '.mq__note{color:#6B655C;margin-top:2px}' +
    '.mq__pied{padding:8px 12px 10px;border-top:1px solid #E6E1D6;display:flex;flex-wrap:wrap;gap:6px}' +
    '.mq__pied button{font:12px/1.4 system-ui,sans-serif;background:#fff;color:#26231F;border:1px solid #26231F;padding:4px 8px;cursor:pointer}' +
    '.mq__pied button:disabled{opacity:.4;cursor:default}' +
    '.mq__url{width:100%;font:11px/1.4 ui-monospace,Menlo,Consolas,monospace;color:#6B655C;word-break:break-all;margin-top:4px;min-height:1.4em}' +
    '@media (max-width:640px){.mq{right:8px;bottom:8px;width:calc(100% - 16px)}}';

  function fieldset(b) {
    var vals = b.valeurs.map(function (v, i) {
      var id = 'mq-' + b.cle + '-' + v[0];
      return '<label for="' + id + '"><input type="radio" id="' + id + '" name="mq-' + b.cle + '" value="' + v[0] + '"><span>' + v[1] + (i === 0 ? '<i class="mq__defaut">défaut</i>' : '') + '</span></label>';
    }).join('');
    return '<fieldset class="mq__b" data-cle="' + b.cle + '"><legend><span class="mq__n">' + b.n + '</span>' + b.titre + '</legend><div class="mq__vals">' + vals + '</div>' + (b.note ? '<p class="mq__note">' + b.note + '</p>' : '') + '<p class="mq__note mq__note--inactif" hidden></p></fieldset>';
  }
  var groupes = [];
  BASCULES.forEach(function (b) { if (groupes.indexOf(b.groupe) === -1) groupes.push(b.groupe); });
  var corps = groupes.map(function (g) {
    return '<div class="mq__groupe"><div class="mq__gtitre">' + g + '</div>' + BASCULES.filter(function (b) { return b.groupe === g; }).map(fieldset).join('') + '</div>';
  }).join('');
  var pagesHtml = [['index.html', 'home', 'Home'], ['projet-the-bank.html', 'fiche', 'Fiche'], ['realisations.html', 'realisations', 'Réalisations'], ['engagements.html', 'engagements', 'Engagements']].map(function (p) {
    return '<a href="' + p[0] + '"' + (p[1] === PAGE ? ' class="is-active"' : '') + '>' + p[2] + '</a>';
  }).join('');

  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  var panneau = document.createElement('aside');
  panneau.className = 'mq';
  panneau.setAttribute('aria-label', 'Bascules de la maquette');
  panneau.innerHTML = '<div class="mq__tete"><button type="button" class="mq__plier" aria-expanded="true">Bascules <span class="mq__compte"></span></button><nav class="mq__pages">' + pagesHtml + '</nav></div>' +
    '<div class="mq__corps">' + corps + '</div>' +
    '<div class="mq__pied"><button type="button" data-action="copier">Copier la combinaison</button><button type="button" data-action="precedente" disabled>⇄ précédente</button><button type="button" data-action="presentation">Présentation</button><button type="button" data-action="reset">Réinitialiser</button><p class="mq__url"></p></div>';
  document.body.appendChild(panneau);

  var etat = lire(), precedent = null;

  function majPanneau() {
    var n = 0;
    BASCULES.forEach(function (b) {
      var fs = panneau.querySelector('.mq__b[data-cle="' + b.cle + '"]');
      var input = fs.querySelector('input[value="' + etat[b.cle] + '"]');
      if (input) input.checked = true;
      fs.hidden = !actif(b, etat);
      var inactif = (b.inactif && b.inactif.vals.indexOf(etat[b.inactif.cle]) !== -1) || (b.pages && b.pages.indexOf(PAGE) === -1);
      fs.classList.toggle('is-inactif', !!inactif);
      var note = fs.querySelector('.mq__note--inactif');
      note.hidden = !inactif;
      note.textContent = inactif ? (b.pages && b.pages.indexOf(PAGE) === -1 ? 'sans effet sur cette page' : b.inactif.note) : '';
      if (actif(b, etat) && etat[b.cle] !== defauts[b.cle]) n++;
    });
    panneau.querySelector('.mq__compte').textContent = n ? '· ' + n + ' ≠ défaut' : '· combinaison retenue';
    var q = query(etat, false);
    panneau.querySelector('.mq__url').textContent = q ? '?' + q : 'valeurs par défaut';
    panneau.querySelector('[data-action="precedente"]').disabled = !precedent;
    Array.prototype.forEach.call(panneau.querySelectorAll('.mq__pages a'), function (a) {
      a.setAttribute('href', a.getAttribute('href').replace(/\?.*$/, '') + (q ? '?' + q : ''));
    });
  }
  function changer(nouveau) {
    precedent = etat;
    etat = nouveau;
    appliquer(etat);
    majPanneau();
  }

  panneau.addEventListener('change', function (e) {
    var input = e.target;
    if (input.type !== 'radio') return;
    var cle = input.name.replace(/^mq-/, ''), nouveau = {};
    for (var k in etat) nouveau[k] = etat[k];
    nouveau[cle] = input.value;
    changer(nouveau);
  });
  panneau.addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    if (btn.classList.contains('mq__plier')) {
      var plie = panneau.classList.toggle('is-plie');
      btn.setAttribute('aria-expanded', String(!plie));
      try { localStorage.setItem('mq-plie', plie ? '1' : '0'); } catch (err) {}
      return;
    }
    var action = btn.getAttribute('data-action');
    if (action === 'copier') {
      var url = location.protocol + '//' + location.host + location.pathname + '?' + query(etat, true);
      var fait = function () { btn.textContent = 'Copiée'; setTimeout(function () { btn.textContent = 'Copier la combinaison'; }, 1500); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(fait, function () { window.prompt('Copier la combinaison :', url); });
      else window.prompt('Copier la combinaison :', url);
    } else if (action === 'precedente') {
      if (precedent) changer(precedent);
    } else if (action === 'presentation') {
      html.setAttribute('data-panneau', 'off');
      appliquer(etat);
    } else if (action === 'reset') {
      var d = {};
      for (var k in defauts) d[k] = defauts[k];
      changer(d);
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (document.querySelector('.visio:not([hidden])')) return;   // Échap ferme la visionneuse (vue Réalisations), sans toucher au panneau
    if (presentation()) { html.removeAttribute('data-panneau'); appliquer(etat); }
    else panneau.querySelector('.mq__plier').click();
  });
  window.addEventListener('popstate', function () { etat = lire(); appliquer(etat); majPanneau(); });

  try { if (localStorage.getItem('mq-plie') === '1') { panneau.classList.add('is-plie'); panneau.querySelector('.mq__plier').setAttribute('aria-expanded', 'false'); } } catch (err) {}
  appliquer(etat);
  majPanneau();

  // ---- aperçu de la liste des quatre projets : la photo suit la ligne survolée ----
  Array.prototype.forEach.call(document.querySelectorAll('.four'), function (block) {
    var rows = block.querySelectorAll('.four__row'), imgs = block.querySelectorAll('.four__preview img');
    Array.prototype.forEach.call(rows, function (row, i) {
      row.addEventListener('mouseenter', function () {
        Array.prototype.forEach.call(rows, function (r) { r.classList.remove('is-active'); });
        Array.prototype.forEach.call(imgs, function (im) { im.classList.remove('is-active'); });
        row.classList.add('is-active');
        if (imgs[i]) imgs[i].classList.add('is-active');
      });
    });
  });
})();

// ---- fiches (P6, 26/09) : la mosaïque des photos, script de la référence (design/revue-fiche/propositions/p6.html) ----
// Rangées justifiées au format de chaque photo (data-r : son ratio), construites chacune comme un bloc (.fiche__rang : plus de retour à la ligne possible),
// la largeur mesurée au sous-pixel moins 0,5 px, les largeurs arrondies vers le bas. Hauteurs cibles alternées 440 / 280 px, multipliées par
// max(1, largeur de la mosaïque / 1 120) sur la grille large : le même nombre de photos par rangée qu'à 1 200 px. Au téléphone, 210 / 150 px et deux photos
// au plus par rangée. Dernière rangée incomplète : pas d'agrandissement au-delà de 1,25 × la cible sur ordinateur (elle garde alors la cible), jusqu'à
// 2 × au téléphone. Chaque <img> reçoit un sizes égal à la largeur de sa tuile. Recalcul quand la largeur de la mosaïque change (fenêtre, barre de
// défilement), jamais sur la hauteur seule. Le clic sur une tuile ouvre la visionneuse (plus bas).
(function () {
  var m = document.querySelector('.fiche__mosaique');
  if (!m) return;
  var tuiles = Array.prototype.slice.call(m.querySelectorAll('.fiche__tuile'));
  function placer() {
    m.classList.remove('est-placee');
    tuiles.forEach(function (t) { m.appendChild(t); });
    Array.prototype.forEach.call(m.querySelectorAll('.fiche__rang'), function (r) { r.remove(); });
    var W = m.getBoundingClientRect().width - 0.5, g = parseFloat(getComputedStyle(m).columnGap) || 16, petit = innerWidth < 641, maxN = petit ? 2 : 99;
    var f = petit ? 1 : Math.max(1, W / 1120), hauts = petit ? [210, 150] : [440 * f, 280 * f];
    var i = 0, rang = 0;
    while (i < tuiles.length) {
      var cible = hauts[rang % 2], somme = 0, j = i;
      while (j < tuiles.length && j - i < maxN) { somme += +tuiles[j].getAttribute('data-r'); j++; if (somme * cible + (j - i - 1) * g >= W) break; }
      var n = j - i, h = (W - (n - 1) * g) / somme;
      if (j >= tuiles.length && n < maxN) { if (petit) h = Math.min(h, cible * 2); else if (h > cible * 1.25) h = cible; }
      var r = document.createElement('div');
      r.className = 'fiche__rang';
      for (var k = i; k < j; k++) {
        var t = tuiles[k], w = Math.floor(+t.getAttribute('data-r') * h * 100) / 100, img = t.querySelector('img');
        t.style.width = w + 'px'; t.style.height = h + 'px'; img.style.height = h + 'px'; img.sizes = w + 'px';
        r.appendChild(t);
      }
      m.appendChild(r); i = j; rang++;
    }
    m.classList.add('est-placee');
  }
  placer();
  var largeur = m.getBoundingClientRect().width, attente;
  new ResizeObserver(function () {
    var l = m.getBoundingClientRect().width;
    if (l === largeur) return;
    largeur = l; clearTimeout(attente); attente = setTimeout(placer, 80);
  }).observe(m);
})();

// ---- vue Réalisations : la rangée des agences, les photos de chaque bien, la visionneuse (repris de la proposition P2, revue du 26/09) ----
// Seul ajout depuis, la P6 (26/09) : la visionneuse reçoit un album (ses photos, et la ville, la surface et l'usage d'un bien) et s'ouvre aussi sur la
// mosaïque d'une fiche — le compteur seul, pas de légende (section 4).
(function(){
  if (!document.querySelector('.visio')) return;
  var BIENS = window.BIENS, doux = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  function cloner(el){
    var c = el.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.setAttribute('data-clone', '');
    c.querySelectorAll('a,button,[tabindex]').forEach(function(x){ x.setAttribute('tabindex', '-1') });
    return c;
  }
  // Piste en boucle : un jeu de clones avant et après les éléments ; on défile toujours dans le même sens,
  // et en fin de défilement la piste est recentrée sans animation sur le jeu du milieu (invisible à l'œil).
  function Boucle(piste, onmaj){
    var self = this, items = Array.prototype.slice.call(piste.children), n = items.length, cible = null, depuis = 0, t;
    self.n = n; self.courant = 0;
    if (n > 1) {
      var avant = document.createDocumentFragment(), apres = document.createDocumentFragment();
      items.forEach(function(it){ avant.appendChild(cloner(it)); apres.appendChild(cloner(it)) });
      piste.insertBefore(avant, piste.firstChild); piste.appendChild(apres);
    }
    function pas(){ var c = piste.children; return c.length > 1 ? c[1].getBoundingClientRect().left - c[0].getBoundingClientRect().left : piste.clientWidth }   // fractionnaire : les vignettes font 342,25 px
    function indice(){ return Math.round(piste.scrollLeft / pas()) }
    function reel(i){ return ((i % n) + n) % n }
    function placer(i){ piste.scrollLeft = i * pas() }
    function maj(i){ self.courant = reel(i); onmaj(self.courant) }
    function recentrer(){
      if (n < 2) return;
      // un défilement demandé est encore en route (clics rapprochés) : on attend qu'il arrive, au plus 1,2 s
      if (cible != null && Math.abs(piste.scrollLeft - cible * pas()) > 3) {
        var reste = 1200 - (Date.now() - depuis);
        if (reste > 0) { clearTimeout(t); t = setTimeout(recentrer, reste); return }
      }
      var i = indice();
      if (i < n) placer(i + n); else if (i >= 2 * n) placer(i - n);
      cible = null; maj(indice());
    }
    self.aller = function(delta){
      if (n < 2) return;
      var base = cible != null ? cible : indice();
      if (base < n || base >= 2 * n) { var d = base < n ? n : -n; placer(indice() + d); base += d }
      cible = base + delta; depuis = Date.now(); maj(cible);
      piste.scrollTo({ left: cible * pas(), behavior: doux ? 'smooth' : 'auto' });
      if (!doux) recentrer();
    };
    self.montrer = function(i){ if (n > 1) placer(n + i); maj(i) };
    piste.addEventListener('scroll', function(){ clearTimeout(t); t = setTimeout(recentrer, 150) }, { passive: true });
    if ('onscrollend' in window) piste.addEventListener('scrollend', function(){ clearTimeout(t); recentrer() });
    window.addEventListener('resize', function(){ if (n > 1) placer(n + self.courant) });
    self.montrer(0);
  }

  // 1. la rangée des agences (à construire avant les photos : ses clones copient les vignettes telles quelles)
  var rangee = document.querySelector('.defil__piste'), cpt = document.querySelector('.defil__compteur'), rb;
  function parVue(){ var c = rangee.children, p = c.length > 1 ? c[1].offsetLeft - c[0].offsetLeft : rangee.clientWidth; return Math.max(1, Math.round((rangee.clientWidth + 24) / p)) }
  if (rangee) {
    rb = new Boucle(rangee, function(i){
      var k = parVue(), n = rb ? rb.n : rangee.children.length, fin = ((i + k - 1) % n) + 1;
      cpt.textContent = (k > 1 ? (i + 1) + '–' + fin : (i + 1)) + ' / ' + n;
    });
    rb.montrer(0);
    document.querySelector('[data-d-prec]').addEventListener('click', function(e){ e.preventDefault(); rb.aller(-parVue()) });
    document.querySelector('[data-d-suiv]').addEventListener('click', function(e){ e.preventDefault(); rb.aller(parVue()) });
    rangee.addEventListener('keydown', function(e){ if (e.target !== rangee) return;
      if (e.key === 'ArrowRight'){ e.preventDefault(); rb.aller(parVue()) } if (e.key === 'ArrowLeft'){ e.preventDefault(); rb.aller(-parVue()) } });
  }

  // 2. les photos de chaque bien (originaux et clones de la rangée)
  document.querySelectorAll('.bien').forEach(function(b){
    var cptb = b.querySelector('.bien__compteur'), n = +b.getAttribute('data-n');
    var bb = new Boucle(b.querySelector('.bien__piste'), function(i){ cptb.textContent = (i + 1) + ' / ' + n });
    b.querySelector('.bien__fleche--g').addEventListener('click', function(e){ e.stopPropagation(); bb.aller(-1) });
    b.querySelector('.bien__fleche--d').addEventListener('click', function(e){ e.stopPropagation(); bb.aller(1) });
    b.querySelector('.bien__piste').addEventListener('click', function(){ ouvrir(BIENS[+b.getAttribute('data-bien')], bb.courant) });
  });

  // 3. la visionneuse, sur un album : ses photos (l) et, pour un bien, la ville, la surface et l'usage (la légende) ; sans ville, le compteur seul
  var v = document.querySelector('.visio'), vl = v.querySelector('.visio__legende'), vc = v.querySelector('.visio__compteur'),
      vg = v.querySelector('[data-v-prec]'), vd = v.querySelector('[data-v-suiv]'), vb = null, retour = null;
  function ouvrir(b, depart){
    var n = b.l.length, ancienne = v.querySelector('.visio__piste'), vp = ancienne.cloneNode(false);
    ancienne.replaceWith(vp); retour = document.activeElement;
    vp.innerHTML = b.l.map(function(s){ return '<img src="' + s + '" alt="" decoding="async">' }).join('');
    vl.innerHTML = b.ville ? '<b>' + b.ville + '</b>' + b.surface + ' · ' + b.usage : '';
    vg.hidden = vd.hidden = n < 2;
    v.hidden = false; document.body.classList.add('visio-ouverte');
    vb = new Boucle(vp, function(i){ vc.textContent = n > 1 ? (i + 1) + ' / ' + n : '' });
    vb.montrer(depart || 0);
    v.querySelector('[data-fermer]').focus();
  }
  function fermer(){ v.hidden = true; document.body.classList.remove('visio-ouverte'); if (retour) retour.focus() }
  document.querySelectorAll('[data-ouvrir]').forEach(function(el){ el.addEventListener('click', function(){ ouvrir(BIENS[+el.getAttribute('data-ouvrir')], 0) }) });
  // 4. les fiches (P6, 26/09) : chaque tuile de la mosaïque ouvre la visionneuse sur sa photo (<clé>.jpg, data-grande), le compteur seul (« 3 / 10 »)
  var tuiles = document.querySelectorAll('.fiche__agrandir');
  if (tuiles.length) {
    var album = { l: Array.prototype.map.call(tuiles, function(t){ return t.getAttribute('data-grande') }) };
    tuiles.forEach(function(t, i){ t.addEventListener('click', function(){ ouvrir(album, i) }) });
  }
  vg.addEventListener('click', function(){ vb.aller(-1) });
  vd.addEventListener('click', function(){ vb.aller(1) });
  v.querySelector('[data-fermer]').addEventListener('click', fermer);
  v.addEventListener('click', function(e){ if (e.target === v) fermer() });
  document.addEventListener('keydown', function(e){
    if (v.hidden) return;
    if (e.key === 'Escape') fermer();
    if (e.key === 'ArrowRight') vb.aller(1);
    if (e.key === 'ArrowLeft') vb.aller(-1);
  });
})();

// La visionneuse est modale (aria-modal) : tant qu'elle est ouverte, Tab et Maj+Tab restent dans ses commandes visibles — la page, sous le fond blanc,
// n'est plus atteignable au clavier. Ajout à la proposition P2, dont le script ci-dessus ne change, depuis, que pour recevoir un album (P6). Vaut aussi sur les fiches.
(function () {
  var v = document.querySelector('.visio');
  if (!v) return;
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || v.hidden) return;
    var f = Array.prototype.filter.call(v.querySelectorAll('button, [tabindex="0"]'), function (el) { return !el.hidden && el.getClientRects().length; });
    if (!f.length) return;
    var i = f.indexOf(document.activeElement);
    e.preventDefault();
    f[e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i === -1 || i === f.length - 1 ? 0 : i + 1)].focus();
  });
})();

// ---- Home, graphique 11 150 m² en anneau (lot 2b, item 1 ; bascule 13) : les anneaux se remplissent une fois, quand le graphique arrive à l'écran
// (à moitié visible), et de nouveau quand on change de variante dans le panneau. Sans IntersectionObserver ou avec « réduire les animations » :
// rien, les anneaux restent pleins (le CSS ne les vide que sous .a-remplir). ----
(function () {
  var graphs = document.querySelectorAll('.graph'), section = document.querySelector('.section--chart');
  if (!graphs.length || !section || !('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var vu = false;
  function vider() { Array.prototype.forEach.call(graphs, function (g) { g.classList.remove('est-rempli'); g.classList.add('a-remplir'); }); }
  function jouer() {
    vider();
    void section.offsetWidth;   // l'état vide est appliqué avant la transition
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      Array.prototype.forEach.call(graphs, function (g) { g.classList.add('est-rempli'); });
    }); });
  }
  vider();
  var io = new IntersectionObserver(function (entrees) {
    if (vu || !entrees.some(function (e) { return e.isIntersecting; })) return;
    vu = true; io.disconnect(); jouer();
  }, { threshold: 0.5 });
  io.observe(section);
  new MutationObserver(function () { if (vu) jouer(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-graphique'] });
})();
