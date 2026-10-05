// La piste en boucle (lot 5, 05/10/2026) : la fonction Boucle de design/maquette/maquette.js, reprise sans changement — la visionneuse
// (src/components/Visionneuse.astro) en fait défiler les photos ; au message 2, les photos parcourables de la vue Réalisations s'en serviront aussi.
// Un jeu de clones avant et après les éléments ; on défile toujours dans le même sens, et en fin de défilement la piste est recentrée sans animation sur le
// jeu du milieu (invisible à l'œil). Les clics rapprochés se cumulent ; sous « réduire les animations », la piste saute d'une photo à l'autre sans défiler.
// new Boucle(piste, onmaj) : piste, l'élément qui défile (ses enfants, les photos) ; onmaj(i), appelée avec l'indice réel de la photo montrée.
// .aller(delta) avance ou recule de delta photos ; .montrer(i) montre la photo i sans animation ; .courant, l'indice montré ; .n, le nombre de photos.
var doux = !matchMedia('(prefers-reduced-motion: reduce)').matches;

function cloner(el) {
  var c = el.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.setAttribute('data-clone', '');
  c.querySelectorAll('a,button,[tabindex]').forEach(function (x) { x.setAttribute('tabindex', '-1'); });
  return c;
}

export function Boucle(piste, onmaj) {
  var self = this, items = Array.prototype.slice.call(piste.children), n = items.length, cible = null, depuis = 0, t;
  self.n = n; self.courant = 0;
  if (n > 1) {
    var avant = document.createDocumentFragment(), apres = document.createDocumentFragment();
    items.forEach(function (it) { avant.appendChild(cloner(it)); apres.appendChild(cloner(it)); });
    piste.insertBefore(avant, piste.firstChild); piste.appendChild(apres);
  }
  function pas() { var c = piste.children; return c.length > 1 ? c[1].getBoundingClientRect().left - c[0].getBoundingClientRect().left : piste.clientWidth; }   // fractionnaire : les vignettes font 342,25 px
  function indice() { return Math.round(piste.scrollLeft / pas()); }
  function reel(i) { return ((i % n) + n) % n; }
  function placer(i) { piste.scrollLeft = i * pas(); }
  function maj(i) { self.courant = reel(i); onmaj(self.courant); }
  function recentrer() {
    if (n < 2) return;
    // un défilement demandé est encore en route (clics rapprochés) : on attend qu'il arrive, au plus 1,2 s
    if (cible != null && Math.abs(piste.scrollLeft - cible * pas()) > 3) {
      var reste = 1200 - (Date.now() - depuis);
      if (reste > 0) { clearTimeout(t); t = setTimeout(recentrer, reste); return; }
    }
    var i = indice();
    if (i < n) placer(i + n); else if (i >= 2 * n) placer(i - n);
    cible = null; maj(indice());
  }
  self.aller = function (delta) {
    if (n < 2) return;
    var base = cible != null ? cible : indice();
    if (base < n || base >= 2 * n) { var d = base < n ? n : -n; placer(indice() + d); base += d; }
    cible = base + delta; depuis = Date.now(); maj(cible);
    piste.scrollTo({ left: cible * pas(), behavior: doux ? 'smooth' : 'auto' });
    if (!doux) recentrer();
  };
  self.montrer = function (i) { if (n > 1) placer(n + i); maj(i); };
  piste.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(recentrer, 150); }, { passive: true });
  if ('onscrollend' in window) piste.addEventListener('scrollend', function () { clearTimeout(t); recentrer(); });
  window.addEventListener('resize', function () { if (n > 1) placer(n + self.courant); });
  self.montrer(0);
}
