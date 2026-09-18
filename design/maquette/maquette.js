/* Perpetual — maquette du lot 2 : le panneau de bascules, l'état dans l'URL, l'aperçu de la liste des projets.
   L'état (une valeur par bascule) vit dans la query de l'URL (?serif=literata&or=touches) ; le hash reste aux ancres.
   Un script en tête de page pose déjà les attributs data-* avant le premier rendu ; ici on dessine le panneau et on tient l'URL à jour. */
(function () {
  'use strict';
  var html = document.documentElement;
  var PAGE = html.getAttribute('data-page') || 'home';

  // La table des bascules : numéro du brief, clé (= attribut data-<clé> et paramètre d'URL), valeurs [valeur, libellé] ; la première valeur est le défaut.
  var BASCULES = [
    { n: 5, cle: 'wordmark', titre: 'Wordmark', groupe: 'En-tête', valeurs: [['trace', 'tracé actuel'], ['jost', 'Jost 400 · 0,18 em'], ['source-serif', 'Source Serif 4'], ['literata', 'Literata'], ['playfair', 'Playfair Display']] },
    { n: 6, cle: 'phi', titre: 'Couleur du Φ', groupe: 'En-tête', valeurs: [['bronze', 'bronze'], ['or', 'or mat']] },
    { n: 2, cle: 'serif', titre: 'Serif', groupe: 'Typographie', valeurs: [['newsreader', 'Newsreader'], ['source-serif', 'Source Serif 4'], ['literata', 'Literata'], ['playfair', 'Playfair Display']] },
    { n: 3, cle: 'portee', titre: 'Portée de la serif', groupe: 'Typographie', valeurs: [['partout', 'partout'], ['rationnee', 'rationnée']] },
    { n: 4, cle: 'sans', titre: 'Sans', groupe: 'Typographie', valeurs: [['inter', 'Inter'], ['instrument', 'Instrument Sans']] },
    { n: 7, cle: 'or', titre: 'Dosage de l’or', groupe: 'Or et bande', valeurs: [['partout', 'partout'], ['touches', 'touches']] },
    { n: 8, cle: 'bande', titre: 'Surface de la bande', groupe: 'Or et bande', valeurs: [['sable', 'sable'], ['papier', 'papier']], note: 'sous « touches », sable devient blanc' },
    { n: 10, cle: 'deco', titre: 'Élément de la bande', groupe: 'Or et bande', valeurs: [['0', 'rien'], ['arcs', '1a · deux arcs'], ['phi', '4 · Φ en filigrane'], ['anneaux', '6 · anneaux']], inactif: { cle: 'chiffres', vals: ['photo'], note: 'sans bande en mode « sur photo »' }, pages: ['home'] },
    { n: 9, cle: 'chiffres', titre: 'Chiffres clés', groupe: 'Chiffres', valeurs: [['colonnes', '4 colonnes'], ['liste', 'liste'], ['photo', 'sur photo']], pages: ['home'] },
    { n: '9a', cle: 'structure', titre: 'Structure', groupe: 'Chiffres', parent: { cle: 'chiffres', vals: ['photo'] }, valeurs: [['c', 'C’ : hero, puis la photo'], ['b', 'B : accroche, photo, paragraphes']], pages: ['home'] },
    { n: '9b', cle: 'photo', titre: 'Photo', groupe: 'Chiffres', parent: { cle: 'chiffres', vals: ['photo'] }, valeurs: [['community-05', 'Community 05'], ['data-box-02', 'Data Box 02 · 800 px'], ['the-bank-01', 'The Bank 01 · portrait'], ['the-bank-03', 'The Bank 03']], pages: ['home'] },
    { n: '9c', cle: 'cote', titre: 'Position', groupe: 'Chiffres', parent: { cle: 'chiffres', vals: ['photo'] }, valeurs: [['gauche', 'gauche'], ['droite', 'droite']], pages: ['home'] },
    { n: 11, cle: 'projets', titre: 'Section projets', groupe: 'Projets', valeurs: [['liste', 'liste des 4'], ['aucune', 'aucune']], pages: ['home'] },
    { n: 14, cle: 'logos', titre: 'Logos partenaires', groupe: 'Partenaires', valeurs: [['noir', 'noir'], ['gris', 'gris chaud'], ['couleur', 'couleur']], pages: ['home'] }
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
  var pagesHtml = [['index.html', 'home', 'Home'], ['projet-the-bank.html', 'fiche', 'Fiche'], ['projets.html', 'projets', 'Projets']].map(function (p) {
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
    panneau.querySelector('.mq__compte').textContent = n ? '· ' + n + ' ≠ défaut' : '· planche A';
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
