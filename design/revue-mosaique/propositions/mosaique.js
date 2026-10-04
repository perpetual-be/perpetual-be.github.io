// Lot 2b, items 10 à 12 — page de travail v4 (Cowork, 04/10 vers minuit) : la visionneuse (le panneau des versions précédentes n'existe plus ; le code reste, inactif).
// L'état est dans l'URL (?projets=221|212|212db&texte=alterne|4x4&cadrage=entiere|egale), lu dans <head> par le script de la maquette (data-* de <html>).
(function () {
  var html = document.documentElement, DEF = { projets: '221', texte: 'alterne', cadrage: 'entiere' };
  Object.keys(DEF).forEach(function (k) { if (!html.getAttribute('data-' + k)) html.setAttribute('data-' + k, DEF[k]); });
  var panneau = document.querySelector('.mo-panneau');
  if (panneau) {
  function maj() {
    Object.keys(DEF).forEach(function (k) {
      var r = panneau.querySelector('input[name="' + k + '"][value="' + html.getAttribute('data-' + k) + '"]');
      if (r) r.checked = true;
    });
  }
  panneau.addEventListener('change', function (e) {
    html.setAttribute('data-' + e.target.name, e.target.value);
    var p = new URLSearchParams(location.search); p.set(e.target.name, e.target.value);
    history.replaceState(null, '', '?' + p.toString() + location.hash);
    maj();
  });
  maj();
  }

  // visionneuse (même balisage et mêmes styles que la maquette : .visio) ; un album par bien, et celui de Brosse
  var v = document.querySelector('.visio'), piste = v.querySelector('.visio__piste'), leg = v.querySelector('.visio__legende'),
      cpt = v.querySelector('.visio__compteur'), prec = v.querySelector('[data-v-prec]'), suiv = v.querySelector('[data-v-suiv]'), retour = null, n = 0;
  function courant() { return Math.round(piste.scrollLeft / piste.clientWidth) }
  function compter() { cpt.textContent = (courant() + 1) + ' / ' + n }
  function aller(i) { piste.scrollTo({ left: ((i + n) % n) * piste.clientWidth, behavior: 'instant' }); compter() }
  function ouvrir(a, depart, depuis) {
    n = a.l.length; retour = depuis;
    piste.innerHTML = a.l.map(function (s) { return '<img src="' + s + '" alt="">' }).join('');
    leg.innerHTML = a.legende;
    prec.hidden = suiv.hidden = n < 2;
    v.hidden = false; document.body.classList.add('visio-ouverte'); piste.scrollLeft = (depart || 0) * piste.clientWidth; compter();
    v.querySelector('[data-fermer]').focus();
  }
  function fermer() { v.hidden = true; document.body.classList.remove('visio-ouverte'); if (retour) retour.focus() }
  Array.prototype.forEach.call(document.querySelectorAll('[data-album]'), function (t) {
    t.addEventListener('click', function () { ouvrir(window.ALBUMS[+t.getAttribute('data-album')], +(t.getAttribute('data-depart') || 0), t) });
  });
  piste.addEventListener('scroll', compter);
  prec.addEventListener('click', function () { aller(courant() - 1) });
  suiv.addEventListener('click', function () { aller(courant() + 1) });
  v.querySelector('[data-fermer]').addEventListener('click', fermer);
  document.addEventListener('keydown', function (e) {
    if (v.hidden) return;
    if (e.key === 'Escape') fermer();
    else if (e.key === 'ArrowLeft') aller(courant() - 1);
    else if (e.key === 'ArrowRight') aller(courant() + 1);
    else if (e.key === 'Tab') {   // Tab reste dans la visionneuse
      var f = Array.prototype.filter.call(v.querySelectorAll('button,[tabindex="0"]'), function (x) { return !x.hidden });
      var i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { f[f.length - 1].focus(); e.preventDefault() } else if (!e.shiftKey && i === f.length - 1) { f[0].focus(); e.preventDefault() }
    }
  });
})();
