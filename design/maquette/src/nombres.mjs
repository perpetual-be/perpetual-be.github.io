// Nombres en toutes lettres (orthographe traditionnelle), de 0 à 999, pour les intitulés calculés depuis les données
// (titre de la carte de la Home, lot 3, 30/09 : « Vingt adresses » ne doit pas être retouché à chaque nouveau projet).
// Aucune dépendance ; utilisé par build.mjs et vérifié par check.mjs.
const UNITES = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize'];
const DIZAINES = { 2: 'vingt', 3: 'trente', 4: 'quarante', 5: 'cinquante', 6: 'soixante' };

function deuxChiffres(n) {   // 0 à 99
  if (n <= 16) return UNITES[n];
  if (n < 20) return 'dix-' + UNITES[n - 10];
  const d = Math.floor(n / 10), u = n % 10;
  if (d === 7) return u === 1 ? 'soixante et onze' : 'soixante-' + deuxChiffres(10 + u);
  if (d === 8) return u === 0 ? 'quatre-vingts' : 'quatre-vingt-' + UNITES[u];
  if (d === 9) return 'quatre-vingt-' + deuxChiffres(10 + u);
  return DIZAINES[d] + (u === 0 ? '' : u === 1 ? ' et un' : '-' + UNITES[u]);
}

// enLettres(21) → « vingt et un » ; enLettres(21, true) → « vingt et une » (nom féminin : « vingt et une adresses »).
export function enLettres(n, feminin = false) {
  if (!Number.isInteger(n) || n < 0 || n > 999) throw new Error('enLettres : nombre hors de 0 à 999 : ' + n);
  const c = Math.floor(n / 100), r = n % 100;
  let s = !c ? deuxChiffres(r) : (c === 1 ? 'cent' : UNITES[c] + (r === 0 ? ' cents' : ' cent')) + (r === 0 ? '' : ' ' + deuxChiffres(r));
  if (feminin && /(^|[ -])un$/.test(s)) s += 'e';
  return s;
}

export const capitale = s => s.charAt(0).toUpperCase() + s.slice(1);
